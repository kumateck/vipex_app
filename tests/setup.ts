// Global test setup (runs before any test files)
// - Loads .env.test (if present)
// - Disables Swagger and Sentry during tests
// - Forces NODE_ENV=test to ensure test-only branches

import 'dotenv/config';

// Force NODE_ENV to test
Reflect.set(process.env, 'NODE_ENV', 'test');

// Disable Swagger UI during tests to avoid polluting the app routes
process.env.SWAGGER_ENABLED = 'false';

// Ensure Sentry is a no-op in tests
process.env.SENTRY_DSN = process.env.SENTRY_DSN || '';

// Provide minimal JWT env if not set (for jwt utils)
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-at-least-32-chars-long-1234567890';
process.env.JWT_ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '5m';
process.env.JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';

// Provide default PORT for server layer code that references it
process.env.PORT = process.env.PORT || '3001';
