# Developer Onboarding Guide

## 1. Prerequisites
- Bun `>=1.x`
- PostgreSQL `>=14`
- Redis (optional but recommended)
- PostGIS extension for geospatial endpoints

## 2. Setup
1. Install deps:
```bash
bun install
```
2. Configure env:
```bash
cp .env .env.local
```
3. Ensure DB is running and `DATABASE_URL` is valid.
4. Run migrations:
```bash
bun run migrate
```
Do not use `drizzle-kit push` on this project database state; it can generate destructive NOT NULL diffs.
5. Seed base data:
```bash
bun run seed:init
```

## 3. Run
```bash
bun run dev
```

API health: `GET /health`  
Swagger: `GET /docs`

## 4. Testing
Run full suite:
```bash
bun test
```

Run targeted backend tests:
```bash
bun test tests/server
```

## 5. Conventions
- ID format is app-scoped string IDs (`<=25 chars`), not UUID.
- Use `HttpStatus` enum for status codes.
- Throw `HttpError` helpers for expected failures.
- Keep routes typed and thin; put logic in service/repository.
- For new endpoints: include OpenAPI `detail` metadata.

## 6. Infrastructure Features
- Rate limiting: middleware with Redis + memory fallback.
- Caching: shared cache service (`/src/server/services/cache`).
- Geolocation: PostGIS-enabled endpoints (`/v1/geolocation/*`).
