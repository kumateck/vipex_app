import { $ } from 'bun';

await $`rm -rf drizzle`;
await $`mkdir -p drizzle/meta`;
await Bun.write(
  'drizzle/meta/_journal.json',
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

console.log('Generated a single baseline migration in ./drizzle (0000_*).');
