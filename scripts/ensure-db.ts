import 'dotenv/config';
import postgres from 'postgres';

async function ensureDatabaseExists() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not defined.');
    process.exit(1);
  }

  // Parse the connection string
  // Expected format: postgres://user:password@host:port/dbname
  const urlParts = new URL(databaseUrl);
  const targetDbName = urlParts.pathname.slice(1); // remove leading slash

  // Create a connection string to the default 'postgres' database
  // by replacing the path with '/postgres'
  const adminUrl = new URL(databaseUrl);
  adminUrl.pathname = '/postgres';

  console.log(`Checking if database '${targetDbName}' exists...`);

  const sql = postgres(adminUrl.toString(), { max: 1 });

  try {
    // Check if the database exists
    const result = await sql`
      SELECT 1 FROM pg_database WHERE datname = ${targetDbName}
    `;

    if (result.length === 0) {
      console.log(`Database '${targetDbName}' does not exist. Creating...`);
      // Create the database
      // Parameterized queries cannot be used for identifiers like database names in CREATE DATABASE
      // We must strictly validate/sanitize the name or trust the env var.
      // Since this is a dev/deploy script, we assume the env var is trusted.
      await sql.unsafe(`CREATE DATABASE "${targetDbName}"`);
      console.log(`Database '${targetDbName}' created successfully.`);
    } else {
      console.log(`Database '${targetDbName}' already exists.`);
    }
  } catch (error) {
    console.error('Error ensuring database exists:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Execute if run directly
if (import.meta.main) {
  ensureDatabaseExists();
}

export { ensureDatabaseExists };
