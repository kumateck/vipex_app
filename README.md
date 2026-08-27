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

## WebSocket Deployment Notes

Communication realtime uses `GET /v1/communication/ws` with WebSocket upgrade.

If you see browser errors like `Error during WebSocket handshake: 'Upgrade' header is missing`,
your reverse proxy is forwarding the request as plain HTTP.

For Nginx, ensure the socket location forwards upgrade headers:

```nginx
location /v1/communication/ws {
  proxy_pass http://127.0.0.1:3000;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_read_timeout 3600;
}
```

Frontend can also force a dedicated socket host using:

```bash
VITE_COMMUNICATION_WS_URL=wss://your-ws-capable-domain.com
```

## Documentation

- Documentation hub: `docs/README.md`
- Application overview: `docs/APPLICATION_OVERVIEW.md`
- Feature catalog: `docs/FEATURE_CATALOG.md`
- Documentation coverage: `docs/DOCUMENTATION_COVERAGE.md`
- Architecture: `docs/ARCHITECTURE.md`
- API index: `docs/API.md`
- Accounting module: `docs/ACCOUNTING_MODULE.md`
- Company modules: `docs/COMPANY_MODULES.md`
- Parcel internal transfers: `docs/PARCEL_INTERNAL_TRANSFERS.md`
- Developer onboarding: `docs/ONBOARDING.md`
- Appearance system: `docs/APPEARANCE_SYSTEM.md`
- Style recipe status: `docs/APPEARANCE_STYLE_PARITY_PLAN.md`

## Environment URLs (Mail Links)

Password reset and invite emails now support dedicated link base URLs.

- `APP_BASE_URL` (required in production)
- `RESET_LINK_BASE_URL` (optional, falls back to `APP_BASE_URL`)
- `INVITE_LINK_BASE_URL` (optional, falls back to `APP_BASE_URL`)

Recommended values:

- Staging:
  - `APP_BASE_URL=https://staging.app.vipexparcel.com`
  - `RESET_LINK_BASE_URL=https://staging.app.vipexparcel.com`
  - `INVITE_LINK_BASE_URL=https://staging.app.vipexparcel.com`
- Production:
  - `APP_BASE_URL=https://app.vipexparcels.com`
  - `RESET_LINK_BASE_URL=https://app.vipexparcels.com`
  - `INVITE_LINK_BASE_URL=https://app.vipexparcels.com`

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

It also supports:

- safe deletion of unused ledger accounts
- inline setup change history for accounting masters

Accounting access is also role-controlled with dedicated permission keys for:

- viewing accounting
- managing accounting setup
- managing tax filing
- posting accounting entries
- Supporting migrations:
  - `drizzle/0009_company_accounting_toggle.sql`
  - `drizzle/0011_sync_accounting_module_flag.sql`

Apply migrations before using the company-level accounting toggle.

## Parcel Warehouses and Internal Transfers

The app now supports branch-owned warehouses and branch-level internal parcel custody transfers.

- Warehouse management: `/warehouses`
- Internal transfer creation: `/parcels/internal-transfers`
- Transfer acknowledgement: `/parcels/internal-transfers/acknowledge`

Important rule:

- internal transfers do not change parcel shipment status
- custody only changes after destination acknowledgement

Role management also includes quick presets for warehouse and internal-transfer access so branch admins can assign the new operational permissions without manually selecting each key.

The main parcel operations pages now also show the current internal holder, so staff can tell whether a parcel is sitting at the main branch, a location, or a warehouse before serving or moving it.

Internal transfer operations also include a printable transfer slip from both the transfer-creation side and the acknowledgement side.

## MinIO Uploads

The app now supports MinIO-backed image storage through the backend.

- upload endpoint: `POST /v1/uploads`
- list endpoint: `GET /v1/uploads?modelType=...&modelId=...`
- delete endpoint: `DELETE /v1/uploads/:id`
- object proxy endpoint: `/v1/uploads/object/:key`
- wired usages:
  - rider handover signatures
  - employee profile images
  - customer card front and back images

Configure these environment variables to enable it:

- `MINIO_ENDPOINT`
- `MINIO_REGION`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- `MINIO_BUCKET`
- `MINIO_FORCE_PATH_STYLE`

Uploads are now associated to:

- `modelType`
- `modelId`

so the same upload resource can be reused for signatures, employee profiles, customer cards, employee documents, and future parcel proof images.

Supporting migration:

- `drizzle/0018_employee_profile_customer_card_images.sql`
