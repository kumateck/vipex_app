import { describe, expect, test } from 'bun:test';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { db } from '@/db/config';
import { DatabaseSelfServiceSessionStore } from '@/server/features/self-service/session-store';
import {
  createSelfServiceSessionToken,
  validateSelfServiceSessionSvc,
  consumeSelfServiceSessionSvc,
} from '@/server/features/self-service/session.service';

// Apply only the new migration in an isolated test schema. Never touch deployed session rows.
describe('database self-service sessions', () => {
  test('survives connection recreation and consumes once across independent connections', async () => {
    const schema = `test_self_service_${crypto.randomUUID().replaceAll('-', '')}`;
    const url = process.env.TEST_DATABASE_URL;
    if (!url) throw new Error('TEST_DATABASE_URL is required');
    await db.execute(sql.raw(`CREATE SCHEMA "${schema}"`));
    const options = { max: 1, connection: { search_path: schema }, onnotice: () => {} };
    const issuingClient = postgres(url, options);
    const validatingClient = postgres(url, options);
    const restartedClient = postgres(url, options);
    try {
      const migration = await Bun.file('drizzle/0087_self_service_sessions.sql').text();
      await issuingClient.begin(async (tx) => {
        await tx.unsafe(migration);
      });
      const issuer = new DatabaseSelfServiceSessionStore(drizzle(issuingClient));
      const session = await createSelfServiceSessionToken({ branchId: 'branch-a', cache: issuer });
      const input = { branchId: 'branch-a', sessionToken: session.sessionToken };
      const stored = await issuingClient`SELECT key, payload FROM self_service_sessions`;
      expect(String(stored[0]?.key)).not.toContain(session.sessionToken);
      expect(String(stored[0]?.payload)).not.toContain(session.sessionToken);
      await issuingClient.end();
      const validator = new DatabaseSelfServiceSessionStore(drizzle(validatingClient));
      const restarted = new DatabaseSelfServiceSessionStore(drizzle(restartedClient));
      expect(await validateSelfServiceSessionSvc({ ...input, cache: restarted })).toMatchObject({
        branchId: 'branch-a',
      });
      await expect(
        consumeSelfServiceSessionSvc({ ...input, branchId: 'branch-b', cache: validator }),
      ).rejects.toMatchObject({ status: 410 });
      const results = await Promise.allSettled([
        consumeSelfServiceSessionSvc({ ...input, cache: restarted }),
        consumeSelfServiceSessionSvc({ ...input, cache: validator }),
      ]);
      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      const rejected = results.find((result) => result.status === 'rejected');
      expect(rejected?.status === 'rejected' && rejected.reason.status).toBe(410);
      const fresh = await createSelfServiceSessionToken({ branchId: 'branch-a', cache: validator });
      expect(fresh.sessionToken).not.toBe(session.sessionToken);
      expect(
        await validateSelfServiceSessionSvc({
          branchId: 'branch-a',
          sessionToken: fresh.sessionToken,
          cache: restarted,
        }),
      ).toMatchObject({ branchId: 'branch-a' });
    } finally {
      await Promise.all([issuingClient.end(), validatingClient.end(), restartedClient.end()]);
      await db.execute(sql.raw(`DROP SCHEMA "${schema}" CASCADE`));
    }
  });
});
