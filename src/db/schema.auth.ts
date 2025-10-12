import { pgTable, text, timestamp, uuid, varchar, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './schema';

// Opaque refresh tokens stored as SHA-256 hex strings
export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    revokedAt: timestamp('revoked_at', { mode: 'date' }),
    replacedByHash: varchar('replaced_by_hash', { length: 64 }),
    userAgent: text('user_agent'),
    ip: varchar('ip', { length: 64 }),
  },
  (t) => ({
    byUser: index('rt_user_idx').on(t.userId),
    byExpires: index('rt_expires_idx').on(t.expiresAt),
    tokenUnique: uniqueIndex('rt_token_hash_uq').on(t.tokenHash),
  }),
);

// Password reset tokens stored as SHA-256 hex strings
export const passwordResets = pgTable(
  'password_resets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
    usedAt: timestamp('used_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (t) => ({
    prUser: index('pr_user_idx').on(t.userId),
    prExpires: index('pr_expires_idx').on(t.expiresAt),
    prTokenUq: uniqueIndex('pr_token_hash_uq').on(t.tokenHash),
  }),
);
