# Parcel Internal Transfers

## Purpose

Parcel internal transfers track physical custody movement inside a branch network without changing the parcel shipment status.

This supports:

- main branch to location
- location to main branch
- location to location
- branch to warehouse
- warehouse to main branch
- warehouse to location

## Core Rule

Internal transfers do **not** update `parcels.status`.

They only update the parcel's internal holder after the destination acknowledges receipt.

## Holder Types

Supported holder types:

- `BRANCH`
- `LOCATION`
- `WAREHOUSE`

Warehouses are branch-owned and only valid inside their parent branch.

## Workflow

1. User creates an internal transfer for one or more parcels.
2. Transfer is stored as `PENDING`.
3. Parcels remain at their previous internal holder until receipt is acknowledged.
4. Destination acknowledges the transfer.
5. Parcel internal holder is updated to the destination holder.
6. Transfer becomes `ACKNOWLEDGED`.

Optional:

- A pending transfer can be cancelled with a reason.

## Statuses

- `PENDING`
- `ACKNOWLEDGED`
- `CANCELLED`

## Warehouse Management

Frontend:

- `/warehouses`

Backend:

- `/v1/warehouses`
- `/v1/warehouses/options`

Warehouses:

- belong to a branch
- can be active or inactive
- can be soft-deleted only when no parcel is currently held there

## Transfer Endpoints

Backend:

- `GET /v1/shipments/parcel-internal-transfers`
- `GET /v1/shipments/parcel-internal-transfers/:id`
- `POST /v1/shipments/parcel-internal-transfers`
- `POST /v1/shipments/parcel-internal-transfers/:id/acknowledge`
- `POST /v1/shipments/parcel-internal-transfers/:id/cancel`

Frontend:

- `/parcels/internal-transfers`
- `/parcels/internal-transfers/acknowledge`

Current internal holder visibility is also exposed on parcel operations screens so staff can see where a parcel is physically being held before handover or transfer decisions are made.

Both transfer pages also support printing a transfer slip with:

- reference number
- source and destination holder
- parcel list
- notes
- transfer and acknowledgement signature lines

## Validation Rules

- all parcels in a transfer must currently belong to the same branch
- source and destination holders must be different
- location and warehouse holders must belong to the same branch as the transfer
- a parcel cannot be added to another pending transfer until the current one is acknowledged or cancelled
- destination acknowledgement is what updates parcel internal holder state

## Data Model

Main tables:

- `warehouses`
- `parcel_internal_holders`
- `parcel_internal_transfers`
- `parcel_internal_transfer_items`

Migration:

- `drizzle/0016_internal_parcel_transfers.sql`

## Permissions

- `CanReadWarehouses`
- `CanCreateWarehouses`
- `CanUpdateWarehouses`
- `CanDeleteWarehouses`
- `CanReadParcelInternalTransfers`
- `CanCreateParcelInternalTransfers`
- `CanAcknowledgeParcelInternalTransfers`
- `CanCancelParcelInternalTransfers`

Role management now includes quick presets for:

- `Warehouse Viewer`
- `Warehouse Manager`
- `Internal Transfer Clerk`
- `Transfer Acknowledgement Officer`
- `Internal Transfer Full Access`
