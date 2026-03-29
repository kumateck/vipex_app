import 'dotenv/config';

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

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const parsed = new URL(databaseUrl);
  console.log(`Target DB host: ${parsed.hostname}`);
  console.log(`Target DB name: ${parsed.pathname.replace('/', '')}`);

  // migrate.ts already ensures the target DB exists before applying migrations.
  await runCommand('migrate');
  await runCommand('seed:all');

  console.log('\n✅ Fresh DB bootstrap completed (create-if-missing + migrate + seed:all).');
}

main().catch((error) => {
  console.error('\n❌ Fresh DB bootstrap failed:', error);
  process.exit(1);
});
