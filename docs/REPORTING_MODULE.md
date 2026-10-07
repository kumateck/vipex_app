# Reporting Module

## Overview

The reporting module provides a shared read layer for operational reports that span HR, payroll, customers, parcels, and cashier activity.

UI entry points:

- `/reports`
- `/reports/parcels/daily-audit`
- `/accounting/reports`

Backend entry points:

- `/v1/reports/*`
- `/v1/accounting/reports/*`

## Current Reports Center Scope

The shared reports page at `/reports` currently supports:

- Employee master report
- Attendance register
- Leave requests report
- Payroll register
- Payroll overtime report
- Payroll adjustments report
- Customer statement
- Parcel status summary
- Shift revenue report
- Branch profitability report
- Credit exposure report
- Customer credit aging detail report
- To-be-paid outstanding report
- To-be-paid collections reconciliation report
- Daily cash confirmations report
- Expense by category report
- Payroll journal reconciliation report
- Delivery performance report
- Daily Cashier Sales report
- Sticker Print Usage report

Accounting-specific financial statements remain under `/accounting/reports`.

## Print and Export Pattern

Operational reports use a shared frontend print/export pattern:

- report filters are rendered on the page
- the visible table is exportable to CSV
- the printable document is rendered through a hidden shared print component
- printing is handled by `react-to-print`
- print layout is formatted for company letterhead-friendly `Letter` pages

Core frontend files:

- [src/features/reporting/pages/reports-page.tsx](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/features/reporting/pages/reports-page.tsx)
- [src/features/reporting/components/printable-report-document.tsx](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/features/reporting/components/printable-report-document.tsx)
- [src/features/reporting/api/reporting.api.ts](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/features/reporting/api/reporting.api.ts)

## Backend Endpoints

Implemented:

- `GET /v1/reports/employees`
- `GET /v1/reports/attendance`
- `GET /v1/reports/leave-requests`
- `GET /v1/reports/payroll-register`
- `GET /v1/reports/payroll-overtime`
- `GET /v1/reports/payroll-adjustments`
- `GET /v1/reports/payroll-journal-reconciliation`
- `GET /v1/reports/cashier-performance`
- `GET /v1/reports/daily-cash-confirmations`
- `GET /v1/reports/expense-by-category`
- `GET /v1/reports/shift-revenue`
- `GET /v1/reports/branch-profitability`
- `GET /v1/reports/credit-exposure`
- `GET /v1/reports/customer-credit-aging-detail`
- `GET /v1/reports/tobepaid-outstanding`
- `GET /v1/reports/tobepaid-collections-reconciliation`
- `GET /v1/reports/parcel-status-summary`
- `GET /v1/reports/delivery-performance`
- `GET /v1/reports/daily-cashier-sales`
- `GET /v1/reports/daily-cashier-sales/cashiers`
- `GET /v1/reports/accounting/storage-waivers`
- `GET /v1/reports/sticker-print-usage`
- `GET /v1/reports/daily-parcel-audit`

Report notes:

- Credit exposure is the customer-level summary of outstanding balances by aging bucket.
- Customer credit aging detail expands that into open charge-level items with allocation progress and age bucket.
- To-be-paid outstanding shows unpaid receiver principal after direct principal payments.
- To-be-paid collections reconciliation extends that view by combining direct principal payments with delivery-posted customer credit charges to show recognized collections versus remaining exposure.
- Daily Cashier Sales summarizes sessions, gross and responsibility-specific sales, payment methods, transactions, and to-be-paid items for the selected date and authorized branch/cashier scope.
- Its Payments view and printed report also break collected sales down by each parcel's source → destination branch route, with sender, receiver, delivery, cash, non-cash, and total amounts. Outstanding To Be Paid is excluded from collected route sales.
- After Daily Cashier Sales loads, users can filter the returned result to Sender only, Receiver
  only, or Delivery Cashier only. Full Cashier scope loads all three modules. The post-load filter
  recalculates on-screen and printed summaries without widening server authorization or issuing a
  second report request; To Be Paid rows appear only in All or Sender views.
