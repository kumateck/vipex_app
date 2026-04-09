import { pgTable, text, timestamp, varchar, index, uniqueIndex, jsonb } from 'drizzle-orm/pg-core';
import { users } from './core';
import { createId } from '@paralleldrive/cuid2';

// Refresh tokens
export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: varchar('user_id', { length: 25 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    revokedAt: timestamp('revoked_at', { mode: 'date' }),
    replacedByHash: varchar('replaced_by_hash', { length: 64 }),
    userAgent: text('user_agent'),
    ip: varchar('ip', { length: 64 }),
    permissionsSnapshot: jsonb('permissions_snapshot').$type<string[]>().notNull().default([]),
  },
  (t) => ({
    byUser: index('rt_user_idx').on(t.userId),
    byExpires: index('rt_expires_idx').on(t.expiresAt),
    tokenUnique: uniqueIndex('rt_token_hash_uq').on(t.tokenHash),
  }),
);

// Password reset tokens
export const passwordResets = pgTable(
  'password_resets',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: varchar('user_id', { length: 25 })
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
