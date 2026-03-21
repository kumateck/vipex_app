console.log(
  [
    'The standalone audit migration is deprecated.',
    'Audit schema is now part of the consolidated Drizzle baseline migration.',
    "Use: bun run generate && bun run migrate",
  ].join('\n'),
);
