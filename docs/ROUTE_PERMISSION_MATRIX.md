# Route Permission Matrix

Last generated: 2026-10-08

Source of truth: `src/shared/permissions/constants.ts` (`RoutePermissionOverrides`).

The matrix is split by domain so each reference remains readable:

- [Operations and people](permissions/ROUTE_PERMISSION_OPERATIONS.md)
- [Platform and finance](permissions/ROUTE_PERMISSION_PLATFORM_FINANCE.md)
- [Supply chain and fleet](permissions/ROUTE_PERMISSION_SUPPLY_FLEET.md)
- [Reports](permissions/ROUTE_PERMISSION_REPORTS.md)

Each listed route is guarded by its exact override permission. Routes without an exact override use the application's shared path-access resolution and server endpoint authorization. Navigation visibility is not authorization: the server must still enforce permission, module, company, branch, and domain-assignment rules.

`/users/devices` uses shared path-access resolution for `CanUpdateUsers`, requires the
`device_verification` company module, and is restricted to head office by its page and API.
See [Native Device Registration](DEVICE_REGISTRATION.md).

Storage clearance history at `/parcels/storage-clearances` also accepts request, approve, or
execute clearance permission through shared path-access resolution. Action pages keep their own
exact permission. This permits workflow participants to follow returned requests and history
without a separate read grant; the API enforces the same scoped read access. See
[Storage clearance](PARCEL_OPERATIONS.md#storage-fee-clearance-reconciliation).

`/parcels/shelf-pickup-reassignment` requires `CanUpdateParcelShelfPicker` independently of
`CanReadShelfPickerUpdate`. The server derives company/branch scope and validates active
replacement staff. Web and desktop provide the dedicated page; mobile has no equivalent screen.
See [Shelf pickup reassignment](PARCEL_OPERATIONS.md#shelf-pickup-reassignment).

Mobile routes use the same exact permission constants but have their own native route names and UI guards. The current mapping for self-service completion, call-center follow-up, receiving discrepancies, delivery-change review, and customer lookup is maintained in [Mobile Frontline Workflows](MOBILE_FRONTLINE_WORKFLOWS.md). Server authorization remains authoritative for every mobile request.

When `RoutePermissionOverrides` changes, regenerate every table and update the generation date in the same change.
