import { config as loadEnv } from 'dotenv';
import postgres from 'postgres';

loadEnv({ path: '.env', quiet: true });
const databaseUrl = process.env.CHECK_DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('CHECK_DATABASE_URL or DATABASE_URL is required');
const serial = process.argv.includes('--serial');

// All connections, including the application repository's shared connection, are read-only.
const client = postgres(databaseUrl, {
  max: 2,
  connect_timeout: 5,
  onnotice: () => {},
  connection: {
    default_transaction_read_only: true,
    statement_timeout: 15000,
    jit: 'off',
    ...(serial ? { max_parallel_workers_per_gather: 0 } : {}),
  },
});
(globalThis as typeof globalThis & { __vipex_sql__?: typeof client }).__vipex_sql__ = client;

try {
  const [identity] = await client`select current_database() as database,
    current_setting('transaction_read_only') as read_only`;
  const code = process.argv
    .slice(2)
    .find((argument) => !argument.startsWith('--'))
    ?.trim();
  const [sample] = code
    ? await client`select booking_code, company_id, source_id, destination_id from parcels
        where booking_code = ${code} and not is_deleted limit 1`
    : await client`select booking_code, company_id, source_id, destination_id from parcels
        where not is_deleted limit 1`;
  console.log(JSON.stringify({ identity, serial, sampleFound: Boolean(sample) }));
  if (!sample) throw new Error('No matching booking found for the read-only diagnostic');
  const { listParcelsRepo } = await import('../src/server/features/shipments/parcels.repository');
  for (const side of ['sourceId', 'destinationId'] as const) {
    const startedAt = performance.now();
    try {
      const response = await listParcelsRepo({
        companyId: sample.company_id,
        [side]: side === 'sourceId' ? sample.source_id : sample.destination_id,
        search: sample.booking_code,
        limit: 50,
        offset: 0,
        includeDeleted: false,
      });
      console.log(
        JSON.stringify({
          side,
          ok: true,
          rows: response.data.length,
          total: response.totalRecords,
          elapsedMs: Math.round(performance.now() - startedAt),
        }),
      );
    } catch (error) {
      const cause = error instanceof Error && error.cause ? error.cause : error;
      const detail = cause as { code?: string; message?: string };
      console.log(
        JSON.stringify({
          side,
          ok: false,
          code: detail.code,
          message: detail.message?.slice(0, 300),
          elapsedMs: Math.round(performance.now() - startedAt),
        }),
      );
      process.exitCode = 1;
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Booking search check failed');
  process.exitCode = 1;
} finally {
  await client.end();
}
