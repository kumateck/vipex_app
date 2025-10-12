import 'dotenv/config';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 1 });

try {
  await sql`create extension if not exists pgcrypto`;
  console.log('pgcrypto extension enabled.');
} catch (err) {
  console.error('Error enabling pgcrypto:', err);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
