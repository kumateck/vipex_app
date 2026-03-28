# Daily Implementation - 2026-03-28

## Summary

Implemented a new **parcel masters** capability to standardize:

- `Parcel Content` (with price + tax mode)
- `Parcel Details` (packaging style only, no price)

and integrated it into parcel booking for both module-enabled and module-disabled flows.

---

## 1) New Parcel Masters Data Model

Added new schema file:

- `src/db/schemas/parcel-masters.ts`

### Tables added

1. `parcel_content_catalog`

- `company_id`
- `name`
- `description`
- `base_price_psw`
- `tax_inclusive`
- `active`
- `sort_order`
- audit fields (`created_by`, `created_at`, `updated_at`)

2. `parcel_detail_catalog`

- `company_id`
- `name`
- `description`
- `active`
- `sort_order`
- audit fields (`created_by`, `created_at`, `updated_at`)

Also exported in:

- `src/db/schemas/index.ts`

---

## 2) Migration Added

Added:

- `drizzle/0021_parcel_masters.sql`

and journal entry:

- `drizzle/meta/_journal.json` (`idx: 21`, tag `0021_parcel_masters`)

---

## 3) Backend Feature: Parcel Masters API

Added new feature module:

- `src/server/features/parcel-masters/repository.ts`
- `src/server/features/parcel-masters/service.ts`
- `src/server/features/parcel-masters/routes.ts`

Mounted in server app:

- `src/server/app.ts`

Route base:

- `/v1/shipments/parcel-masters/*`

### Endpoints

- `GET /content-options`
- `GET /detail-options`
- `POST /contents`
- `PATCH /contents/:id`
- `POST /details`
- `PATCH /details/:id`

---

## 4) Company Modules Added

Added module catalog/seed entries in:

- `scripts/seed_initial.ts`

### New module codes

- `parcel_content_pricing`
- `parcel_packaging_styles`

Both are seeded **disabled by default**.

---

## 5) Parcel Booking UI Integration

Updated parcel API hooks/types:

- `src/features/operations/parcel/api/parcel.api.ts`

Updated form value model:

- `src/features/operations/parcel/components/parcel-create/parcel-form.types.ts`

Updated booking form/module gating:

- `src/features/operations/parcel/components/parcel-create-form.tsx`
- `src/features/operations/parcel/components/parcel-create/parcel-card.tsx`

### New per-parcel form fields

- `parcelContentOptionId`
- `parcelDetailOptionId`
- `extraWeightCharge`

### UI behavior

1. If `parcel_packaging_styles` is enabled:

- `Parcel Details` uses dropdown (standard packaging styles)
- free-text is hidden

2. If `parcel_content_pricing` is enabled:

- `Parcel Content` uses dropdown
- `Charge` auto-calculates from selected content base price
- `extraWeightCharge` is shown and added to `Charge`

3. If modules are disabled:

- Text entry is available (legacy behavior preserved)

---

## 6) Always-On Master Linkage (Important Business Rule)

Implemented in:

- `src/server/features/shipments/booking-with-parcels.service.ts`

At booking creation time, for every parcel:

1. **Parcel Content**

- If typed content does not exist in `parcel_content_catalog`, create it.
- New records default `tax_inclusive = true`.
- New content price defaults from typed parcel charge.
- If typed content already exists and incoming charge is empty, charge is auto-filled from catalog base price.

2. **Parcel Details (Packaging)**

- If typed detail does not exist in `parcel_detail_catalog`, create it.
- No price is stored for details.

This enforces consistent data growth even when modules are disabled.

---

## 7) Free-Text Existing Content Auto-Price

Implemented UI enhancement in:

- `src/features/operations/parcel/components/parcel-create/parcel-card.tsx`

When content module is disabled and user types free-text content:

- on blur, if typed value matches an existing content catalog item,
- `Charge` auto-fills with the saved base price.

---

## 8) Seeded Default Master Data

Added defaults in:

- `scripts/seed_initial.ts`

### Parcel packaging styles

- Box
- Envelope
- Sack
- Crate

### Parcel contents

- General Goods
- Documents
- Spare Parts

---

## 9) Validation

Ran typecheck successfully after implementation:

- `bunx tsc --noEmit`

No TypeScript errors from this implementation set.

---

## 10) Permission Model Hardening (Granular Action Permissions)

Expanded and wired permission model for strict action-level control.

### Implemented

- Added granular action permissions in catalog (including legacy compatibility markers where needed).
- Updated server route guards to use explicit action permissions instead of broad consolidated keys.
- Updated permission UI metadata mapping and rendering behavior for clearer tab/module grouping.
- Enforced create/update/delete separation in mixed CRUD pages:
  - accounting setup
  - warehouses

### Key files

- `src/shared/permissions/constants.ts`
- `src/shared/permissions/ui-metadata.ts`
- `src/shared/permissions/path-access.ts`
- `src/server/features/accounting/routes.ts`
- `src/server/features/payroll/routes.ts`
- `src/server/features/rbac/routes.ts`
- `src/features/accounting/pages/accounting-setup-page.tsx`
- `src/features/warehouses/pages/warehouses-page.tsx`
- `src/features/rbac/components/permissions/permissions-page-content.tsx`

---

## 11) Parcel Soft Delete + Linked Payment Soft Delete (Void)

Implemented a full operational recovery flow for cashier mistakes:

- Parcel deletion is now soft delete only.
- Linked payments are soft deleted by voiding only.
- A reason is mandatory.
- Auditable event is recorded.

### New permission

- `CanSoftDeleteParcelsAndPayments`

### Backend behavior

- New endpoint: `POST /v1/shipments/parcels/:id/soft-delete`
- Guarded by:
  - `requireAuth()`
  - `requirePermissions(CanSoftDeleteParcelsAndPayments)`
