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
4. Apply committed migrations:
```bash
bun run migrate
```
5. Run required seeds (in order):
```bash
bun run seed:init
bun run seed:sessions
```
6. Run one login-user seed (choose one):
```bash
bun run seed:users
```
or
```bash
bun run seed:desmond
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
bun run seed:init
bun run seed:sessions
```
5. Seed one application login user:
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
- `seed:init` (required): creates base company/branch/role and system user.
- `seed:sessions` (recommended): inserts cashier session types.
- `seed:users` (optional): creates/updates demo login user `info@kumateck.com`.
- `seed:desmond` (optional): creates/updates superadmin login user.

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
