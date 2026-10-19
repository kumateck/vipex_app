import { describe, expect, test } from 'bun:test';

describe('parcel search performance safeguards', () => {
  test('registers the search index migration after 0082', async () => {
    const journal = await Bun.file('drizzle/meta/_journal.json').json();
    const tags = journal.entries.map((entry: { tag: string }) => entry.tag);
    expect(tags.indexOf('0083_parcel_search_indexes')).toBe(
      tags.indexOf('0082_location_service_capabilities') + 1,
    );
  });

  test('creates branch/status and pickup-queue parcel indexes idempotently with a lock timeout', async () => {
    const migration = await Bun.file('drizzle/0083_parcel_search_indexes.sql').text();
    expect(migration).toContain("SET LOCAL lock_timeout = '3s'");
    expect(migration).toContain(
      'CREATE INDEX IF NOT EXISTS "parcels_company_destination_status_idx" ON "parcels" ("company_id", "destination_id", "status")',
    );
    expect(migration).toContain(
      'CREATE INDEX IF NOT EXISTS "pickup_queues_parcel_idx" ON "pickup_queues" ("parcel_id")',
    );
  });

  test('disables PostgreSQL JIT for the shared app connection', async () => {
    // JIT compilation measured at 5.0s of a 5.7s parcel search in production.
    const config = await Bun.file('src/db/config.ts').text();
    expect(config).toContain("jit: 'off'");
  });

  test('avoids parallel-query shared-memory exhaustion on app connections', async () => {
    const config = await Bun.file('src/db/config.ts').text();
    expect(config).toContain("max_parallel_workers_per_gather: '0'");
  });
});
