# Developer Onboarding Guide

## 1. Prerequisites

- Bun `>=1.x`
- PostgreSQL `>=14`
- PostGIS extension for geospatial endpoints
- Redis (optional; app has memory fallback for some features)

## 2. First-Time Setup (New Joiner)

1. Install dependencies:

```bash
bun install
```

2. Configure environment:

```bash
cp .env .env.local
```

3. Ensure your `.env`/`.env.local` has a valid `DATABASE_URL`.
4. For mail-link correctness in non-local environments, configure:

- `APP_BASE_URL`
- `RESET_LINK_BASE_URL` (optional; defaults to `APP_BASE_URL`)
- `INVITE_LINK_BASE_URL` (optional; defaults to `APP_BASE_URL`)

Example values:

- Staging: `https://staging.app.vipexparcel.com`
- Production: `https://app.vipexparcel.com`

5. Apply committed migrations:

```bash
bun run migrate
```

6. Run required seeds for an existing database with users (in order):

```bash
bun run seed:init
bun run seed:sessions
```

7. Only if you explicitly need a demo/login user that does not already exist, run one of:

```bash
bun run seed:users
```

or

```bash
bun run seed:desmond
```

If the database is brand-new and has no users yet, run:

```bash
bun run seed:bootstrap
bun run seed:sessions
```

## 3. Fresh Baseline Migration Setup (Drop DB + Rebuild)

Use this when you intentionally want a brand-new database and a newly generated baseline migration.

1. Drop and recreate your database (example with `psql`):

```bash
psql "$DATABASE_URL" -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
```

2. Generate a single fresh baseline migration:

```bash
bun run generate
```

3. Apply migration:

```bash
bun run migrate
```

4. Seed required baseline data:

```bash
bun run seed:bootstrap
bun run seed:sessions
```

5. Seed one additional application login user only if needed:

```bash
bun run seed:users
```

or

```bash
bun run seed:desmond
```

Notes:

- `bun run generate` now appends manual SQL automatically (pgcrypto + `updated_at` triggers).
- Do not use `drizzle-kit push` on this project DB.
- `bun run migrate:audit` is deprecated.
- `bun run enable:pgcrypto` and `bun run apply:triggers` are only for legacy/manual recovery scenarios.

## 4. Seed Summary

- `seed:init` (required for existing environments): creates missing base company/branch/role/module records using an existing user as creator.
- `seed:bootstrap` (required for empty environments): creates the first company/branch/role/system user.
- `seed:sessions` (recommended): inserts cashier session types.
- `seed:users` (optional): creates demo login user `info@kumateck.com` if missing.
- `seed:desmond` (optional): creates superadmin login user if missing.

## 5. Run the App

```bash
bun run dev
```

API health: `GET /health`  
Swagger: `GET /docs`

## 6. Testing

Run all tests:

```bash
bun test
```

Run backend tests:

```bash
bun test tests/server
```

## 7. Conventions

- ID format is app-scoped string IDs (`<=25 chars`), not UUID.
- Use `HttpStatus` enum for status codes.
- Throw `HttpError` helpers for expected failures.
- Keep routes typed and thin; put logic in service/repository.
- For new endpoints: include OpenAPI `detail` metadata.

## 8. Infrastructure Features

- Rate limiting: middleware with Redis + memory fallback.
- Caching: shared cache service (`/src/server/services/cache`).
- Geolocation: PostGIS-enabled endpoints (`/v1/geolocation/*`).
