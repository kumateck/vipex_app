# VIPEX ERP Backend

## Quick Start

Install dependencies:

```bash
bun install
```

Run development server:

```bash
bun run dev
```

Run tests:

```bash
bun test
```

## Infrastructure
- PostgreSQL (primary DB)
- PostGIS extension (geospatial endpoints)
- Redis (rate limiting + caching, optional with memory fallback)

## Documentation
- Architecture: `docs/ARCHITECTURE.md`
- API index: `docs/API.md`
- Developer onboarding: `docs/ONBOARDING.md`
