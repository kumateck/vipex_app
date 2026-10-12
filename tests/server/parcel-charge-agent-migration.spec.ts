import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createChargeAgentMigrationFixture } from '../utils/charge-agent-migration-fixture';

const databaseUrl = process.env.CHARGE_AGENT_MIGRATION_TEST_DATABASE_URL;

describe.skipIf(!databaseUrl)('parcel charge-agent migration safety', () => {
  let fixture: ReturnType<typeof createChargeAgentMigrationFixture>;
  let sql: ReturnType<typeof createChargeAgentMigrationFixture>['sql'];
  beforeAll(async () => {
    fixture = createChargeAgentMigrationFixture(databaseUrl!);
    sql = fixture.sql;
    await fixture.ensureEmpty();
  });
  beforeEach(() => fixture.setup());
  afterEach(() => fixture.cleanup());
  afterAll(() => fixture?.close());

  async function setupProductionPendingMigrations() {
    const journal = await Bun.file('drizzle/meta/_journal.json').json();
    const previous = journal.entries.find(
      (entry: { tag: string }) => entry.tag === '0078_parcel_call_center_assignment',
    );
    await sql.unsafe(`CREATE SCHEMA drizzle;
      CREATE TABLE drizzle.__drizzle_migrations (id serial PRIMARY KEY, hash text NOT NULL, created_at bigint);
      CREATE TABLE public.pickup_queues (
        id varchar(25) PRIMARY KEY, parcel_id varchar(25), branch_id varchar(25),
        location_id varchar(25), queue_date date, queue_number integer, ended_at timestamp
      );
      CREATE UNIQUE INDEX pickup_queues_parcel_uq ON public.pickup_queues (parcel_id);
      CREATE UNIQUE INDEX pickup_queues_open_parcel_daily_uq ON public.pickup_queues (parcel_id, queue_date) WHERE ended_at IS NULL;
      CREATE UNIQUE INDEX pickup_queues_daily_code_uq ON public.pickup_queues (branch_id, location_id, queue_date, queue_number);
      INSERT INTO public.pickup_queues VALUES ('ticket-a', 'parcel-a', 'branch-a', 'location-a', '2026-10-12', 1, NULL);`);
    await sql`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('production-baseline', ${previous.when})`;
  }

  test('applies both production-pending migrations while preserving parcel and ticket data', async () => {
    await setupProductionPendingMigrations();
    await migrate(drizzle(sql), { migrationsFolder: './drizzle' });
    const [parcel] = await sql`SELECT * FROM public.parcels`;
    expect(parcel).toMatchObject({
      id: 'parcel-a',
      charge_psw: '1200',
      planned_tobepaid_psw: '700',
      status: 5,
      charge_agent_user_id: null,
    });
    const [ticket] = await sql`SELECT id, queue_number FROM public.pickup_queues`;
    expect(ticket).toMatchObject({ id: 'ticket-a', queue_number: 1 });
    const [legacy] = await sql`SELECT to_regclass('public.pickup_queues_parcel_uq') AS name`;
    expect(legacy?.name).toBeNull();
    expect(await sql`SELECT id FROM drizzle.__drizzle_migrations`).toHaveLength(3);
  });

  test('rolls back the entire pending migration batch when the new column cannot acquire its lock', async () => {
    await setupProductionPendingMigrations();
    await sql.begin(async (tx) => {
      await tx.unsafe('LOCK TABLE public.parcels IN ACCESS SHARE MODE');
      await expect(migrate(drizzle(sql), { migrationsFolder: './drizzle' })).rejects.toMatchObject({
        cause: { code: '55P03' },
      });
    });
    const [legacy] = await sql`SELECT to_regclass('public.pickup_queues_parcel_uq') AS name`;
    expect(legacy?.name).toBe('pickup_queues_parcel_uq');
    expect(await sql`SELECT id FROM drizzle.__drizzle_migrations`).toHaveLength(1);
    expect(
      await sql`SELECT attname FROM pg_attribute WHERE attrelid = 'public.parcels'::regclass AND attname = 'charge_agent_user_id'`,
    ).toHaveLength(0);
  });

  test('the standard migrator applies the registered repair after the previous journal entry', async () => {
    const journal = await Bun.file('drizzle/meta/_journal.json').json();
    const previous = journal.entries.find(
      (entry: { tag: string }) => entry.tag === '0079_pickup_queue_legacy_uniqueness',
    );
    await sql.unsafe(`CREATE SCHEMA drizzle;
      CREATE TABLE drizzle.__drizzle_migrations (id serial PRIMARY KEY, hash text NOT NULL, created_at bigint);`);
    await sql`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('fixture-baseline', ${previous.when})`;
    await migrate(drizzle(sql), { migrationsFolder: './drizzle' });
    const ledger =
      await sql`SELECT created_at FROM drizzle.__drizzle_migrations ORDER BY created_at`;
    expect(ledger).toHaveLength(
      journal.entries.filter((entry: { when: number }) => entry.when >= previous.when).length,
    );
    expect(Number(ledger.at(-1)?.created_at)).toBe(journal.entries.at(-1).when);
    const [parcel] = await sql`SELECT charge_agent_user_id FROM public.parcels`;
    expect(parcel?.charge_agent_user_id).toBeNull();
  });

  test('adds a nullable column without changing parcels or payment amounts', async () => {
    await fixture.apply();
    const [parcel] = await sql`SELECT * FROM public.parcels`;
    expect(parcel).toMatchObject({
      id: 'parcel-a',
      status: 5,
      charge_psw: '1200',
      planned_tobepaid_psw: '700',
      charge_agent_user_id: null,
    });
    const [fk] =
      await sql`SELECT convalidated FROM pg_constraint WHERE conrelid = 'public.parcels'::regclass AND contype = 'f'`;
    expect(fk?.convalidated).toBe(false);
    await expect(
      Promise.resolve(sql`UPDATE public.parcels SET charge_agent_user_id = 'unknown'`),
    ).rejects.toThrow();
    await sql`UPDATE public.parcels SET charge_agent_user_id = 'staff-a'`;
    await sql`ALTER TABLE public.parcels VALIDATE CONSTRAINT parcels_charge_agent_user_id_users_id_fk`;
  });

  test('preserves existing assignments and an equivalent validated FK on repeated runs', async () => {
    await sql.unsafe(`ALTER TABLE public.parcels ADD COLUMN charge_agent_user_id varchar(25) REFERENCES public.users(id);
      UPDATE public.parcels SET charge_agent_user_id = 'staff-a';`);
    await fixture.apply();
    await fixture.apply();
    const [parcel] = await sql`SELECT charge_agent_user_id FROM public.parcels`;
    expect(parcel?.charge_agent_user_id).toBe('staff-a');
    const keys =
      await sql`SELECT convalidated FROM pg_constraint WHERE conrelid = 'public.parcels'::regclass AND contype = 'f'`;
    expect(keys).toHaveLength(1);
    expect(keys[0]?.convalidated).toBe(true);
  });

  test('no-op against an aligned schema does not wait for a parcel write lock', async () => {
    await sql`ALTER TABLE public.parcels ADD COLUMN charge_agent_user_id varchar(25) REFERENCES public.users(id)`;
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
      await sql`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'parcels' AND column_name = 'charge_agent_user_id'`;
    expect(columns).toHaveLength(0);
  });

  test('rejects incompatible column types and preserves their contents', async () => {
    await sql.unsafe(`ALTER TABLE public.parcels ADD COLUMN charge_agent_user_id text;
      UPDATE public.parcels SET charge_agent_user_id = 'legacy-value';`);
    await expect(fixture.apply()).rejects.toThrow('review schema drift');
    const [parcel] = await sql`SELECT charge_agent_user_id FROM public.parcels`;
    expect(parcel?.charge_agent_user_id).toBe('legacy-value');
  });

  test('preserves pre-existing orphan assignments and enforces new writes without an inline scan', async () => {
    await sql.unsafe(`ALTER TABLE public.parcels ADD COLUMN charge_agent_user_id varchar(25);
      UPDATE public.parcels SET charge_agent_user_id = 'orphan';`);
    await fixture.apply();
    const [parcel] = await sql`SELECT charge_agent_user_id FROM public.parcels`;
    expect(parcel?.charge_agent_user_id).toBe('orphan');
    await expect(
      Promise.resolve(
        sql`ALTER TABLE public.parcels VALIDATE CONSTRAINT parcels_charge_agent_user_id_users_id_fk`,
      ),
    ).rejects.toThrow();
    await expect(
      Promise.resolve(sql`INSERT INTO public.parcels VALUES ('parcel-b', 5, 0, 0, 'orphan')`),
    ).rejects.toThrow();
  });

  test('rejects conflicting foreign keys without replacing them', async () => {
    await sql.unsafe(`CREATE TABLE public.wrong_users (id varchar(25) PRIMARY KEY);
      ALTER TABLE public.parcels ADD COLUMN charge_agent_user_id varchar(25) REFERENCES public.wrong_users(id);`);
    await expect(fixture.apply()).rejects.toThrow('Conflicting parcel charge-agent foreign key');
    const [key] =
      await sql`SELECT confrelid::regclass::text AS target FROM pg_constraint WHERE conrelid = 'public.parcels'::regclass AND contype = 'f'`;
    expect(key?.target).toBe('wrong_users');
  });
});
