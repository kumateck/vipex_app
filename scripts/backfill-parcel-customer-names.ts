import { config as loadEnv } from 'dotenv';
import postgres from 'postgres';

loadEnv({ path: '.env' });
loadEnv({ path: '.env.test', override: false });
loadEnv({ path: '.env.test.local', override: false });

const apply = process.argv.includes('--apply');
const batchSize = 500;
const pauseMs = 50;
const databaseUrl =
  process.env.MIGRATE_TARGET === 'test' || process.env.NODE_ENV === 'test'
    ? process.env.TEST_DATABASE_URL
    : process.env.MIGRATE_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) throw new Error('Database URL is not configured');

const sql = postgres(databaseUrl, { max: 1 });

const pendingQuery = `
  SELECT id FROM parcels
  WHERE sender_name_snapshot IS NULL
     OR receiver_name_snapshot IS NULL
     OR (second_receiver_id IS NOT NULL AND second_receiver_name_snapshot IS NULL)
  LIMIT 1
`;

const batchQuery = `
  WITH batch AS MATERIALIZED (
    SELECT id FROM parcels
    WHERE id > $1
      AND (sender_name_snapshot IS NULL
        OR receiver_name_snapshot IS NULL
        OR (second_receiver_id IS NOT NULL AND second_receiver_name_snapshot IS NULL))
    ORDER BY id
    LIMIT $2
    FOR UPDATE
  ), updated AS (
    UPDATE parcels AS p
    SET sender_name_snapshot = COALESCE(p.sender_name_snapshot, sender.fullname),
        receiver_name_snapshot = COALESCE(p.receiver_name_snapshot, receiver.fullname),
        second_receiver_name_snapshot = CASE
          WHEN p.second_receiver_id IS NULL THEN NULL
          ELSE COALESCE(p.second_receiver_name_snapshot, second_receiver.fullname)
        END
    FROM batch
    JOIN parcels AS selected ON selected.id = batch.id
    JOIN customers AS sender ON sender.id = selected.sender_id
      AND sender.company_id = selected.company_id
      AND NULLIF(BTRIM(sender.fullname), '') IS NOT NULL
    JOIN customers AS receiver ON receiver.id = selected.receiver_id
      AND receiver.company_id = selected.company_id
      AND NULLIF(BTRIM(receiver.fullname), '') IS NOT NULL
    LEFT JOIN customers AS second_receiver ON second_receiver.id = selected.second_receiver_id
      AND second_receiver.company_id = selected.company_id
      AND NULLIF(BTRIM(second_receiver.fullname), '') IS NOT NULL
    WHERE p.id = batch.id
      AND (selected.second_receiver_id IS NULL OR second_receiver.id IS NOT NULL)
    RETURNING p.id
  )
  SELECT (SELECT MAX(id) FROM batch) AS last_id,
         (SELECT COUNT(*) FROM batch)::int AS selected_count,
         (SELECT COUNT(*) FROM updated)::int AS updated_count
`;

async function main() {
  const [migration] = await sql`
    SELECT 1 AS applied FROM drizzle.__drizzle_migrations
    WHERE created_at = 1790000500000 LIMIT 1
  `;
  if (!migration) throw new Error('Apply migration 0073 before running the backfill');

  const pending = await sql.unsafe(pendingQuery);
  if (!apply) {
    console.log(
      pending.length
        ? 'Parcel name snapshots are pending. Run with --apply to backfill in batches.'
        : 'Parcel name snapshots are complete.',
    );
    return;
  }

  let cursor = '';
  let total = 0;
  while (true) {
    const [batch] = await sql.begin(async (tx) => {
      await tx.unsafe("SET LOCAL lock_timeout = '2s'");
      await tx.unsafe("SET LOCAL statement_timeout = '15s'");
      const rows = await tx.unsafe(batchQuery, [cursor, batchSize]);
      if (rows[0]?.updated_count !== rows[0]?.selected_count) {
        throw new Error(
          `Backfill stopped near parcel ${rows[0]?.last_id}: customer data is missing or invalid`,
        );
      }
      return rows;
    });
    if (!batch?.selected_count) break;
    cursor = batch.last_id;
    total += batch.updated_count;
    console.log(`Backfilled ${total} parcels; last ID ${cursor}`);
    await Bun.sleep(pauseMs);
  }

  const remaining = await sql.unsafe(pendingQuery);
  if (remaining[0]) {
    throw new Error(`Backfill incomplete near parcel ${remaining[0].id}; rerun the script`);
  }
  console.log(`Parcel name backfill complete (${total} rows updated).`);
}

try {
  await main();
} finally {
  await sql.end();
}
