# Procurement Replenishment Orchestration (Implemented)

## Scope Delivered

This implementation completes the procurement orchestration block with independent pages and APIs for:

1. Inventory low-stock demand intake.
2. Demand consolidation batches.
3. Demand approvals/rejections.
4. Supplier quote capture and acceptance.
5. Purchase order creation from accepted quotes.
6. Goods receipt posting with stock updates and auto-fulfill progression.

## Data Model

- Migration: `drizzle/0033_procurement_replenishment_orchestration.sql`
- Schema updates: `src/db/schemas/procurement.ts`

Added/updated entities:

- `procurement_demands`:
  - approval/rejection fields (`approvedByUserId`, `approvedAt`, `rejectedByUserId`, `rejectedAt`, `rejectionReason`)
  - status includes `APPROVED`.
- `procurement_demand_consolidations`
- `procurement_demand_consolidation_items`
- `procurement_supplier_quotes`
- `procurement_purchase_orders`
- `procurement_purchase_order_items`
- `procurement_goods_receipts`
- `procurement_goods_receipt_items`

## Backend APIs

Routes implemented in `src/server/features/procurement/routes.ts`:

- Demands
  - `POST /procurement/demands/from-inventory-low-stock`
  - `GET /procurement/demands/consolidations`
  - `POST /procurement/demands/consolidations`
  - `POST /procurement/demands/:id/approve`
  - `POST /procurement/demands/:id/reject`
- Supplier Quotes
  - `GET /procurement/supplier-quotes`
  - `POST /procurement/supplier-quotes`
  - `POST /procurement/supplier-quotes/:id/accept`
- Purchase Orders
  - `GET /procurement/purchase-orders`
  - `POST /procurement/purchase-orders/from-accepted-quotes`
- Goods Receipts
  - `GET /procurement/goods-receipts`
  - `POST /procurement/goods-receipts`

Controller orchestration: `src/server/features/procurement/controller.ts`  
Service orchestration: `src/server/features/procurement/service.ts`  
Repository persistence: `src/server/features/procurement/repository.ts`

## Stock Posting + Partial Fulfillment Behavior

On goods receipt creation:

- PO item `receivedQuantity` and `backorderQuantity` are updated.
- Stock movement rows are posted (`movementType = RECEIPT`).
- Stock levels are upserted at receipt location.
- PO status transitions (`OPEN` -> `PARTIALLY_RECEIVED` -> `RECEIVED`).
- Outstanding partially-fulfilled stock requests are auto-fulfilled when received stock is now available in the same source location.

## Frontend API Integration

Added in `src/features/procurement/api/procurement.api.ts`:

- Inventory intake mutation.
- Demand consolidation list/create.
- Demand approve/reject mutations.
- Supplier quotes list/create/accept.
- Purchase orders list/create-from-accepted-quotes.
- Goods receipts list/create.

## UI Pages (Independent List/Create)

Each list and create flow is separated per your rule (no combined list+create page):

- Inventory intake
  - `/procurement/demands/inventory-low-stock`
- Demand consolidations
  - `/procurement/demands/consolidations`
  - `/procurement/demands/consolidations/new`
- Demand approvals
  - `/procurement/demands/approvals`
- Supplier quotes
  - `/procurement/supplier-quotes`
  - `/procurement/supplier-quotes/new`
- Purchase orders
  - `/procurement/purchase-orders`
  - `/procurement/purchase-orders/new`
- Goods receipts
  - `/procurement/goods-receipts`
  - `/procurement/goods-receipts/new`

Feature pages are under `src/features/procurement/pages/` and route files under `src/pages/(private)/procurement/...`.

## Navigation and Access Control

Updated:

- Sidebar links: `src/components/sidebar/navigation.tsx`
- Route permission map: `src/shared/permissions/constants.ts`

Permissions reused:

- `CanReadProcurement`
- `CanCreateProcurementPurchaseRequests`
- `CanApproveProcurementPurchaseRequests`

## Notes

- Runtime typecheck could not be executed in this environment because `node`/`npx`/`bunx` are unavailable.
