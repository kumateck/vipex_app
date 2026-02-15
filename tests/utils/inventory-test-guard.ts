import { describe } from 'bun:test';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

async function canReachDatabase(): Promise<boolean> {
  try {
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}

const dbAvailable = await canReachDatabase();

export const inventoryDescribe = dbAvailable ? describe : describe.skip;
