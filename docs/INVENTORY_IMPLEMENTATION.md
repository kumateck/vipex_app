# Inventory Implementation (Current)

## Scope

This document covers the current inventory implementation in `vipex_app`, including:

- multi-unit per-product conversions (base-unit ledger model)
- location hierarchy with typed locations
- stock requests with partial fulfillment and auto allocation
- stock reconciliation/cycle-count sessions with approval and adjustment posting
- request and transfer acknowledgement ledgers (partial receipt confirmation + variance capture)
- recoverable maintenance lifecycle
- location-scoped inventory dashboard
- reorder intelligence (min-level gap + suggested source locations)
- daily inventory automation (expiry sweep + optional email alerts)
- inventory monitoring dashboard for rollout
- UI page map (independent list/create/detail pages)
- permissions and route access

Date aligned to implementation: **April 9, 2026**.

Related document:

- `docs/PROCUREMENT_ORCHESTRATION_IMPLEMENTATION.md` (demand -> quote -> PO -> goods receipt orchestration)
- `docs/INVENTORY_RESERVATION_ALLOCATION_ENGINE.md` (reservation ledger + policy-driven allocation + issue flow)
- `docs/INVENTORY_LOT_FEFO_ENGINE.md` (lot/batch tracking + true FEFO allocation + lot-aware issue)
- `docs/INVENTORY_ROLLOUT_RUNBOOK.md` (phased branch rollout + monitoring operations)
- `docs/INVENTORY_STAGING_EXECUTION_CHECKLIST.md` (staging execution and UAT checklist)

## Core Design Principles

1. **All stock quantities are persisted in smallest/base unit**.
2. **Displayed quantities are formatted into best unit breakdown** using each product’s configured conversion chain.
3. **Location model uses one table with enum type and parent hierarchy**:
   - `MAIN_STORE = 0`
   - `BRANCH_STORE = 1`
   - `CONSUMPTION_LOCATION = 2`
4. **Requests and transfers support partial fulfillment**.
5. **Recoverability is product-level configuration** (`products.is_recoverable`).
6. **Pages remain independent** (list, create, detail/edit separated).

## Enums (Numeric)

Source: `src/db/schemas/enums.ts`

### Existing inventory enums

- `StockMovementType`: `RECEIPT=0`, `ISSUE=1`, `ADJUSTMENT=2`, `TRANSFER_OUT=3`, `TRANSFER_IN=4`
- `StockAdjustmentReason`: `DAMAGE=0`, `LOSS=1`, `FOUND=2`, `RECOUNT=3`, `EXPIRED=4`, `OTHER=5`
- `TransferStatus`: `PENDING=0`, `IN_TRANSIT=1`, `COMPLETED=2`, `CANCELLED=3`, `PARTIALLY_FULFILLED=4`
- `StockRequestStatus`: `DRAFT=0`, `SUBMITTED=1`, `APPROVED=2`, `PARTIALLY_FULFILLED=3`, `FULFILLED=4`, `REJECTED=5`, `CANCELLED=6`
- `InventoryLocationType`: `MAIN_STORE=0`, `BRANCH_STORE=1`, `CONSUMPTION_LOCATION=2`
- `UnitOfMeasure`: `PIECE=0`, `BOX=1`, `CARTON=2`, `KG=3`, `LITER=4`, `METER=5`, `PACK=6`, `DOZEN=7`
- `StockLotStatus`: `ACTIVE=0`, `EXPIRED=1`, `QUARANTINED=2`, `DEPLETED=3`

### New maintenance enums

- `InventoryMaintenanceIssueType`: `MAINTENANCE=0`, `DAMAGE=1`, `MISSING=2`
- `InventoryMaintenanceStatus`: `OPEN=0`, `CLOSED=1`

## Data Model

### Product + Unit Conversion

- `products`
  - includes `unit_of_measure` (base unit)
  - includes `is_recoverable` (boolean)
  - includes `min_stock_level`
- `product_unit_conversions`
  - one row per product/unit with `factor_to_base`
  - enforced chain validation at service/form layer

### Location Hierarchy

- `inventory_locations`
  - `location_type` enum
  - `parent_location_id` self-reference

### Stock Ledger

- `stock_levels` (current balances by product/location)
- `stock_movements` (audit log by movement type)
- `stock_lots` (lot-level balances by product/location/batch)
- `stock_lot_movements` (lot-level movement ledger)
- `stock_adjustments`
- `stock_transfers` (`fulfilled_quantity` supports partial transfer)

### Requests

- `stock_requests`
- `stock_request_lines` (`requested_quantity`, `fulfilled_quantity`)

### Maintenance Lifecycle

- `stock_maintenance_records`
  - issue type, open/closed status
  - quantity, quantity returned, quantity disposed
  - created/resolved audit fields

## Migrations

- `0028_inventory_location_hierarchy_partial_transfers.sql`
- `0030_product_unit_conversions.sql`
- `0031_stock_requests.sql`
- `0032_inventory_dashboard_maintenance_allocation.sql`
- `0034_inventory_reservation_allocation_engine.sql`
- `0035_inventory_lot_fefo_engine.sql`
- `0036_procurement_grn_lot_capture.sql`
- `0037_inventory_stock_count_reconciliation.sql`
- `0038_inventory_acknowledgement_reorder_engine.sql`
- journal updated in `drizzle/meta/_journal.json`