- Service performs transaction:
  - validates delete reason
  - validates parcel state
  - soft deletes parcel
  - voids active linked payments
  - writes audit log action `PARCEL_SOFT_DELETED`

### Frontend behavior

- Sender cashier page has `Delete Parcel` action (permission-aware).
- Delete dialog requires reason.
- Success toast includes payment voiding summary.

### Key files

- `src/server/features/shipments/parcels.routes.ts`
- `src/server/features/shipments/parcels.controller.ts`
- `src/server/features/shipments/parcels.service.ts`
- `src/server/features/shipments/parcels.repository.ts`
- `src/server/features/payments/repository.ts`
- `src/features/operations/parcel/api/parcel.api.ts`
- `src/features/operations/parcel/pages/parcel-sender-payments-page.tsx`

---

## 12) Deleted Parcel Audit Reporting Page

Replaced placeholder page with working deleted-parcel audit view:

- route: `/reports/audit/deleted`
- lists parcel delete entries sourced from audit logs action `PARCEL_SOFT_DELETED`
- shows:
  - tracking
  - booking
  - delete reason
  - linked payment deletion status summary
  - deleted timestamp

### Key file

- `src/pages/(private)/reports/audit/deleted/page.tsx`

---

## 13) Super Search Deleted Parcel Alert (Operational Safety)

Updated super search flow to ensure deleted records are visible and explicitly warned:

- super search now includes deleted parcels (`includeDeleted: true`)
- parcel detail dialog shows prominent alert when parcel is deleted
- alert states:
  - deleted by who
  - delete reason
  - instruction to consult the person before proceeding

### Data source

- pulls most recent audit log for:
  - `entityType=parcel`
  - `action=PARCEL_SOFT_DELETED`
  - `entityId=<parcelId>`

### Key files

- `src/features/operations/parcel/pages/parcel-super-search-page.tsx`
- `src/features/audit/api.ts`
- `src/server/features/audit/repository.ts`

---

## 14) Schema-First Cleanup for Fresh Baseline Migration

Per instruction to treat this as first clean migration, moved operational delete/void details into schema as first-class fields.

### Added to schema

1. `parcels`

- `deleted_by`
- `deleted_at`
- `delete_reason`

2. `payments`

- `void_reason`
- `voided_by` now references `users.id`

3. relations

- parcel relation: `deletedByUser`
- payment relation: `voidedByUser`

### Runtime wiring updates

- parcel deletion now writes `deleted_by/deleted_at/delete_reason`
- payment voiding now writes `void_reason`
- APIs/types updated to expose new fields where relevant

### Key files

- `src/db/schemas/shipments.ts`
- `src/db/schemas/payments.ts`
- `src/db/schemas/relations.ts`
- `src/server/features/shipments/parcels.service.ts`
- `src/server/features/payments/repository.ts`
- `src/features/operations/parcel/api/parcel.api.ts`

---

## 15) Fresh Migration Baseline Regenerated

Executed fresh generator flow to replace old incremental migration chain with one canonical baseline migration.

### Command run

- `bun run generate`

### Result

- Removed old `drizzle/0001...0021` migration files.
- Created single baseline:
  - `drizzle/0000_fluffy_yellow_claw.sql`
- Updated:
  - `drizzle/meta/_journal.json`
  - `drizzle/meta/0000_snapshot.json`

---

## 16) Final Validation Passes (Post-Changes)

Executed and passed:

- `bunx tsc -p tsconfig.json --noEmit`
- targeted `bunx --bun eslint` on all modified files

No type or lint issues remained in the changed implementation set.

---

## 17) Sidebar Permission Key Hardening (Granular + Explicit)

Completed final hardening for sidebar permission mapping so route/menu visibility and permission semantics are explicit and consistent.

### What changed

1. Replaced broad sidebar permission assignments with granular keys for operational routes:

- pickup queue:
  - `CanCreatePickupQueue`
  - `CanReadSenderPickupQueue`
  - `CanReadReceiverPickupQueue`
- call center status:
  - `CanReadCallCenterParcelStatus`
- dispatch:
  - `CanDispatchForDelivery`
- rider views:
  - `CanReadRiderCurrentParcels`
  - `CanReadRiderHistory`
- cashier session views:
  - `CanReadActiveCashierSessions`
  - `CanReadCashierSessionsHistory`
  - `CanReadOpenCashierSessions`
  - `CanReadCloseCashierSessions`
- user list variants:
  - `CanReadActiveUsers`
  - `CanReadInactiveUsers`
- HR list views:
  - `CanReadAttendance`
  - `CanReadLeaveRequests`
- inventory page views:
  - `CanReadProducts`
  - `CanReadProductCategories`
  - `CanReadInventoryLocations`
  - `CanReadStockLevels`
  - `CanReadStockMovements`
  - `CanReadStockAdjustments`
  - `CanReadStockTransfers`

2. Added the above keys to the permission catalog.

3. Updated `RoutePermissionOverrides` to map affected routes to the new granular keys.

4. Kept the standard `PermissionKeys` constant as the single source in sidebar code (no alternate key object).

5. Added explicit `permissionKey` for every report menu item under sidebar `Reports`, using `PermissionKeys.CanViewReport...` so report permissions are visible directly in navigation config (in addition to route override mapping).

### Key files

- `src/shared/permissions/constants.ts`
- `src/components/sidebar/navigation.tsx`
- `src/shared/permissions/path-access.ts`
- `docs/ROUTE_PERMISSION_MATRIX.md`

### Validation

Executed and passed:

- `bunx tsc -p tsconfig.json --noEmit`
- `bunx eslint src/components/sidebar/navigation.tsx`
- `bunx eslint src/components/sidebar/navigation.tsx src/shared/permissions/constants.ts`
