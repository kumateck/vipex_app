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
- `/company-modules`
- `/statuses`
- `/hr/departments`
- `/hr/job-titles`
- `/hr/employees`
- `/hr/attendance`
- `/hr/leave-types`
- `/hr/leave-requests`
  - `/hr/leave-requests/:id/manager-approve`
  - `/hr/leave-requests/:id/manager-reject`
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
  - `accounts`
  - `expense-categories`
  - `approval-policies`
  - `bank-accounts`
  - `tax-components`
  - `daily-cash-expected`
  - `daily-cash-confirmations`
  - `tax-profiles`
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
  - `/payroll/groups`
  - `/payroll/earning-types`
  - `/payroll/deduction-types`
  - `/payroll/compensation`
  - `/payroll/cycles`
  - `/payroll/cycles/:id/overtime`
  - `/payroll/cycles/:id/overtime/:entryId/approve`
  - `/payroll/cycles/:id/overtime/:entryId/reject`
  - `/payroll/cycles/:id/adjustments`
  - `/payroll/cycles/:id/adjustments/:entryId/approve`
  - `/payroll/cycles/:id/adjustments/:entryId/reject`
  - `/payroll/cycles/:id/bank-export`
  - `/payroll/cycles/:id/payslips`
  - `/payroll/payslips/:id`
  - `/payroll/cycles/:id/journalize`
  - `/payroll/cycles/:id/reverse`
  - `/payroll/cycles/:id/reopen`

## Platform

- `/company-modules`
  - `GET /company-modules`
  - `PUT /company-modules/:moduleCode`

Notes:

- Accounting availability is controlled through the `accounting` company module.
- The accounting UI is surfaced at `/settings/company` for users with `CanManageCompanyModules`.
- Accounting setup master data is surfaced at `/accounting/setup`.
- The setup page currently manages chart of accounts, expense categories, approval policies, company bank accounts, tax profiles, and tax components.
- Accounting API access is also role-gated with `CanReadAccounting`, `CanManageAccountingSetup`, `CanManageTaxFiling`, and `CanPostAccountingEntries`.
- When `accounting` is disabled, `/accounting/*` UI routes are hidden and `/v1/accounting/*` API routes are blocked.

Reference:

- `docs/COMPANY_MODULES.md`

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
