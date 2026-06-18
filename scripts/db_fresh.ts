import 'dotenv/config';
import { existsSync } from 'node:fs';

function resolveBunExecutable() {
  const candidates = [
    process.env.BUN_INSTALL ? `${process.env.BUN_INSTALL}/bin/bun` : '',
    process.env.HOME ? `${process.env.HOME}/.bun/bin/bun` : '',
    process.execPath,
    '/opt/homebrew/bin/bun',
    '/usr/local/bin/bun',
  ];

  return candidates.find((candidate) => candidate && existsSync(candidate)) ?? 'bun';
}

async function runCommand(scriptName: string) {
  console.log(`\n▶ Running: bun run ${scriptName}`);
  const proc = Bun.spawn([resolveBunExecutable(), 'run', scriptName], {
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
