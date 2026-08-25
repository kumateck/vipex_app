import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

if (process.env.NODE_ENV === 'test' && !process.env.TEST_DATABASE_URL?.trim()) {
  throw new Error('TEST_DATABASE_URL is not set; refusing to use DATABASE_URL during tests');
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}
const databaseUrl: string = DATABASE_URL;

type PostgresClient = ReturnType<typeof postgres>;
type GlobalWithDb = typeof globalThis & { __vipex_sql__?: PostgresClient };

const globalDb = globalThis as GlobalWithDb;

function createSqlClient() {
  return postgres(databaseUrl, {
    connect_timeout: 30,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
    backoff: (retries) => Math.max(0.5, Math.min(0.5 * 2 ** retries, 30)),
  });
}

// One shared connection pool for the app and scripts.
// In dev/hot-reload, persist on globalThis to avoid duplicate pools and reconnect churn.
export const sql = globalDb.__vipex_sql__ ?? createSqlClient();

if (process.env.NODE_ENV !== 'production') {
  globalDb.__vipex_sql__ = sql;
}

// Drizzle ORM instance
export const db = drizzle(sql);

// Optional: enable pgcrypto for gen_random_uuid() used by Drizzle's defaultRandom() on UUIDs
export async function enablePgcrypto() {
  await sql`create extension if not exists pgcrypto`;
}

// Optional: cleanly close the pool (useful in short-lived scripts)
export async function closeSql() {
  await sql.end({ timeout: 5 });
  if (process.env.NODE_ENV !== 'production') {
    delete globalDb.__vipex_sql__;
  }
}