## Backend API Surface

Base prefix: `/inventory`

### Dashboard

- `GET /dashboard/location-summary`
  - query: `companyId`, optional `locationId`, optional `lowStockLimit`
  - returns scoped totals, low-stock list, open maintenance list, scoped location IDs

### Products

- `POST /products` supports `isRecoverable`
- `PATCH /products/:id` supports `isRecoverable`
- product responses include conversion rows and recoverability

### Stock Requests

- `GET /stock-requests`
- `GET /stock-requests/:id`
- `POST /stock-requests`
- `POST /stock-requests/:id/submit`
- `POST /stock-requests/:id/approve`
- `POST /stock-requests/:id/reject`
- `POST /stock-requests/:id/fulfill` (manual line fulfillment)
- `GET /stock-requests/:id/allocation?lineId=...` (source suggestion)
- `POST /stock-requests/:id/auto-fulfill` (multi-source partial allocation)
- `POST /stock-requests/:id/lines/:lineId/acknowledge` (partial receipt acknowledgement by requester)

### Stock Maintenance

- `GET /stock-maintenance`
- `GET /stock-maintenance/:id`
- `POST /stock-maintenance`
- `POST /stock-maintenance/:id/resolve`

### Stock Lots

- `GET /stock-lots`
- `GET /stock-lots/analytics`
- `GET /stock-lots/:id`
- `GET /stock-lots/:id/traceability`
- `POST /stock-lots`
- `PATCH /stock-lots/:id/status`
- `GET /stock-lot-expiry/alerts`
- `POST /stock-lot-expiry/sweep`
- `POST /automation/run-daily`
- `GET /monitoring/summary`

### Stock Count Sessions (Cycle Count / Reconciliation)

- `GET /stock-count-sessions`
- `GET /stock-count-sessions/:id`
- `POST /stock-count-sessions`
  - supports optional `productIds[]` to run scoped cycle counts (partial SKU count)
- `PATCH /stock-count-sessions/:id/lines/:lineId`
- `POST /stock-count-sessions/:id/submit`
- `POST /stock-count-sessions/:id/approve`

### Stock Transfer Receipt Acknowledgement

- `POST /stock-transfers/:id/acknowledge-receipt`
  - captures accepted qty, damaged qty, missing qty
  - auto-posts variance deduction at destination stock when damaged/missing > 0

### Reorder Intelligence

- `GET /reorder-suggestions`
  - returns min-level reorder gaps per product/location
  - includes top suggested source locations using hierarchy-aware prioritization

### Procurement -> Inventory Lot Capture

- `POST /procurement/goods-receipts` now persists line-level lot metadata:
  - `batchNumber`
  - `supplierBatchNumber`
  - `manufacturedAt`
  - `expiryDate`
  - linked `lotId` (FK to `stock_lots`)
- Goods receipt posting now:
  1. upserts lot by `company + product + location + batch`
  2. writes lot movement and stock movement with `lotId`
  3. re-runs allocation for open/short reservations on received products

## Business Flow Logic

### A) Request lifecycle

`DRAFT -> SUBMITTED -> APPROVED -> PARTIALLY_FULFILLED -> FULFILLED`

Alternative: `SUBMITTED -> REJECTED`

Rules:

- manager can fulfill partially
- remaining can be fulfilled later
- request status recalculates from line fulfillment totals

### B) Auto allocation algorithm (request line)

1. load candidates with available stock for product
2. exclude requester location itself
3. prioritize:
   - `requestedToLocationId` (if present)
   - `MAIN_STORE`
   - `BRANCH_STORE`
   - others
4. fulfill from each source until remaining is zero or sources are exhausted
5. write `TRANSFER_OUT` and `TRANSFER_IN` movements
6. update source and requester `stock_levels`
7. update request line and request status
8. on replenishment (e.g., procurement GRN), open/short reservations are auto-retried

### C) Maintenance lifecycle

Open record:

- validates product/location/company
- for `MAINTENANCE` issue type, product must be recoverable
- deducts stock immediately from location (`ISSUE` movement)

Resolve record:

- validates returned/disposed arithmetic equals recorded quantity
- non-recoverable products cannot return quantity
- missing records cannot return quantity
- returned quantity is re-added to stock (`RECEIPT` movement)
- record is closed with resolver audit

## UI Architecture (Independent Pages)

### Inventory overview

- `/inventory` -> dashboard page (not redirect)

### Stock requests

- list: `/inventory/stock-requests`
- create: `/inventory/stock-requests/new`
- detail: `/inventory/stock-requests/view/:id`
- fulfill line: `/inventory/stock-requests/fulfill/:requestId/:lineId`

### Stock maintenance

- list: `/inventory/stock-maintenance`
- create: `/inventory/stock-maintenance/new`
- detail/resolve: `/inventory/stock-maintenance/view/:id`

### Existing stock pages retained

- levels, movements, adjustments, transfers remain independent pages

