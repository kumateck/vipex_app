import { t } from 'elysia';

// Reusable primitives
export const UUID = t.String({ format: 'uuid' });
export const Email = t.String({ format: 'email', maxLength: 255 });
export const Telephone = t.String({ minLength: 6, maxLength: 30 });
export const NonEmptyString255 = t.String({ minLength: 1, maxLength: 255 });

// Base64URL (RFC 4648) without padding, used for cursors
export const Base64Url = t.String({ pattern: '^[A-Za-z0-9_-]+$' });

// Pagination query: limit (string to keep it URL-friendly), after cursor
export const PaginationQuery = t.Object({
  limit: t.Optional(t.String()), // parse to number in handler, clamp 1..100
  after: t.Optional(Base64Url),
});

export { t };
