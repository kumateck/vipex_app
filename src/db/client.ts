import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

export const sql = postgres(DATABASE_URL, {
  connect_timeout: 30,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
  backoff: (retries) => Math.max(0.5, Math.min(0.5 * 2 ** retries, 30)),
});
export const db = drizzle(sql);
