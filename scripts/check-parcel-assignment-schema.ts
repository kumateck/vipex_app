import { config as loadEnv } from 'dotenv';
import postgres from 'postgres';

loadEnv({ path: '.env', quiet: true });
const databaseUrl = process.env.CHECK_DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('CHECK_DATABASE_URL or DATABASE_URL is required');

const expectedColumns = [
  'call_center_assigned_to_user_id',
  'call_center_called_at',
  'shelf_picker_staff_id',
  'processed_by',
  'sender_name_snapshot',
  'receiver_name_snapshot',
  'second_receiver_name_snapshot',
  'delivery_confirmation_snapshot',
];

const sql = postgres(databaseUrl, {
  max: 1,
  connect_timeout: 5,
  onnotice: () => {},
  connection: { default_transaction_read_only: true, statement_timeout: 10000 },
});

try {
  const report = await sql.begin(async (tx) => {
    await tx.unsafe('SET TRANSACTION READ ONLY');
    const [identity] = await tx.unsafe(`
      SELECT current_database() AS database, current_setting('server_version') AS version,
        current_setting('search_path') AS search_path, to_regclass('parcels')::text AS parcels_relation,
        current_setting('transaction_read_only') AS read_only
    `);
    const parcelColumns = await tx.unsafe(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'parcels'
      ORDER BY column_name
    `);
    const columns = parcelColumns.filter((column) => expectedColumns.includes(column.column_name));
    const constraints = await tx.unsafe(`
      SELECT conname AS name, convalidated AS validated, pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE conrelid = to_regclass('public.parcels') AND contype = 'f'
        AND pg_get_constraintdef(oid) LIKE '%call_center_assigned_to_user_id%'
    `);
    const parcelTables = await tx.unsafe(`
      SELECT table_schema FROM information_schema.tables WHERE table_name = 'parcels'
      ORDER BY table_schema
    `);
    const pickupQueueIndexes = await tx.unsafe(`
      SELECT i.relname AS name, x.indisunique AS unique, x.indisvalid AS valid,
        pg_get_indexdef(x.indexrelid) AS definition
      FROM pg_index x JOIN pg_class i ON i.oid = x.indexrelid
      WHERE x.indrelid = to_regclass('public.pickup_queues')
      ORDER BY i.relname
    `);
    const [ledgerTable] = await tx.unsafe(`
      SELECT to_regclass('drizzle.__drizzle_migrations') IS NOT NULL AS exists
    `);
    const ledger = ledgerTable?.exists
      ? await tx.unsafe(
          'SELECT id, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 5',
        )
      : [];
    const journal = await Bun.file('drizzle/meta/_journal.json').json();
    const latestApplied = Number(ledger[0]?.created_at ?? 0);
    return {
      identity,
      parcelTableSchemas: parcelTables.map((table) => table.table_schema),
      columns,
      missingColumns: expectedColumns.filter(
        (name) => !columns.some((column) => column.column_name === name),
      ),
      assignmentForeignKeys: constraints,
      pickupQueueIndexes,
      migrationLedgerExists: ledgerTable?.exists ?? false,
      latestLedgerEntries: ledger,
      pendingMigrationTags: journal.entries
        .filter((entry: { when: number }) => entry.when > latestApplied)
        .map((entry: { tag: string }) => entry.tag),
    };
  });
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Schema check failed');
  process.exitCode = 1;
} finally {
  await sql.end();
}
