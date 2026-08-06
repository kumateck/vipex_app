# Dashboard V1 Spec

## Objective

Build role-based dashboard analytics with strict data scoping:

- Head Office users see consolidated data across all branches by default.
- Branch users are constrained to their branch.
- Location filters are always scoped to the active branch.

Dashboards to implement:

1. Admin
2. Cashier
3. Auditor
4. IT
5. CEO
6. Accountant
7. Secretary
8. HR Manager

---

## Scope Model (Global)

### Head Office Users

- Default scope: `All Branches`.
- Can filter by `Branch`, then `Location`.
- Can use `Date range`.

### Branch Users

- Branch is fixed from authenticated user context.
- Can filter by `Location` in that branch.
- Can use `Date range`.

### Required Behavior

- Server-side scope enforcement is mandatory (UI filters alone are not enough).
- Every dashboard must display active scope in UI (for example: `All Branches`, `Branch: Kumasi`, `Location: Adum`).

---

## Dashboard Pages

- `/dashboard/admin`
- `/dashboard/cashier`
- `/dashboard/auditor`
- `/dashboard/it`
- `/dashboard/ceo`
- `/dashboard/accountant`
- `/dashboard/secretary`
- `/dashboard/hr-manager`

---

## Role Analytics Matrix

## 1) Admin Dashboard

- KPI cards:
  - Parcels by status
  - Delivery success rate
  - Shift revenue
  - Credit exposure
  - To-be-paid outstanding
  - Cash variance summary
- Tables/charts:
  - Branch profitability ranking
  - Exception list (high variance, delayed delivery, pending confirmations)
- Required permissions:
  - `CanViewReportParcelsStatusSummary`
  - `CanViewReportCashierRevenue`
  - `CanViewReportBranchProfitSummary`
  - `CanViewReportCustomersCreditSummary`
  - `CanViewReportCashToBePaidOutstanding`
  - `CanReadAccounting`
- Primary endpoints:
  - `/reports/parcel-status-summary`
  - `/reports/delivery-performance`
  - `/reports/shift-revenue`
  - `/reports/branch-profitability`
  - `/reports/credit-exposure`
  - `/reports/tobepaid-outstanding`
  - `/reports/daily-cash-confirmations`

## 2) Cashier Dashboard

- KPI cards:
  - Today collections
  - Payment mode mix
  - Open/closed sessions
  - Shortage/overage/variance
  - To-be-paid outstanding
- Tables/charts:
  - Session performance trend
  - Recent reconciliation lines
- Required permissions:
  - `CanViewReportCashierRevenue`
  - `CanViewReportCashToBePaidOutstanding`
  - `CanViewReportParcelsStatusSummary`
  - `CanReadCashierSessions`
- Primary endpoints:
  - `/reports/daily-cashier-sales`
  - `/reports/shift-revenue`
  - `/reports/tobepaid-outstanding`
  - `/reports/tobepaid-collections-reconciliation`
  - `/reports/parcel-status-summary`

## 3) Auditor Dashboard

- KPI cards:
  - Suspicious actions count
  - Deleted action count
  - Cash variance anomaly count
  - Reconciliation variance count
- Tables/charts:
  - Activity by module/user
  - Audit drill-down for selected entity
- Required permissions:
  - `CanListAuditLogs`
  - `CanGetAuditLog`
  - `CanGetEntityAuditHistory`
  - `CanReadAccounting`
  - `CanViewReportCashToBePaidOutstanding`
- Primary endpoints:
  - Audit report routes under `/reports/audit/*`
  - `/audit/entities/:entityType/:entityId`
  - `/reports/daily-cash-confirmations`
  - `/reports/expense-by-category`
  - `/reports/tobepaid-collections-reconciliation`

## 4) IT Dashboard

- KPI cards:
  - Security-sensitive changes
  - Role/permission changes
  - Module enablement changes
  - Operational error-like audit events
- Tables/charts:
  - Audit event trend
  - Top affected entities/users
- Required permissions:
  - `CanListAuditLogs`
  - `CanReadPermissions`
  - `CanReadRoles`
  - `CanReadUsers`
  - `CanManageCompanyModules`
- Primary endpoints:
  - Audit report routes under `/reports/audit/*`
  - `/audit/entities/:entityType/:entityId`
  - RBAC/users/module APIs

## 5) CEO Dashboard

- KPI cards:
  - Revenue
  - Net profit
  - Cash flow
  - Credit exposure
  - Delivery performance index
- Tables/charts:
  - Branch profitability leaderboard
  - Revenue/profit trend
- Required permissions:
  - `CanReadAccounting`
  - `CanViewReportBranchProfitSummary`
  - `CanViewReportCustomersCreditSummary`
  - `CanViewReportParcelsStatusSummary`
  - `CanViewReportCashierRevenue`
- Primary endpoints:
  - `/accounting/reports/income-statement`
  - `/accounting/reports/profit-loss`
  - `/accounting/reports/cash-flow`
  - `/accounting/reports/balance-sheet`
  - `/reports/branch-profitability`
  - `/reports/credit-exposure`
  - `/reports/delivery-performance`

## 6) Accountant Dashboard

- KPI cards:
  - Daily cash confirmations
  - Expense lifecycle totals
  - Trial balance snapshot
  - Payroll reconciliation status
  - Tax filing readiness indicator
- Tables/charts:
  - Monthly branch summary
  - Expense by category and status
- Required permissions:
  - `CanReadAccounting`
  - `CanPostAccountingEntries`
  - `CanManageTaxFiling`
- Primary endpoints:
  - `/reports/daily-cash-confirmations`
  - `/reports/expense-by-category`
  - `/reports/payroll-journal-reconciliation`
  - `/accounting/reports/trial-balance`
  - `/accounting/reports/account-statement`
  - `/accounting/reports/income-statement`
  - `/accounting/reports/profit-loss`
  - `/accounting/reports/balance-sheet`
  - `/accounting/reports/cash-flow`
  - `/accounting/reports/monthly-branch-summary`

## 7) Secretary Dashboard

- KPI cards:
  - Incoming/outgoing parcel volumes
  - Uncollected parcels
  - Aged parcels
  - Delivery in-progress
- Tables/charts:
  - Parcel service board
  - Customer statement quick-view links
- Required permissions:
  - `CanViewReportParcelsStatusSummary`
  - `CanReadParcels`
  - `CanReadCustomers`
- Primary endpoints:
  - `/reports/parcel-status-summary`
  - `/reports/delivery-performance`
  - `/reports/tobepaid-outstanding`
  - Customer statement endpoints from customers feature

## 8) HR Manager Dashboard

- KPI cards:
  - Headcount
  - Active vs inactive employees
  - Attendance compliance
  - Leave approval pipeline
  - Overtime and adjustment totals
- Tables/charts:
  - Attendance trends (late/absence/worked hours)
  - Payroll input summary by department
- Required permissions:
  - `CanListEmployees`
  - `CanListAttendance`
  - `CanListLeaveRequests`
  - `CanReadPayrollRun`
  - `CanReadPayrollInputs`
- Primary endpoints:
  - `/reports/employees`
  - `/reports/attendance`
  - `/reports/leave-requests`
  - `/reports/payroll-register`
  - `/reports/payroll-overtime`
  - `/reports/payroll-adjustments`

---

## Shared UX/Engineering Rules

- Use one shared dashboard filter component:
  - `Date range`
  - `Branch` (visible only for Head Office users)
  - `Location` (dependent dropdown)
- Show loading, empty, and permission-denied states consistently.
- Use role-based route guards.
- Keep metrics definitions centralized to avoid drift between dashboards.
