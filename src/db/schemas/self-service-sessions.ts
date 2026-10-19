import { index, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

// Tokens are random secrets; only their SHA-256-derived cache key is persisted.
// Payload holds session metadata or submission receipts (draft ID/request fingerprint).
// Receipt continuations omit raw tokens and customer contact details.
export const selfServiceSessions = pgTable(
  'self_service_sessions',
  {
    key: varchar('key', { length: 100 }).primaryKey(),
    payload: text('payload').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => ({ byExpiry: index('self_service_sessions_expiry_idx').on(table.expiresAt) }),
);
