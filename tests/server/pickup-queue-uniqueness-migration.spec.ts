import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { createCallCenterMigrationFixture } from '../utils/call-center-migration-fixture';

const databaseUrl = process.env.MIGRATION_TEST_DATABASE_URL;
describe.skipIf(!databaseUrl)('pickup queue uniqueness repair safety', () => {
  let fixture: ReturnType<typeof createCallCenterMigrationFixture>;
  let sql: ReturnType<typeof createCallCenterMigrationFixture>['sql'];
  beforeAll(async () => {
    fixture = createCallCenterMigrationFixture(databaseUrl!);
    sql = fixture.sql;
    await fixture.ensureEmpty();
  });
  beforeEach(async () => {
    await fixture.setup();
    await sql.unsafe(`CREATE TABLE public.pickup_queues (
      id serial PRIMARY KEY, parcel_id varchar(25) NOT NULL, branch_id varchar(25) NOT NULL,
      location_id varchar(25), queue_date timestamp NOT NULL, queue_number integer NOT NULL,
      ended_at timestamp, CONSTRAINT pickup_queues_parcel_uq UNIQUE (parcel_id));
      CREATE UNIQUE INDEX pickup_queues_open_parcel_daily_uq ON public.pickup_queues (parcel_id, queue_date) WHERE ended_at IS NULL;
      CREATE UNIQUE INDEX pickup_queues_daily_code_uq ON public.pickup_queues (branch_id, location_id, queue_date, queue_number);
      INSERT INTO public.pickup_queues (parcel_id, branch_id, location_id, queue_date, queue_number, ended_at)
      VALUES ('parcel-a', 'branch-a', 'location-a', '2026-10-07', 1, '2026-10-07');`);
  });
  afterEach(async () => {
    await sql.unsafe('DROP TABLE IF EXISTS public.pickup_queues');
    await fixture.cleanup();
  });
  afterAll(() => fixture?.close());
  const apply = async () => {
    const migration = await Bun.file('drizzle/0079_pickup_queue_legacy_uniqueness.sql').text();
    await sql.begin(async (tx) => {
      await tx.unsafe(migration);
    });
  };

  test('removes only the legacy key, preserves tickets, and retains both daily protections', async () => {
    const indexesBefore =
      await sql`SELECT oid FROM pg_class WHERE relname IN ('pickup_queues_open_parcel_daily_uq', 'pickup_queues_daily_code_uq') ORDER BY oid`;
    await apply();
    await apply();
    const [ended] = await sql`SELECT * FROM public.pickup_queues`;
    expect(ended?.ended_at).not.toBeNull();
    expect(ended?.queue_number).toBe(1);
    const indexesAfter =
      await sql`SELECT oid FROM pg_class WHERE relname IN ('pickup_queues_open_parcel_daily_uq', 'pickup_queues_daily_code_uq') ORDER BY oid`;
    expect([...indexesAfter]).toEqual([...indexesBefore]);
    await sql.unsafe(`INSERT INTO public.pickup_queues (parcel_id, branch_id, location_id, queue_date, queue_number)
      VALUES ('parcel-a', 'branch-a', 'location-a', '2026-10-08', 2), ('parcel-a', 'branch-a', 'location-a', '2026-10-07', 3);`);
    await expect(
      Promise.resolve(
        sql.unsafe(`INSERT INTO public.pickup_queues (parcel_id, branch_id, location_id, queue_date, queue_number)
      VALUES ('parcel-a', 'branch-a', 'location-a', '2026-10-08', 4)`),
      ),
    ).rejects.toThrow('pickup_queues_open_parcel_daily_uq');
    await expect(
      Promise.resolve(
        sql.unsafe(`INSERT INTO public.pickup_queues (parcel_id, branch_id, location_id, queue_date, queue_number)
      VALUES ('parcel-b', 'branch-a', 'location-a', '2026-10-08', 2)`),
      ),
    ).rejects.toThrow('pickup_queues_daily_code_uq');
    expect(await sql`SELECT id FROM public.pickup_queues`).toHaveLength(3);
  });

  test('refuses to remove the old key when a replacement index is missing', async () => {
    await sql.unsafe('DROP INDEX public.pickup_queues_open_parcel_daily_uq');
    await expect(apply()).rejects.toThrow('refusing to remove legacy key');
    const [key] = await sql`SELECT to_regclass('public.pickup_queues_parcel_uq') AS name`;
    expect(key?.name).toBe('pickup_queues_parcel_uq');
  });

  test('rejects an index with the right name but incorrect columns', async () => {
    await sql.unsafe(`DROP INDEX public.pickup_queues_daily_code_uq;
      CREATE UNIQUE INDEX pickup_queues_daily_code_uq ON public.pickup_queues (queue_number);`);
    await expect(apply()).rejects.toThrow('refusing to remove legacy key');
  });

  test('rolls back after lock timeout, and an aligned schema needs no table lock', async () => {
    await sql.begin(async (tx) => {
      await tx.unsafe('LOCK TABLE public.pickup_queues IN ACCESS SHARE MODE');
      await expect(apply()).rejects.toThrow('lock timeout');
    });
    const [key] = await sql`SELECT to_regclass('public.pickup_queues_parcel_uq') AS name`;
    expect(key?.name).toBe('pickup_queues_parcel_uq');
    await apply();
    await sql.begin(async (tx) => {
      await tx.unsafe('LOCK TABLE public.pickup_queues IN ACCESS EXCLUSIVE MODE');
      await apply();
    });
  });

  test('repairs a standalone legacy unique index too', async () => {
    await sql.unsafe(`ALTER TABLE public.pickup_queues DROP CONSTRAINT pickup_queues_parcel_uq;
      CREATE UNIQUE INDEX pickup_queues_parcel_uq ON public.pickup_queues (parcel_id);`);
    await apply();
    const [key] = await sql`SELECT to_regclass('public.pickup_queues_parcel_uq') AS name`;
    expect(key?.name).toBeNull();
  });
});
