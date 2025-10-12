import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, closeSql } from '../src/db/config';

try {
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations applied successfully.');
} catch (err) {
  console.error('Migration error:', err);
  process.exitCode = 1;
} finally {
  await closeSql();
}
