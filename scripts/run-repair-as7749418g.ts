import { parse } from 'dotenv';
import postgres from 'postgres';

const envPath = process.env.REPAIR_ENV_FILE || new URL('../.env', import.meta.url);
const databaseUrl = parse(await Bun.file(envPath).text()).DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is missing from .env');

const script = await Bun.file(
  new URL('./repair-as7749418g-to-be-paid.sql', import.meta.url),
).text();
const sql = postgres(databaseUrl, { max: 1, prepare: false });
try {
  const results = await sql.unsafe(script).simple();
  const finalResult = Array.isArray(results) ? results.at(-1) : results;
  console.log('Repair SQL completed. Final parcel balance:');
  console.table(finalResult);
} finally {
  await sql.end();
}
