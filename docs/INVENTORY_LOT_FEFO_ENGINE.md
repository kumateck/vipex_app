# Inventory Lot/Batch + FEFO Engine

This module adds lot-level inventory tracking and true FEFO allocation for stock reservations and fulfillment.

## What is included

- `stock_lots`: lot balances by `company + product + location + batch`.
- `stock_lot_movements`: immutable lot movement ledger.
- `stock_reservation_allocations.source_lot_id`: reservation allocations can pin a specific lot.
- `stock_movements.lot_id`: movement rows can reference a lot.

## Key behavior

1. Reservation allocation now prefers lot rows (`status = ACTIVE`) and sorts by:
   - earliest `expiry_date` first (FEFO)
   - then earliest `received_at`
   - then highest available where needed
2. Allocation reserves lot quantity by increasing `stock_lots.reserved_quantity`.
3. Re-allocation releases previous reservations and decrements lot reserved balances.
4. Issuing from reservation consumes the reserved lot first when `source_lot_id` is present.
5. Request fulfillment and transfer flows now carry lot balances across locations.

## APIs

- `GET /inventory/stock-lots`
- `GET /inventory/stock-lots/analytics`
- `GET /inventory/stock-lots/:id`
- `GET /inventory/stock-lots/:id/traceability`
- `POST /inventory/stock-lots`
- `PATCH /inventory/stock-lots/:id/status`
- `GET /inventory/stock-lot-expiry/alerts`
- `POST /inventory/stock-lot-expiry/sweep`

Procurement integration:

- `POST /procurement/goods-receipts` now captures and links lot metadata per line (`lotId`, `batchNumber`, `supplierBatchNumber`, `manufacturedAt`, `expiryDate`).
- Goods receipt replenishment now auto-retries open/short reservations for each received product.

`POST /inventory/stock-movements` and `POST /inventory/stock-adjustments` now accept optional lot fields:

- `batchNumber`
- `sourceLotId`
- `supplierBatchNumber`
- `expiryDate`
- `manufacturedAt`
- `receivedAt` (movement only)

## UI pages (independent)

- `/inventory/stock-lots` (list)
- `/inventory/stock-lots/new` (create)
- `/inventory/stock-lots/view/:id` (detail)
- `/inventory/stock-lots/traceability/:id` (traceability)
- `/inventory/stock-lots/expiry-alerts` (alerts + sweep)
- `/inventory/stock-lots/analytics` (aging + FEFO analytics)

## Migration

Apply `drizzle/0035_inventory_lot_fefo_engine.sql`.
Apply `drizzle/0036_procurement_grn_lot_capture.sql`.
