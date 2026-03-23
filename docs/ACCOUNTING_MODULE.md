# Accounting Module

## Scope

The accounting module is implemented as a controlled ledger system for branch-based operations.

It covers:

- chart of accounts
- journal batches, entries, and lines
- payroll accrual journal posting
- daily cash confirmation
- expense request approval and posting
- tax journal capture and filing review
- financial reporting from posted journal lines

## Core Rules

- Every accounting entry belongs to a `branch`.
- `location` is optional and acts as a branch sub-dimension.
- `recorded_by_user_id` is used for audit.
- Raw operational activity is not the general ledger.
- Only approved or confirmed accounting events post to the general ledger.
- Tax calculation remains driven by the existing Ghana tax calculator.
- Accounting is company-gated through `companies.use_accounting`.

## Standalone Enablement

The accounting module is standalone at company level.

- If `companies.use_accounting = false`, accounting routes are blocked.
- Accounting pages are hidden from the sidebar.
- Direct navigation to accounting pages shows a disabled state.
- Payment, parcel, cashier, queue, and delivery flows continue to operate normally.
- Payment-side tax journal capture is skipped while accounting is disabled.
- Head office can manage the toggle from `/settings/company`, which uses the existing company module controls and keeps the company flag in sync.

This means the company can run the operational system without forcing accounting adoption.

## Data Model

Main tables in [src/db/schemas/accounting.ts](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/db/schemas/accounting.ts):

- `chart_of_accounts`
- `company_bank_accounts`
- `expense_categories`
- `accounting_approval_policies`
- `petty_cash_funds`
- `journal_batches`
- `journal_entries`
- `journal_lines`
- `daily_cash_confirmations`
- `expense_requests`
- `petty_cash_replenishments`
- `cash_to_bank_transfers`
- `tax_filing_periods`
- `tax_journal_items`
- `tax_filing_audit_logs`

Supporting enums are in [src/db/schemas/enums.ts](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/db/schemas/enums.ts).

## Seeded Accounts

Seed script:

- [scripts/seed_accounting.ts](/Users/gigisiri/Business/Employment/vipex/vipex_app/scripts/seed_accounting.ts)

The seed includes:

- asset accounts
- liability accounts
- equity accounts
- revenue accounts
- expense accounts
- company bank placeholders
- expense categories mapped to accounts
- approval policies
- branch petty cash funds
- Ghana tax profile and components

Run after migration:

```bash
bun run seed:accounting
```

## Daily Cash Confirmation

Backend:

- routes: [src/server/features/accounting/routes.ts](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/server/features/accounting/routes.ts)
- service: [src/server/features/accounting/service.ts](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/server/features/accounting/service.ts)

Frontend:

- [src/features/accounting/pages/accounting-daily-cash-page.tsx](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/features/accounting/pages/accounting-daily-cash-page.tsx)

Workflow:

1. Accountant selects branch, optional location, optional cashier, and date.
2. System can pull expected totals from recorded payments using:
   - `cashSalesPsw`
   - `nonCashSalesPsw`
   - `totalSalesPsw`
   - sender / receiver / delivery splits
   - principal cash split
   - delivery cash split
   - selected cashier session context when available
3. Expected physical cash auto-defaults from the selected branch, location, cashier, and date unless the user manually overrides it.
4. Accountant records counted physical cash.
5. Record is created as `DRAFT`.
6. Accountant confirms it.
7. Confirmed record is posted to the ledger.

Posting rule:

- Dr `1120 Confirmed Sales Cash - Branch`
- Cr `4000 Parcel Revenue`
- Cr `4010 Delivery Revenue`
- If shortage:
  - Dr `5210 Cash Shortage Expense`
- If overage:
  - Cr `4030 Cash Overage Income`

Important:

- Expected physical cash uses only cash payments.
- Non-cash collections are shown separately for review.
- When a cashier session exists for the selected cashier and day, the screen also shows session status, expected closing balance, reported closing balance, and session variance.
- The UI can use session closing or expected closing balances to prefill counted cash.
- Revenue posting is split between parcel revenue and delivery revenue based on the cash payment mix for the selected confirmation scope.

## Payroll Posting

Backend integration:

- payroll service: [src/server/features/payroll/service.ts](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/server/features/payroll/service.ts)
- shared posting service: [src/server/features/accounting/posting.service.ts](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/server/features/accounting/posting.service.ts)

Workflow:

1. Payroll cycle is created.
2. Payroll cycle is run.
3. Payroll cycle is approved.
4. Approved payroll is journalized.
5. Posted payroll can be reversed if a reopen is needed.

Posting rule:

- Dr `5190 Compensation`
- Cr `2100 Accrued Expenses`

Current implementation notes:

- posting is grouped by branch using payroll run snapshots
- posting requires accounting to be enabled for the company
- posting requires seeded chart accounts from [scripts/seed_accounting.ts](/Users/gigisiri/Business/Employment/vipex/vipex_app/scripts/seed_accounting.ts)
- journal source type is `PAYROLL`
- reversal posts a new balanced journal batch with debits and credits swapped from the original payroll batch
- reversing a payroll journal moves the cycle back to `APPROVED`, after which payroll can be reopened

