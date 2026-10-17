import { inArray } from 'drizzle-orm';
import { db } from '@/db/config';
import { branches, users } from '@/db/schemas';

/** Resolves user ids to full names; unknown ids are omitted. */
export async function listUserNamesByIdsRepo(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const rows = await db
    .select({ id: users.id, fullname: users.fullname })
    .from(users)
    .where(inArray(users.id, ids));
  return Object.fromEntries(rows.map((row) => [row.id, row.fullname]));
}

/** Resolves branch ids to names; unknown ids are omitted. */
export async function listBranchNamesByIdsRepo(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const rows = await db
    .select({ id: branches.id, name: branches.name })
    .from(branches)
    .where(inArray(branches.id, ids));
  return Object.fromEntries(rows.map((row) => [row.id, row.name]));
}
