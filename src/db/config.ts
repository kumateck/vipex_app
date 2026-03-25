import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// One shared connection pool for the app and scripts
export const sql = postgres(DATABASE_URL, {
  connect_timeout: 30,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
  backoff: (retries) => Math.min(0.5 * 2 ** retries, 30),
});

// Drizzle ORM instance
export const db = drizzle(sql);

// Optional: enable pgcrypto for gen_random_uuid() used by Drizzle's defaultRandom() on UUIDs
export async function enablePgcrypto() {
  await sql`create extension if not exists pgcrypto`;
}

// Optional: cleanly close the pool (useful in short-lived scripts)
export async function closeSql() {
  await sql.end({ timeout: 5 });
}
