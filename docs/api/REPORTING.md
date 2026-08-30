# API: Reporting

All paths are relative to `/v1`.

## Operational Report Endpoints

- `GET /reports/daily-cashier-sales`
- `GET /reports/daily-cashier-sales/cashiers`
- `GET /reports/accounting/storage-waivers`
- `GET /reports/daily-cash-confirmations`
- `GET /reports/expense-by-category`
- `GET /reports/payroll-journal-reconciliation`
- `GET /reports/delivery-performance`
- `GET /reports/employees`
- `GET /reports/attendance`
- `GET /reports/leave-requests`
- `GET /reports/payroll-register`
- `GET /reports/payroll-overtime`
- `GET /reports/payroll-adjustments`
- `GET /reports/cashier-performance`
- `GET /reports/shift-revenue`
- `GET /reports/branch-profitability`
- `GET /reports/credit-exposure`
- `GET /reports/customer-credit-aging-detail`
- `GET /reports/tobepaid-outstanding`
- `GET /reports/tobepaid-collections-reconciliation`
- `GET /reports/parcel-status-summary`
- `GET /reports/sticker-print-usage`

Accounting financial-statement endpoints remain under `/accounting/reports/*`.

## Rules

- Reports use their underlying domain or dedicated report permission, not a single universal grant.
- Company-module gating still applies to HR, payroll, accounting, and other module-backed reports.
- Head-office and branch-scoped results are resolved on the server.
- Export and print are presentations of the returned report; they do not grant broader data access.
- Sticker Print Usage reads successful events recorded by `/shipments/parcels/sticker-prints`.
- Daily Cashier Sales cashier options must not infer a cashier assignment from an ordinary account role.
- A Daily Cashier Sales request with cashier type `FULL` includes payment records from Sender,
  Receiver, and Delivery cashier modules. The client may narrow the returned report after loading;
  this presentation filter does not alter the endpoint's company, branch, location, or cashier
  authorization scope.

See [Reporting Module](../REPORTING_MODULE.md) and the [Report Route Permission Matrix](../permissions/ROUTE_PERMISSION_REPORTS.md).
