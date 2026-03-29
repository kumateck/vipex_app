import 'dotenv/config';
import postgres from 'postgres';

const CONFIRM_TOKEN = 'RESET_REMOTE_DB';

async function runCommand(scriptName: string) {
  console.log(`\n▶ Running: bun run ${scriptName}`);
  const proc = Bun.spawn(['bun', 'run', scriptName], {
    stdout: 'inherit',
    stderr: 'inherit',
    env: process.env,
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`Command failed: bun run ${scriptName} (exit ${exitCode})`);
  }
}

function assertEnv() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }
  if (process.env.RESET_DB_CONFIRM !== CONFIRM_TOKEN) {
    throw new Error(
      `Safety check failed. Set RESET_DB_CONFIRM=${CONFIRM_TOKEN} to run this destructive command.`,
    );
  }
}

async function resetSchema(databaseUrl: string) {
  const sql = postgres(databaseUrl, { max: 1 });
  try {
    console.log('\n⚠ Dropping and recreating public + drizzle schemas...');
    await sql.unsafe('DROP SCHEMA IF EXISTS drizzle CASCADE;');
    await sql.unsafe('DROP SCHEMA IF EXISTS public CASCADE;');
    await sql.unsafe('CREATE SCHEMA public;');
    await sql.unsafe('GRANT ALL ON SCHEMA public TO public;');
    await sql.unsafe('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    console.log('✓ Schema reset complete (including migration history).');
  } finally {
    await sql.end();
  }
}

async function main() {
  assertEnv();
  const databaseUrl = process.env.DATABASE_URL!;
  const parsed = new URL(databaseUrl);
  console.log(`Target DB host: ${parsed.hostname}`);
  console.log(`Target DB name: ${parsed.pathname.replace('/', '')}`);

  await resetSchema(databaseUrl);
  await runCommand('migrate');
  await runCommand('seed:all');

  console.log('\n✅ Remote DB reset + bun run migrate + bun run seed:all completed.');
}

main().catch((error) => {
  console.error('\n❌ Remote DB reset failed:', error);
  process.exit(1);
});
