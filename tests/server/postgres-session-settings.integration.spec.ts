import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { sql, closeSql } from '@/db/config';

describe.skipIf(process.env.POSTGRES_SESSION_SETTINGS_TEST !== '1')(
  'actual application PostgreSQL session settings',
  () => {
    beforeAll(() => {
      const url = new URL(process.env.TEST_DATABASE_URL!);
      if (!['127.0.0.1', 'localhost'].includes(url.hostname))
        throw new Error('Session setting integration tests require a local test database');
    });
    afterAll(async () => {
      await closeSql();
    });

    test('disables parallel workers and JIT on every new pooled connection', async () => {
      // Checking a source literal missed numeric 0 being discarded by the driver's startup
      // serializer. Reserve separate connections and ask PostgreSQL what it actually received.
      const connections = await Promise.all([sql.reserve(), sql.reserve(), sql.reserve()]);
      try {
        const settings = await Promise.all(
          connections.map(async (connection) => {
            const [row] = await connection`select pg_backend_pid() as pid,
            current_setting('max_parallel_workers_per_gather') as parallel_workers,
            current_setting('jit') as jit`;
            return row!;
          }),
        );
        expect(new Set(settings.map((row) => row.pid)).size).toBe(3);
        for (const row of settings) {
          expect(row.parallel_workers).toBe('0');
          expect(row.jit).toBe('off');
        }
      } finally {
        for (const connection of connections) connection.release();
      }
    });
  },
);
