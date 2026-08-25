import { config as loadEnv } from 'dotenv';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

loadEnv({ path: '.env' });
loadEnv({ path: '.env.test', override: false });

function resolveDatabaseUrl() {
  const migrateTarget = (process.env.MIGRATE_TARGET || '').trim().toLowerCase();
  const useTestDb = migrateTarget === 'test' || process.env.NODE_ENV === 'test';
  if (useTestDb) return process.env.TEST_DATABASE_URL;
  return process.env.MIGRATE_DATABASE_URL || process.env.DATABASE_URL;
}

function resolveTargetLabel() {
  const migrateTarget = (process.env.MIGRATE_TARGET || '').trim().toLowerCase();
  if (migrateTarget === 'test' || process.env.NODE_ENV === 'test') return 'test';
  if (migrateTarget) return migrateTarget;
  return 'default';
}

// Function to check and create database if needed
async function ensureDatabase() {
  const databaseUrl = resolveDatabaseUrl();
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set (or TEST_DATABASE_URL for NODE_ENV=test)');
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
    console.log(`Migration target: ${resolveTargetLabel()}`);
    // 1. Ensure DB exists
    await ensureDatabase();

    // 2. Connect to the target DB
    // We re-import or re-create the connection here to ensure it connects to the now-existing DB
    const databaseUrl = resolveDatabaseUrl();
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set (or TEST_DATABASE_URL for NODE_ENV=test)');
    }
    const sql = postgres(databaseUrl, { max: 1 });
    const db = drizzle(sql);

    // 3. Run migrations
    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });

    // Defensive alignment for mixed/local environments where historical migration
    // state may drift from actual table shape.
    await sql.unsafe(`
      ALTER TABLE IF EXISTS "products"
      ADD COLUMN IF NOT EXISTS "is_recoverable" boolean NOT NULL DEFAULT false;
    `);
    console.log('Migrations applied successfully.');

    await sql.end();
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

runMigrations();
