# API: Enterprise Modules

All paths are relative to `/v1`. Optional module roots are denied when the corresponding company module is disabled, even if the user has a related permission.

## Accounting

`/accounting` covers:

- chart of accounts and account statements
- expense categories, requests, approvals, payments, and posting
- approval policies and bank accounts
- tax profiles, components, filing periods, and journal items
- daily cash expected values and confirmations
- manual journals and approvals
- trial balance, income statement, profit and loss, balance sheet, cash flow, general ledger, activity, and branch summaries

Ledger accounts can be deleted only when no transactions or setup references depend on them. Entity audit history is available through `/audit/entities/:entityType/:entityId`.

Key permissions include `CanReadAccounting`, `CanManageAccountingSetup`, `CanManageTaxFiling`, and `CanPostAccountingEntries`.

## Customer Wallet and Credit

`/customer-wallet-credit` covers account summaries, approvals, open items, payments, blocking, and unblocking. Access uses read, payment-create, and control-approval permissions.

## Reconciliation

`/reconciliation` covers branch options, sessions, approval/finalization, bank settlements, and settlement approval/rejection. Creation and approval permissions are separate.

## Procurement

`/procurement` covers:

- suppliers
- operational and low-stock demand intake
- consolidations
- purchase requests and approvals
- fleet procurement policies
- supplier quotes
- purchase orders
- goods receipts

Read, create, update, and approve actions have separate permissions and the `procurement` module gate.

## Inventory

`/inventory` covers:

- categories, products, and inventory locations
- stock levels, lots, expiry, and traceability
- movements, adjustments, consumption, transfers, and counts
- requests, issue, receive, fulfil, and acknowledgement
- reservations and allocation policy
- monitoring and reorder suggestions
- maintenance, approvals, valuation, replenishment, and tasks
- audit journal, corrections, and enterprise KPIs

Inventory actions enforce granular permission and location/branch scope.

## Fleet Transport

`/fleet-transport` covers:

- vehicles, documents, and master data
- trips, crew, route plans, start, close, and check-in/out
- fuel logs, approvals, analytics, and fraud signals
- driver compliance, training, rosters, incidents, and policy acknowledgements
- maintenance plans, work orders, parts, downtime, and procurement linkage
- dispatch board, route assignment, load matching, live status, and exceptions
- decision support, executive scorecard, and unit economics

Fleet uses granular page and action permissions under the `fleet_transport` module.

## Human Capital and Payroll

`/hr` covers departments, job titles, employees, attendance, leave types, leave requests, approval/rejection, and supported scheduling actions.

`/payroll` covers groups, earning/deduction types, compensation, cycles, overtime, adjustments, approval/rejection, payslips, bank export, journalization, reversal, and reopen.

HR and payroll have independent company-module gates and granular permissions.

## Notification Hub

`/notification-hub` covers providers, defaults, templates, campaigns, submit/approve/reject/send, dispatch summaries, dispatch retry, and parcel-status call events.

Provider administration, template management, campaign creation/approval/send, retry, and call-center notification actions are separately authorized.

See the corresponding canonical module documents in the [Documentation Hub](../README.md).
