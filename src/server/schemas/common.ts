import { t } from 'elysia';

// Reusable primitives
export const UUID = t.String({ minLength: 1, maxLength: 25, pattern: '^[A-Za-z0-9_-]+$' });
export const Email = t.String({ format: 'email', maxLength: 255 });
export const Telephone = t.String({ minLength: 6, maxLength: 30 });
export const NonEmptyString255 = t.String({ minLength: 1, maxLength: 255 });
export const SmallInt = t.Number({ minimum: -32768, maximum: 32767 });

// Base64URL (RFC 4648) without padding, used for cursors
export const Base64Url = t.String({ pattern: '^[A-Za-z0-9_-]+$' });

export const PaginationQuery = t.Object({
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
  after: t.Optional(t.String()),
});

export const NonEmpty255 = t.String({ minLength: 1, maxLength: 255 });
export const OptionalNonEmpty255 = t.Optional(NonEmpty255);

export const DateTimeStr = t.String({ format: 'date-time' });
// Pagination query: limit (string to keep it URL-friendly), after cursor
// export const PaginationQuery = t.Object({
//   limit: t.Optional(t.String()), // parse to number in handler, clamp 1..100
//   after: t.Optional(Base64Url),
// });

export { t };
