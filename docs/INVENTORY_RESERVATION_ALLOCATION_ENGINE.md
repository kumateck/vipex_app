# Inventory Reservation + Allocation Engine

Date: April 9, 2026

## What Was Implemented

The inventory engine now includes:

1. Allocation policy configuration.
2. Reservation ledger per stock-request line.
3. Source allocations per reservation.
4. Allocation execution (policy-based).
5. Issue execution from reserved allocations.
6. Exception summary for shortage and pending work.
7. Replenishment-triggered re-allocation (auto-retry) for open/short reservations.

## Data Model

Migration:

- `drizzle/0034_inventory_reservation_allocation_engine.sql`

Schema additions:

- `stock_allocation_policies`
- `stock_reservations`
- `stock_reservation_allocations`

Enums:

- `StockAllocationStrategy` (`FEFO=0`, `OLDEST_RECEIPT=1`, `HIGHEST_AVAILABLE=2`)
- `StockReservationStatus` (`OPEN=0`, `PARTIALLY_ALLOCATED=1`, `ALLOCATED=2`, `ISSUED=3`, `SHORT=4`, `CANCELLED=5`)
- `StockReservationAllocationStatus` (`RESERVED=0`, `RELEASED=1`, `ISSUED=2`)

## Core Logic

When a stock request is approved:

- Reservations are auto-created for each request line.

Allocation run:

- Selects candidate source lots (preferred) and source locations.
- Computes available stock as `lot_on_hand - lot_reserved` (or level fallback).
- Applies policy sorting:
  - same-branch prioritization (optional)
  - strategy sorting (FEFO / oldest receipt / highest available)
- Creates reservation allocations up to max source locations.
- Marks reservation status as allocated / partially allocated / short.

Issue run:

- Issues from reserved allocations in sequence.
- Posts stock movements and stock level updates through existing fulfillment flow.
- Updates allocation issued quantities and reservation status.

Manual and auto-fulfillment:

- Synchronize reservation progress (issued/reserved/short) after fulfillment.

Replenishment auto-retry:

- On procurement goods receipt posting, each replenished product triggers
  `retryOpenStockReservationsForProductSvc`.
- Open/partially allocated/short reservations are re-allocated in FIFO reservation order.
- This enables progressive fulfillment when stock arrives later.

## Backend Endpoints

Added in inventory routes:

- Policies
  - `GET /inventory/allocation-policies`
  - `POST /inventory/allocation-policies`
- Reservations
  - `GET /inventory/stock-reservations`
  - `GET /inventory/stock-reservations/:id`
  - `POST /inventory/stock-reservations/:id/allocate`
  - `POST /inventory/stock-reservations/:id/issue`
  - `GET /inventory/stock-reservations/exceptions/summary`
- Request integration
  - `POST /inventory/stock-requests/:id/sync-reservations`

## UI Pages (Independent)

- Reservation list:
  - `/inventory/stock-reservations`
- Reservation detail:
  - `/inventory/stock-reservations/view/:id`
- Reservation exceptions:
  - `/inventory/stock-reservations/exceptions`
- Allocation policy view:
  - `/inventory/stock-allocation-policy`
- Allocation policy edit:
  - `/inventory/stock-allocation-policy/edit`

No create/list consolidation was used for these workflows.

## Notes

- FEFO now uses lot-level expiry and receipt metadata where lot allocations are available.
- Reservation allocation still falls back to stock-level candidates when lot metadata is unavailable.
