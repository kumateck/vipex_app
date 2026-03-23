# API Documentation Index

Base URL: `/v1`

## Core

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

## Master Data

- `/users`
- `/branches`
- `/locations`
- `/statuses`
- `/customers`
  - `/customers/crm`
  - `/customers/:id/crm`
  - `/customers/:id/cards`
  - `/customers/:id/statement`
  - `/customers/:id/transactions`
  - `/customers/:id/payments`
  - `/customers/:id/credit/summary`
  - `/customers/:id/credit/transactions`
  - `/customers/:id/credit/open-items`
  - `/customers/:id/credit/payments`

## Operations

- `/shipments/bookings`
- `/shipments/parcels`
- `/shipments/consignments`
- `/deliveries`
- `/cashiers`
- `/shifts`

## Finance

- `/payments`
- `/accounting`
  - `daily-cash-expected`
  - `daily-cash-confirmations`
  - `expense-requests`
  - `tax-filing-periods`
  - `tax-journal-items`
  - `reports/trial-balance`
  - `reports/account-statement`
  - `reports/income-statement`
  - `reports/profit-loss`
  - `reports/balance-sheet`
  - `reports/cash-flow`
  - `reports/monthly-branch-summary`
- `/payroll`

## Inventory

- `/inventory/categories`
- `/inventory/products`
- `/inventory/locations`
- `/inventory/stock-levels`
- `/inventory/stock-movements`
- `/inventory/stock-adjustments`
- `/inventory/stock-transfers`

## Governance

- `/audit`
- `/rbac`
- `/reports`

## Geolocation (PostGIS)

- `GET /geolocation/distance`
- `GET /geolocation/branches/nearby`

## Interactive docs

- Swagger UI: `/docs`
- OpenAPI JSON: `/docs/json`