### Stock lot operations pages

- list: `/inventory/stock-lots`
- create: `/inventory/stock-lots/new`
- detail: `/inventory/stock-lots/view/:id`
- traceability: `/inventory/stock-lots/traceability/:id`
- expiry alerts: `/inventory/stock-lots/expiry-alerts`
- analytics: `/inventory/stock-lots/analytics`

### Stock count + monitoring pages

- list: `/inventory/stock-count-sessions`
- create: `/inventory/stock-count-sessions/new` (location searchable select + optional product multi-select)
- detail/reconcile: `/inventory/stock-count-sessions/view/:id`
- monitoring: `/inventory/monitoring`
- reorder suggestions: `/inventory/reorder-suggestions`
- request line acknowledge: `/inventory/stock-requests/acknowledge/:requestId/:lineId`
- transfer receive acknowledge: `/inventory/stock-transfers/receive/:id`

## Quantity Conversion Behavior

Utilities:

- `src/shared/inventory/unit-conversion.ts`
- `src/shared/inventory/quantity-display.ts`

Behavior:

- form inputs can be entered in selected unit
- conversion to base unit happens before API submit
- table/detail rendering formats base quantity into best unit breakdown

## Permissions and Path Access

Updated in:

- `src/shared/permissions/constants.ts`
- `src/shared/permissions/path-access.ts`
- `src/components/sidebar/navigation.tsx`

New permission keys added for:

- stock request workflow (`read/list/get/create/submit/approve/reject/fulfill`)
- dashboard summary read
- stock maintenance (`read/list/get/create/resolve`)

## Key Files Added

### New pages/components

- `src/features/inventory/stock/pages/inventory-overview-page.tsx`
- `src/features/inventory/stock/pages/stock-requests-list-page.tsx`
- `src/features/inventory/stock/pages/stock-requests-create-page.tsx`
- `src/features/inventory/stock/pages/stock-request-detail-page.tsx`
- `src/features/inventory/stock/pages/stock-request-fulfill-page.tsx`
- `src/features/inventory/stock/pages/stock-maintenance-list-page.tsx`
- `src/features/inventory/stock/pages/stock-maintenance-create-page.tsx`
- `src/features/inventory/stock/pages/stock-maintenance-detail-page.tsx`
- `src/features/inventory/stock/components/stock-request-columns.tsx`
- `src/features/inventory/stock/components/stock-requests-table.tsx`
- `src/features/inventory/stock/components/stock-request-form.tsx`
- `src/features/inventory/stock/components/stock-maintenance-columns.tsx`
- `src/features/inventory/stock/components/stock-maintenance-table.tsx`
- `src/features/inventory/stock/components/stock-maintenance-form.tsx`
- `src/features/inventory/stock/components/stock-maintenance-resolve-form.tsx`

### New route files

- `src/pages/(private)/(configurations)/inventory/stock-requests/...`
- `src/pages/(private)/(configurations)/inventory/stock-maintenance/...`

## Operational Notes

1. Apply DB migrations up to `0035_inventory_lot_fefo_engine`.
2. Ensure RBAC roles include newly added permission keys.
3. Verify existing roles that can manage requests now include auto-fulfill and maintenance keys if required.
4. Dashboard and maintenance modules rely on location and product master quality (hierarchy and recoverability).

## Known Constraints

- Runtime verification (type-check/tests/migrations) could not be executed in this environment because `node`/`bunx` are unavailable.
- Existing repository has unrelated in-flight changes in other modules; this document scopes only inventory-related implementation.

## Major Modules (1-6) Implementation Status

Implemented backend + UI foundations for six major inventory blocks:

1. Approval policy engine

- Tables: `inventory_approval_policies`, `inventory_approval_requests`
- APIs: list/create policy, submit/list/decide/escalate requests
- UI pages: `/inventory/approval-policies`, `/inventory/approval-policies/new`, `/inventory/approval-requests`

2. Valuation + finance integration

- Tables: `inventory_valuation_snapshots`, `inventory_financial_postings`
- APIs: valuation summary, recompute snapshots, sync missing financial postings
- UI page: `/inventory/valuation`

3. Planning engine

- Tables: `inventory_replenishment_proposals`, `inventory_replenishment_proposal_lines`
- APIs: generate/list/get/decide replenishment proposals
- UI pages: `/inventory/replenishment-proposals`, `/inventory/replenishment-proposals/new`, `/inventory/replenishment-proposals/view/:id`

4. Physical operations layer

- Tables: `inventory_tasks`, `inventory_task_scans`
- APIs: list/get/create tasks, update task status, scan task
- UI pages: `/inventory/tasks`, `/inventory/tasks/new`, `/inventory/tasks/view/:id`

5. Audit/compliance hardening

- Table: `inventory_event_journal`
- APIs: list event journal, post manual correction
- UI pages: `/inventory/audit/journal`, `/inventory/audit/corrections/new`

6. Enterprise reporting pack

- API: enterprise KPI pack (movements, service level, aging)
- UI page: `/inventory/reports/enterprise-kpis`

All pages are independent routes (no create+datatable consolidation on one page).
