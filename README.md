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
- Accounting module: `docs/ACCOUNTING_MODULE.md`
- Company modules: `docs/COMPANY_MODULES.md`
- Developer onboarding: `docs/ONBOARDING.md`
- Appearance system: `docs/APPEARANCE_SYSTEM.md`
- Style recipe status: `docs/APPEARANCE_STYLE_PARITY_PLAN.md`

## Accounting Enablement

Accounting is optional per company.

- UI control: `/settings/company`
- Accounting setup: `/accounting/setup`
- Backend control: `/v1/company-modules`

The accounting setup area currently manages:

- chart of accounts
- expense categories
- approval policies
- company bank accounts
- tax profiles
- tax components

Accounting access is also role-controlled with dedicated permission keys for:

- viewing accounting
- managing accounting setup
- managing tax filing
- posting accounting entries
- Supporting migrations:
  - `drizzle/0009_company_accounting_toggle.sql`
  - `drizzle/0011_sync_accounting_module_flag.sql`

Apply migrations before using the company-level accounting toggle.
