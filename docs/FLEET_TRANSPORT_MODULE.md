# Fleet & Transport Module

## Scope

Fleet v1 is implemented as a company-enabled module (`fleet_transport`) with separated screens for:

- list pages
- create pages
- approvals pages

This separation is enforced in UI routes and backend permissions.

## Module Gate

- Module code: `fleet_transport`
- Backend guard: `requireModuleEnabled('fleet_transport')`
- Route mapping for frontend module gate:
  - `src/shared/company-modules/route-modules.ts`

If `fleet_transport` is disabled for a company:

- `/fleet-transport/*` routes are blocked in private layout
- fleet sidebar entries are hidden
- `/v1/fleet-transport/*` endpoints are blocked

## Backend Endpoints

Base: `/v1/fleet-transport`

### Vehicles

- `GET /vehicles`
- `POST /vehicles`
- `PATCH /vehicles/:id`

### Fuel Logs

- `GET /fuel-logs`
- `POST /fuel-logs`
- `POST /fuel-logs/:id/approve`
- `POST /fuel-logs/:id/reject`

Backend files:

- `src/server/features/fleet-transport/routes.ts`
- `src/server/features/fleet-transport/controller.ts`
- `src/server/features/fleet-transport/service.ts`
- `src/server/features/fleet-transport/repository.ts`

## Data Model

Tables:

- `fleet_vehicles`
- `fleet_fuel_logs`

Schema file:

- `src/db/schemas/fleet-transport.ts`

## UI Routes (Separated)

- `/fleet-transport` (home launcher)
- `/fleet-transport/vehicles` (vehicles list)
- `/fleet-transport/vehicles/new` (vehicle create)
- `/fleet-transport/fuel-logs` (fuel log list)
- `/fleet-transport/fuel-logs/new` (fuel log create)
- `/fleet-transport/fuel-logs/approvals` (fuel approvals only)

Frontend files:

- `src/features/fleet-transport/api/fleet-transport.api.ts`
- `src/features/fleet-transport/pages/fleet-transport-home-page.tsx`
- `src/features/fleet-transport/pages/fleet-vehicles-list-page.tsx`
- `src/features/fleet-transport/pages/fleet-vehicles-create-page.tsx`
- `src/features/fleet-transport/pages/fleet-fuel-logs-list-page.tsx`
- `src/features/fleet-transport/pages/fleet-fuel-logs-create-page.tsx`
- `src/features/fleet-transport/pages/fleet-fuel-logs-approvals-page.tsx`

## Permissions

Fleet actions are role-gated with dedicated keys:

- `CanReadFleetTransport`
- `CanCreateFleetVehicles`
- `CanUpdateFleetVehicles`
- `CanCreateFleetFuelLogs`
- `CanApproveFleetFuelLogs`

Mapped routes are listed in:

- `docs/ROUTE_PERMISSION_MATRIX.md`

## Notes

- Vehicle edit/deactivate is done from vehicles list page via `PATCH /vehicles/:id`.
- Fuel approvals are intentionally separate and intended for approver roles only.
