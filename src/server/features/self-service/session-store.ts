import { eq, lte } from 'drizzle-orm';
import { db } from '@/db/config';
import { selfServiceSessions } from '@/db/schemas';
import type { CacheStore } from '@/server/services/cache/cache.types';

export type SelfServiceSessionStore = Pick<CacheStore, 'get' | 'take' | 'set' | 'del'>;
type Executor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export class DatabaseSelfServiceSessionStore implements SelfServiceSessionStore {
  constructor(private readonly executor: Executor = db) {}

  async get(key: string) {
    const [row] = await this.executor
      .select({ payload: selfServiceSessions.payload })
      .from(selfServiceSessions)
      .where(eq(selfServiceSessions.key, key))
      .limit(1);
    return row?.payload ?? null;
  }

  async take(key: string) {
    // DELETE RETURNING gives one successful consumer, even across app instances.
    const [row] = await this.executor
      .delete(selfServiceSessions)
      .where(eq(selfServiceSessions.key, key))
      .returning({ payload: selfServiceSessions.payload });
    return row?.payload ?? null;
  }

  async set(key: string, payload: string) {
    const session = JSON.parse(payload) as { expiresAt: string };
    await this.executor.insert(selfServiceSessions).values({
      key,
      payload,
      expiresAt: new Date(session.expiresAt),
    });
  }

  async del(key: string) {
    await this.executor.delete(selfServiceSessions).where(eq(selfServiceSessions.key, key));
  }
}

const sessionStore = new DatabaseSelfServiceSessionStore();
export const getSelfServiceSessionStore = (): SelfServiceSessionStore => sessionStore;

export async function sweepExpiredSelfServiceSessions() {
  await db.delete(selfServiceSessions).where(lte(selfServiceSessions.expiresAt, new Date()));
}