- Sticker Print Usage reports successful sticker-print events and copy totals by date, branch, actor, booking, tracking number, and parcel.
- Daily Parcel Audit selects non-deleted parcels created on the chosen Ghana calendar date at
  their source branch. Head office can choose a branch or all branches; branch staff are locked
  to their own branch. Receiver-to-pay and sender-paid views use the same loaded cohort. The
  receiver view can filter paid, credited, partial, or unpaid principal; either view can filter
  delivered or pending delivery. Payment status is calculated from non-voided principal payments,
  with separately identified delivery-posted principal credit; delivery uses the parcel's current
  delivered state and delivery record, never a payment timestamp. Expected receiver principal is
  the parcel's current To Be Paid balance plus recorded receiver principal payments; outstanding
  subtracts recognized delivery credit from that current balance, floored at zero. Sender
  payments and delivery fees are shown separately and are not treated as receiver collections.
  The summary's delivery rate uses delivered/displayed parcels; its cash collection rate uses
  receiver principal payments divided by receiver expected principal (credit is separate).
  Totals, summary, CSV, and print all use the displayed view. The Analytics tab uses those same
  filtered rows without an additional request. It charts receiver payment state (receiver view),
  delivery state, principal amounts in GHS, source-branch parcel counts (top seven plus other),
  and creation time in Ghana four-hour bands. Credit and cash are separate bars, and delivery
  state is not inferred from payment. Empty filtered results show no charts. Charts are on-screen
  only; CSV and print remain the detail export. This is a current-state audit of a
  creation-date cohort, not a historical as-of snapshot or a transactions-on-that-day report.
  QA: verify split, fully sender-paid, fully receiver-paid, partial, credited, voided-payment,
  delivered-but-unpaid, undelivered-but-paid, deleted, and cross-branch cases; compare CSV and
  print totals with the on-screen filtered rows; verify chart counts and GHS values against
  those same rows after switching payment view, payment status, delivery status, and branch.

## Known Cashier Filter Defect

Daily Cashier Sales report access and cashier-option access currently use different permissions. A Delivery Supervisor who can view the report but cannot read the cashier directory may be incorrectly treated as a self-scoped cashier. The required behavior is documented in [Cashier Payments and Shifts](CASHIER_PAYMENTS_AND_SHIFTS.md): authorized supervisors must select allowed cashier types and cashiers, and a role must not be inferred to be a cashier assignment.

## Permissions and Module Gating

Reports use the underlying domain permissions rather than a single global reporting permission.

Examples:

- employee report requires `CanListEmployees`
- attendance report requires `CanListAttendance`
- leave report requires `CanListLeaveRequests`
- payroll register requires `CanReadPayrollRun`
- payroll overtime and adjustments require `CanReadPayrollInputs`
- parcel status summary requires `CanViewReportParcelsStatusSummary`
- daily cashier sales requires `CanViewReportCashierShifts`; cashier-option loading must use a compatible report-scoped authorization model
- sticker print usage requires `CanViewReportStickerPrintUsage`
- daily parcel audit requires `CanViewReportParcelsDailyAudit`

Where the report depends on a company-scoped module, module gating also applies:

- HR reports require `hr`
- payroll reports require `payroll`

## Extension Pattern

When adding a new report:

1. add the query in `src/server/features/reporting/repository.ts`
2. add the aggregation/validation in `src/server/features/reporting/service.ts`
3. expose the endpoint in `src/server/features/reporting/routes.ts`
4. add the client query to `src/features/reporting/api/reporting.api.ts`
5. add a new tab/section in `src/features/reporting/pages/reports-page.tsx`
6. reuse the shared print and CSV export model instead of creating a one-off print page unless the report is a formal document
7. update `API.md`, this document, the route-permission matrix, and a report QA scenario in the same change

Formal documents like payslips can still keep dedicated print views when the layout is materially different.