## Expense Requests

Frontend:

- [src/features/accounting/pages/accounting-expenses-page.tsx](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/features/accounting/pages/accounting-expenses-page.tsx)

Workflow:

1. User records expense request.
2. Request is submitted.
3. Approved or rejected.
4. Approved request is marked paid.
5. Paid request is posted to the ledger.

Funding sources:

- `PETTY_CASH`
- `SALES_CASH`
- `COMPANY_BANK`

Posting rule:

- Dr mapped expense account
- Cr source cash account

Source cash account selection:

- petty cash -> branch petty cash fund account
- sales cash -> `1120 Confirmed Sales Cash - Branch`
- company bank -> selected company bank account

## Tax Workflow

Frontend:

- [src/features/accounting/pages/accounting-tax-page.tsx](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/features/accounting/pages/accounting-tax-page.tsx)

Tax journal capture:

- taxable payment creation automatically records tax journal items
- implemented in [src/server/features/payments/service.ts](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/server/features/payments/service.ts)

Tax item statuses:

- `UNFILED`
- `READY_FOR_FILING`
- `FILED`
- `EXCLUDED`

Tax filing period statuses:

- `OPEN`
- `UNDER_REVIEW`
- `SUBMITTED`
- `CLOSED`

Period workflow:

1. Create filing period.
2. Move to `UNDER_REVIEW`.
3. Submit period.
4. Close period.

Enforcement:

- a period cannot be submitted without tax items
- a period cannot be closed until all linked items are either `FILED` or `EXCLUDED`

Item workflow:

1. Item is created as `UNFILED`.
2. Reviewer marks item `READY_FOR_FILING`.
3. Reviewer marks item `FILED`.
4. Optional exclusion uses `EXCLUDED` and requires a reason.

Notes:

- Filing status does not alter tax calculation.
- Excluded items remain visible.
- Audit log is stored in `tax_filing_audit_logs`.

## Reports

Frontend:

- [src/features/accounting/pages/accounting-reports-page.tsx](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/features/accounting/pages/accounting-reports-page.tsx)

Implemented reports:

- Trial Balance
- Account Statement
- Income Statement
- Profit & Loss
- Balance Sheet
- Cash Flow
- Monthly Branch Summary

Frontend packaging:

- CSV export for the active report
- print-friendly report output for the active report

Report source:

- posted journal lines only

Monthly branch summary:

- same account split by branch
- branch totals side by side
- overall total on the right

This matches the internal management reporting requirement rather than legal group consolidation.

## Routes

Frontend routes:

- `/accounting/daily-cash`
- `/accounting/expenses`
- `/accounting/tax`
- `/accounting/reports`

Backend routes are under `/v1/accounting`.

Key endpoints:

- `GET /accounting/daily-cash-expected`
- `GET /accounting/daily-cash-confirmations`
- `POST /accounting/daily-cash-confirmations`
- `POST /accounting/daily-cash-confirmations/:id/confirm`
- `POST /accounting/daily-cash-confirmations/:id/post`
- `GET /accounting/expense-requests`
- `POST /accounting/expense-requests`
- `POST /accounting/expense-requests/:id/submit`
- `POST /accounting/expense-requests/:id/approve`
- `POST /accounting/expense-requests/:id/reject`
- `POST /accounting/expense-requests/:id/pay`
- `POST /accounting/expense-requests/:id/post`
- `GET /accounting/tax-filing-periods`
- `POST /accounting/tax-filing-periods`
- `POST /accounting/tax-filing-periods/:id/review`
- `POST /accounting/tax-filing-periods/:id/submit`
- `POST /accounting/tax-filing-periods/:id/close`
- `GET /accounting/tax-journal-items`
- `POST /accounting/tax-journal-items/:id/ready`
- `POST /accounting/tax-journal-items/:id/file`
- `POST /accounting/tax-journal-items/:id/exclude`
- `GET /accounting/reports/trial-balance`
- `GET /accounting/reports/account-statement`
- `GET /accounting/reports/income-statement`
- `GET /accounting/reports/profit-loss`
- `GET /accounting/reports/balance-sheet`
- `GET /accounting/reports/cash-flow`
- `GET /accounting/reports/monthly-branch-summary`

## Current Limitations

- Daily cash confirmation defaults are derived from recorded payments and session summaries, but accountant batches are not auto-created from session closure yet.
- Revenue posting is split between parcel revenue and delivery revenue, but not yet into finer sub-accounts such as sender vs receiver revenue.
- Tax filing close enforcement is implemented, but accounting action endpoints still rely on record IDs and should be tightened further with explicit company ownership checks if you want stricter tenant isolation.
- Export supports CSV and browser print output; richer packaged exports such as PDF or spreadsheet templates are not implemented yet.

## Verification

Recommended checks:

```bash
bunx tsc --noEmit
bun scripts/generate-routes.ts
```
