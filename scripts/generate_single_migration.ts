import { $ } from 'bun';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const DRIZZLE_DIR = 'drizzle';
const META_DIR = join(DRIZZLE_DIR, 'meta');
const MANUAL_SQL_FILES = ['scripts/enable_pgcrypto.sql', 'scripts/updated_at_triggers.sql'];

await $`rm -rf ${DRIZZLE_DIR}`;
await $`mkdir -p ${META_DIR}`;
await Bun.write(
  join(META_DIR, '_journal.json'),
  JSON.stringify(
    {
      version: '7',
      dialect: 'postgresql',
      entries: [],
    },
    null,
    2,
  ),
);

await $`drizzle-kit generate`;

const generatedFiles = (await readdir(DRIZZLE_DIR)).filter((file) =>
  /^\d{4}_.*\.sql$/.test(file),
);

if (generatedFiles.length !== 1) {
  throw new Error(
    `Expected exactly one generated SQL migration, found ${generatedFiles.length}: ${generatedFiles.join(', ')}`,
  );
}

const generatedSqlPath = join(DRIZZLE_DIR, generatedFiles[0]!);
let migrationSql = await Bun.file(generatedSqlPath).text();

for (const manualSqlPath of MANUAL_SQL_FILES) {
  const manualSql = await Bun.file(manualSqlPath).text();
  migrationSql += `\n\n--> statement-breakpoint\n-- Source: ${manualSqlPath}\n${manualSql.trim()}\n`;
}

await Bun.write(generatedSqlPath, migrationSql);

console.log(
  `Generated a single baseline migration in ./${generatedSqlPath} including manual SQL from ${MANUAL_SQL_FILES.join(', ')}.`,
);
