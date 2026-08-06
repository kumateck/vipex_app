# Procurement Module

## Scope

Procurement v1 is implemented as a company-enabled module (`procurement`) with separated screens for:

- list pages
- create pages
- approvals pages

This separation is enforced in UI routes and backend permissions.

## Module Gate

- Module code: `procurement`
- Backend guard: `requireModuleEnabled('procurement')`
- Route mapping for frontend module gate:
  - `src/shared/company-modules/route-modules.ts`

If `procurement` is disabled for a company:

- `/procurement/*` routes are blocked in private layout
- procurement sidebar entries are hidden
- `/v1/procurement/*` endpoints are blocked

## Backend Endpoints

Base: `/v1/procurement`

### Suppliers

- `GET /suppliers`
- `POST /suppliers`
- `PATCH /suppliers/:id`

### Purchase requests

- `GET /purchase-requests`
- `POST /purchase-requests`
- `POST /purchase-requests/:id/approve`
- `POST /purchase-requests/:id/reject`

Backend files:

- `src/server/features/procurement/routes.ts`
- `src/server/features/procurement/controller.ts`
- `src/server/features/procurement/service.ts`
- `src/server/features/procurement/repository.ts`

## Data Model

Tables:

- `procurement_suppliers`
- `procurement_purchase_requests`

Schema file:

- `src/db/schemas/procurement.ts`

## UI Routes (Separated)

- `/procurement` (home launcher)
- `/procurement/suppliers` (supplier list)
- `/procurement/suppliers/new` (supplier create)
- `/procurement/purchase-requests` (request list)
- `/procurement/purchase-requests/new` (request create)
- `/procurement/purchase-requests/approvals` (approvals only)

Frontend files:

- `src/features/procurement/api/procurement.api.ts`
- `src/features/procurement/pages/procurement-home-page.tsx`
- `src/features/procurement/pages/procurement-suppliers-list-page.tsx`
- `src/features/procurement/pages/procurement-suppliers-create-page.tsx`
- `src/features/procurement/pages/procurement-requests-list-page.tsx`
- `src/features/procurement/pages/procurement-requests-create-page.tsx`
- `src/features/procurement/pages/procurement-requests-approvals-page.tsx`

## Permissions

Procurement actions are role-gated with dedicated keys:

- `CanReadProcurement`
- `CanCreateProcurementSuppliers`
- `CanUpdateProcurementSuppliers`
- `CanCreateProcurementPurchaseRequests`
- `CanApproveProcurementPurchaseRequests`

Mapped routes are listed in:

- `docs/ROUTE_PERMISSION_MATRIX.md`

## Notes

- Supplier edit/deactivate is done from supplier list page via `PATCH /suppliers/:id`.
- Approvals page is intentionally separate and intended for approver roles only.
