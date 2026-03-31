# Procurement QA Checklist

## Preconditions

1. `procurement` module is enabled for target company.
2. Test user has required role permissions:
   - `CanReadProcurement`
   - `CanCreateProcurementSuppliers`
   - `CanUpdateProcurementSuppliers`
   - `CanCreateProcurementPurchaseRequests`
   - `CanApproveProcurementPurchaseRequests` (approver user)
3. Backfill role permissions independently after migrations:
   - `bun run seed:permissions:system-admin`
   - confirms `System Admin` receives any missing permissions from `PermissionCatalog`

## Module Gate

1. Disable `procurement` in company modules.
2. Confirm:
   - `/procurement/*` pages are inaccessible.
   - procurement menu items are hidden.
   - `/v1/procurement/*` returns module-disabled error.
3. Re-enable `procurement` and verify access is restored.

## Suppliers

1. Go to `/procurement/suppliers`.
2. Create supplier via `/procurement/suppliers/new`.
3. Confirm new supplier appears in list.
4. Edit supplier from list action.
5. Deactivate supplier from list action.
6. Reactivate supplier from list action.
7. Verify search and pagination still work.

## Purchase Requests

1. Go to `/procurement/purchase-requests`.
2. Create request via `/procurement/purchase-requests/new`.
3. Confirm request appears with `Submitted` status.
4. Filter by supplier and status.

## Approvals

1. Go to `/procurement/purchase-requests/approvals` as approver.
2. Approve one submitted request.
3. Reject another submitted request with reason.
4. Verify approved/rejected requests no longer appear in pending approvals.
5. Verify status updates on request list page.

## RBAC Guards

1. Remove `CanApproveProcurementPurchaseRequests` from a user role.
2. Confirm:
   - Approvals page link is hidden.
   - `/procurement/purchase-requests/approvals` is denied.
   - approve/reject API endpoints are forbidden.
3. Remove `CanUpdateProcurementSuppliers`.
4. Confirm edit/deactivate buttons are hidden and patch calls are forbidden.
