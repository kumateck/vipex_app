import postgres from 'postgres';

export function createChargeAgentMigrationFixture(databaseUrl: string) {
  const url = new URL(databaseUrl);
  if (
    !['localhost', '127.0.0.1'].includes(url.hostname) ||
    url.pathname !== '/vipex_charge_agent_migration_test'
  ) {
    throw new Error(
      'Migration tests require the dedicated local vipex_charge_agent_migration_test database',
    );
  }
  const sql = postgres(databaseUrl, { max: 3, onnotice: () => {} });
  const migrationFile = Bun.file('drizzle/0080_parcel_charge_agent.sql');
  return {
    sql,
    async ensureEmpty() {
      const [result] =
        await sql`SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema = 'public'`;
      if (result?.count !== 0) throw new Error('Migration test database must be empty');
    },
    async setup() {
      await sql.unsafe(`
        CREATE TABLE public.users (id varchar(25) PRIMARY KEY);
        CREATE TABLE public.parcels (
          id varchar(25) PRIMARY KEY, status smallint NOT NULL,
          charge_psw bigint NOT NULL, planned_tobepaid_psw bigint NOT NULL
        );
        INSERT INTO public.users VALUES ('staff-a');
        INSERT INTO public.parcels VALUES ('parcel-a', 5, 1200, 700);
      `);
    },
    async apply() {
      const migration = await migrationFile.text();
      await sql.begin(async (tx) => {
        await tx.unsafe(migration);
      });
    },
    async cleanup() {
      await sql.unsafe(
        'DROP TABLE IF EXISTS public.pickup_queues; DROP TABLE IF EXISTS public.parcels; DROP TABLE IF EXISTS public.users; DROP TABLE IF EXISTS public.wrong_users; DROP SCHEMA IF EXISTS drizzle CASCADE;',
      );
    },
    async close() {
      await sql.end();
    },
  };
}
