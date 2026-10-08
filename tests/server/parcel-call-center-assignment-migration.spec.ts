import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createCallCenterMigrationFixture } from '../utils/call-center-migration-fixture';

const databaseUrl = process.env.MIGRATION_TEST_DATABASE_URL;

describe.skipIf(!databaseUrl)('call-center assignment migration safety', () => {
  let fixture: ReturnType<typeof createCallCenterMigrationFixture>;
  let sql: ReturnType<typeof createCallCenterMigrationFixture>['sql'];
  beforeAll(async () => {
    fixture = createCallCenterMigrationFixture(databaseUrl!);
    sql = fixture.sql;
    await fixture.ensureEmpty();
  });
  beforeEach(() => fixture.setup());
  afterEach(() => fixture.cleanup());
  afterAll(() => fixture?.close());

  test('the standard migrator applies the registered repair after the previous journal entry', async () => {
    const journal = await Bun.file('drizzle/meta/_journal.json').json();
    const previous = journal.entries.at(-2);
    await sql.unsafe(`CREATE SCHEMA drizzle;
      CREATE TABLE drizzle.__drizzle_migrations (id serial PRIMARY KEY, hash text NOT NULL, created_at bigint);`);
    await sql`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('fixture-baseline', ${previous.when})`;
    await migrate(drizzle(sql), { migrationsFolder: './drizzle' });
    const ledger =
      await sql`SELECT created_at FROM drizzle.__drizzle_migrations ORDER BY created_at`;
    expect(ledger).toHaveLength(2);
    expect(Number(ledger[1]?.created_at)).toBe(journal.entries.at(-1).when);
    const [parcel] = await sql`SELECT call_center_assigned_to_user_id FROM public.parcels`;
    expect(parcel?.call_center_assigned_to_user_id).toBeNull();
  });

  test('adds a nullable column without changing parcels or payment amounts', async () => {
    await fixture.apply();
    const [parcel] = await sql`SELECT * FROM public.parcels`;
    expect(parcel).toMatchObject({
      id: 'parcel-a',
      status: 5,
      charge_psw: '1200',
      planned_tobepaid_psw: '700',
      call_center_assigned_to_user_id: null,
    });
    const [fk] =
      await sql`SELECT convalidated FROM pg_constraint WHERE conrelid = 'public.parcels'::regclass AND contype = 'f'`;
    expect(fk?.convalidated).toBe(false);
    await expect(
      Promise.resolve(sql`UPDATE public.parcels SET call_center_assigned_to_user_id = 'unknown'`),
    ).rejects.toThrow();
    await sql`UPDATE public.parcels SET call_center_assigned_to_user_id = 'staff-a'`;
    await sql`ALTER TABLE public.parcels VALIDATE CONSTRAINT parcels_call_center_assigned_to_user_id_users_id_fk`;
  });

  test('preserves existing assignments and an equivalent validated FK on repeated runs', async () => {
    await sql.unsafe(`ALTER TABLE public.parcels ADD COLUMN call_center_assigned_to_user_id varchar(25) REFERENCES public.users(id);
      UPDATE public.parcels SET call_center_assigned_to_user_id = 'staff-a';`);
    await fixture.apply();
    await fixture.apply();
    const [parcel] = await sql`SELECT call_center_assigned_to_user_id FROM public.parcels`;
    expect(parcel?.call_center_assigned_to_user_id).toBe('staff-a');
    const keys =
      await sql`SELECT convalidated FROM pg_constraint WHERE conrelid = 'public.parcels'::regclass AND contype = 'f'`;
    expect(keys).toHaveLength(1);
    expect(keys[0]?.convalidated).toBe(true);
  });

  test('no-op against an aligned schema does not wait for a parcel write lock', async () => {
    await sql`ALTER TABLE public.parcels ADD COLUMN call_center_assigned_to_user_id varchar(25) REFERENCES public.users(id)`;
    await sql.begin(async (tx) => {
      await tx.unsafe("UPDATE public.parcels SET charge_psw = charge_psw WHERE id = 'parcel-a'");
      await fixture.apply();
    });
    expect(await sql`SELECT id FROM public.parcels`).toHaveLength(1);
  });

  test('times out and rolls back when a missing-column repair cannot acquire its lock', async () => {
    await sql.begin(async (tx) => {
      await tx.unsafe('LOCK TABLE public.parcels IN ACCESS SHARE MODE');
      const started = Date.now();
      await expect(fixture.apply()).rejects.toThrow('lock timeout');
      expect(Date.now() - started).toBeLessThan(6000);
    });
    const columns =
      await sql`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'parcels' AND column_name = 'call_center_assigned_to_user_id'`;
    expect(columns).toHaveLength(0);
  });

  test('rejects incompatible column types and preserves their contents', async () => {
    await sql.unsafe(`ALTER TABLE public.parcels ADD COLUMN call_center_assigned_to_user_id text;
      UPDATE public.parcels SET call_center_assigned_to_user_id = 'legacy-value';`);
    await expect(fixture.apply()).rejects.toThrow('review schema drift');
    const [parcel] = await sql`SELECT call_center_assigned_to_user_id FROM public.parcels`;
    expect(parcel?.call_center_assigned_to_user_id).toBe('legacy-value');
  });

  test('preserves pre-existing orphan assignments and enforces new writes without an inline scan', async () => {
    await sql.unsafe(`ALTER TABLE public.parcels ADD COLUMN call_center_assigned_to_user_id varchar(25);
      UPDATE public.parcels SET call_center_assigned_to_user_id = 'orphan';`);
    await fixture.apply();
    const [parcel] = await sql`SELECT call_center_assigned_to_user_id FROM public.parcels`;
    expect(parcel?.call_center_assigned_to_user_id).toBe('orphan');
    await expect(
      Promise.resolve(
        sql`ALTER TABLE public.parcels VALIDATE CONSTRAINT parcels_call_center_assigned_to_user_id_users_id_fk`,
      ),
    ).rejects.toThrow();
    await expect(
      Promise.resolve(sql`INSERT INTO public.parcels VALUES ('parcel-b', 5, 0, 0, 'orphan')`),
    ).rejects.toThrow();
  });

  test('rejects conflicting foreign keys without replacing them', async () => {
    await sql.unsafe(`CREATE TABLE public.wrong_users (id varchar(25) PRIMARY KEY);
      ALTER TABLE public.parcels ADD COLUMN call_center_assigned_to_user_id varchar(25) REFERENCES public.wrong_users(id);`);
    await expect(fixture.apply()).rejects.toThrow('Conflicting call-center assignment foreign key');
    const [key] =
      await sql`SELECT confrelid::regclass::text AS target FROM pg_constraint WHERE conrelid = 'public.parcels'::regclass AND contype = 'f'`;
    expect(key?.target).toBe('wrong_users');
  });
});
