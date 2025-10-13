import type { Config } from 'drizzle-kit';

export default {
  // Point to every schema file you want included
  schema: ['./src/db/schemas/index.ts'],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
  verbose: true,
  strict: true,
} satisfies Config;
