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
