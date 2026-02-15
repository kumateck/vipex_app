# VIPEX ERP Backend Endpoints (v1)

Base path: `/v1`

## Existing implemented domains

- `Auth`: `/auth/*`
- `Users`: `/users/*`
- `Branches`: `/branches/*`
- `Locations`: `/locations/*`
- `Statuses`: `/statuses/*`
- `Customers`: `/customers/*`
- `Cashiers`: `/cashiers/*`
- `Shipments`: `/shipments/bookings/*`, `/shipments/parcels/*`, `/shipments/consignments/*`, `/shipments/auto-grouping/*`
- `Payments`: `/payments/*`
- `Deliveries`: `/deliveries/*`
- `Inventory`: `/inventory/*`
- `Accounting`: `/accounting/taxes/compute`

## New endpoint groups scaffolded (typed, pending service implementation)

All endpoints below are now mounted and return `501` until business logic is connected.

### Shifts

- `GET /shifts/sessions`
- `POST /shifts/sessions/open`
- `POST /shifts/sessions/:id/close`
- `POST /shifts/sessions/:id/approve`
- `GET /shifts/sessions/:id/report`
- `GET /shifts/sessions/active/by-branch/:branchId`

### Reporting

- `GET /reports/cashier-performance`
- `GET /reports/shift-revenue`
- `GET /reports/branch-profitability`
- `GET /reports/credit-exposure`
- `GET /reports/tobepaid-outstanding`
- `GET /reports/parcel-status-summary`

### Audit

- `GET /audit/logs`
- `GET /audit/logs/:id`
- `GET /audit/entities/:entityType/:entityId`
- `POST /audit/exports`

### HR

- `GET /hr/employees`
- `POST /hr/employees`
- `GET /hr/employees/:id`
- `PATCH /hr/employees/:id`
- `POST /hr/attendance/check-in`
- `POST /hr/attendance/check-out`
- `GET /hr/attendance`

### Payroll

- `GET /payroll/cycles`
- `POST /payroll/cycles`
- `POST /payroll/cycles/:id/run`
- `POST /payroll/cycles/:id/approve`
- `GET /payroll/cycles/:id/payslips`
- `POST /payroll/cycles/:id/journalize`

### RBAC

- `GET /rbac/roles`
- `POST /rbac/roles`
- `PATCH /rbac/roles/:id`
- `DELETE /rbac/roles/:id`
- `GET /rbac/permissions`
- `PUT /rbac/roles/:id/permissions`
- `POST /rbac/users/:userId/roles`
- `DELETE /rbac/users/:userId/roles/:roleId`
