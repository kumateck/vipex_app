import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

// Function to check and create database if needed
async function ensureDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  const url = new URL(databaseUrl);
  const dbName = url.pathname.slice(1); // Remove leading '/'

  // Connect to 'postgres' database to manage databases
  url.pathname = '/postgres';
  const sql = postgres(url.toString(), { max: 1 });

  try {
    const result = await sql`SELECT 1 FROM pg_database WHERE datname = ${dbName}`;
    if (result.length === 0) {
      console.log(`Database '${dbName}' does not exist. Creating...`);
      await sql.unsafe(`CREATE DATABASE "${dbName}"`);
      console.log(`Database '${dbName}' created successfully.`);
    } else {
      console.log(`Database '${dbName}' exists.`);
    }
  } catch (err) {
    console.error('Error checking/creating database:', err);
    throw err;
  } finally {
    await sql.end();
  }
}

// Main migration logic
async function runMigrations() {
  try {
    // 1. Ensure DB exists
    await ensureDatabase();

    // 2. Connect to the target DB
    // We re-import or re-create the connection here to ensure it connects to the now-existing DB
    const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
    const db = drizzle(sql);

    // 3. Run migrations
    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations applied successfully.');

    await sql.end();
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

runMigrations();
