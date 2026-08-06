# Fleet & Transport QA Checklist

## Preconditions

1. `fleet_transport` module is enabled for target company.
2. Test user has required role permissions:
   - `CanReadFleetTransport`
   - `CanCreateFleetVehicles`
   - `CanUpdateFleetVehicles`
   - `CanCreateFleetFuelLogs`
   - `CanApproveFleetFuelLogs` (approver user)
3. Backfill role permissions independently after migrations:
   - `bun run seed:permissions:system-admin`

## Module Gate

1. Disable `fleet_transport` in company modules.
2. Confirm:
   - `/fleet-transport/*` pages are inaccessible.
   - fleet menu items are hidden.
   - `/v1/fleet-transport/*` returns module-disabled error.
3. Re-enable `fleet_transport` and verify access is restored.

## Vehicles

1. Go to `/fleet-transport/vehicles`.
2. Create vehicle via `/fleet-transport/vehicles/new`.
3. Confirm new vehicle appears in list.
4. Edit vehicle from list action.
5. Deactivate vehicle from list action.
6. Reactivate vehicle from list action.
7. Verify search and pagination still work.

## Fuel Logs

1. Go to `/fleet-transport/fuel-logs`.
2. Create fuel log via `/fleet-transport/fuel-logs/new`.
3. Confirm log appears with `Submitted` status.
4. Filter by vehicle and status.

## Approvals

1. Go to `/fleet-transport/fuel-logs/approvals` as approver.
2. Approve one submitted fuel log.
3. Reject another submitted fuel log with reason.
4. Verify approved/rejected logs no longer appear in pending approvals.
5. Verify status updates on fuel logs list page.

## RBAC Guards

1. Remove `CanApproveFleetFuelLogs` from a user role.
2. Confirm:
   - Fuel approvals page link is hidden.
   - `/fleet-transport/fuel-logs/approvals` is denied.
   - approve/reject API endpoints are forbidden.
3. Remove `CanUpdateFleetVehicles`.
4. Confirm edit/deactivate buttons are hidden and patch calls are forbidden.
