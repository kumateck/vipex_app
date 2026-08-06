# Dashboard V1 Backlog

## Delivery Order

1. Phase 1 (Quick wins): Cashier, HR Manager, Admin
2. Phase 2 (Finance/Executive): Accountant, CEO
3. Phase 3 (Governance/Ops): Auditor, Secretary, IT
4. Phase 4 (Hardening): exports, presets, alerts, performance

---

## Epic A: Shared Dashboard Foundation

### A1. Role-based dashboard routing

- Add role routes:
  - `/dashboard/admin`
  - `/dashboard/cashier`
  - `/dashboard/auditor`
  - `/dashboard/it`
  - `/dashboard/ceo`
  - `/dashboard/accountant`
  - `/dashboard/secretary`
  - `/dashboard/hr-manager`
- Acceptance:
  - Unauthorized users cannot access role pages.
  - Authorized users land on their role page.

### A2. Shared scope filter bar

- Build reusable dashboard filter component:
  - Date range
  - Branch selector (Head Office only)
  - Location selector (dependent)
- Acceptance:
  - Head Office sees all branch/location options.
  - Branch users are locked to user branch.
  - Location options always match selected branch.

### A3. Shared dashboard primitives

- KPI card component
- Trend chart wrapper
- Exceptions table component
- Empty/loading/error states
- Acceptance:
  - All dashboard pages use shared primitives.

---

## Epic B: Phase 1 Dashboards

### B1. Cashier dashboard (P1)

- KPIs:
  - Daily collections
  - Payment mode mix
  - Open/closed sessions
  - Variance/overage/shortage
  - To-be-paid outstanding
- Data sources:
  - `/reports/daily-cashier-sales`
  - `/reports/shift-revenue`
  - `/reports/tobepaid-outstanding`
  - `/reports/tobepaid-collections-reconciliation`
- Acceptance:
  - Metrics update by scope/date.
  - Branch user never sees other branch data.

### B2. HR Manager dashboard (P1)

- KPIs:
  - Headcount
  - Attendance compliance
  - Leave backlog
  - Overtime and adjustments
- Data sources:
  - `/reports/employees`
  - `/reports/attendance`
  - `/reports/leave-requests`
  - `/reports/payroll-register`
  - `/reports/payroll-overtime`
  - `/reports/payroll-adjustments`
- Acceptance:
  - Department and employment status slicing works.

### B3. Admin dashboard (P1)

- KPIs:
  - Parcel flow summary
  - Delivery performance
  - Shift revenue
  - Branch profitability
  - Credit exposure
  - Cash exceptions
- Data sources:
  - `/reports/parcel-status-summary`
  - `/reports/delivery-performance`
  - `/reports/shift-revenue`
  - `/reports/branch-profitability`
  - `/reports/credit-exposure`
  - `/reports/daily-cash-confirmations`
- Acceptance:
  - Consolidated HO and filtered branch views produce consistent totals.

---

## Epic C: Phase 2 Dashboards

### C1. Accountant dashboard (P2)

- KPIs:
  - Daily cash confirmations
  - Expense lifecycle
  - Trial balance and reconciliation indicators
  - Cash flow and profitability snapshot
- Data sources:
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
- Acceptance:
  - Financial totals reconcile with accounting reports routes.

### C2. CEO dashboard (P2)

- KPIs:
  - Revenue
  - Profit
  - Cash flow
  - Credit risk
  - Delivery service score
- Data sources:
  - `/accounting/reports/income-statement`
  - `/accounting/reports/profit-loss`
  - `/accounting/reports/cash-flow`
  - `/accounting/reports/balance-sheet`
  - `/reports/branch-profitability`
  - `/reports/credit-exposure`
  - `/reports/delivery-performance`
- Acceptance:
  - Executive summary cards match underlying detail reports.

---

## Epic D: Phase 3 Dashboards

### D1. Auditor dashboard (P3)

- KPIs:
  - Suspicious/deleted actions
  - Variance anomalies
  - Reconciliation variances
- Data sources:
  - `/reports/audit/*` routes
  - `/audit/entities/:entityType/:entityId`
  - `/reports/daily-cash-confirmations`
  - `/reports/expense-by-category`
  - `/reports/tobepaid-collections-reconciliation`
- Acceptance:
  - Drill-down from summary metric to audit evidence works.

### D2. Secretary dashboard (P3)

- KPIs:
  - Parcel service board
  - Uncollected/aged parcels
  - Delivery pipeline
- Data sources:
  - `/reports/parcel-status-summary`
  - `/reports/delivery-performance`
  - `/reports/tobepaid-outstanding`
  - Customer statement endpoints
- Acceptance:
  - Service board filters by destination branch/location correctly.

### D3. IT dashboard (P3)

- KPIs:
  - Role/permission changes
  - Module changes
  - Security-sensitive activity trend
- Data sources:
  - `/reports/audit/*` routes
  - `/audit/entities/:entityType/:entityId`
  - RBAC/users/module endpoints
- Acceptance:
  - High-risk activity list supports user/entity drill-down.

---

## Epic E: Phase 4 Hardening

### E1. Export and print

- CSV export for all widgets/tables.
- Printable summary layout per role.

### E2. Saved filter presets

- Save named scope/date presets per user and role dashboard.

### E3. Threshold alerts

- Alert cards for:
  - cash variance above threshold
  - credit exposure threshold
  - delivery delay threshold

### E4. Performance and caching

- Optimize heavy dashboards with memoized selectors and query caching.
- Add baseline telemetry for dashboard load time and API latency.

---

## Technical Dependencies

- Ensure role-to-permission mapping exists for:
  - Admin, Cashier, Auditor, IT, CEO, Accountant, Secretary, HR Manager
- Confirm backend scope enforcement for branch/location filters.
- Confirm all report routes honor `branchId`/`locationId` constraints per user context.

---

## Suggested Initial Tickets (Next to Start)

1. `A1` Role routes + guard integration
2. `A2` Shared scope filter bar
3. `B1` Cashier dashboard page
4. `B2` HR Manager dashboard page
5. `B3` Admin dashboard page
