# Route Permission Matrix

Last generated: 2026-10-08

Source of truth: `src/shared/permissions/constants.ts` (`RoutePermissionOverrides`).

Charge-agent selectors use existing workflow permissions: booking options at
`GET /shipments/bookings/charge-agent-options` require `CanCreateBookingWithParcels`; self-service
options at `GET /self-service/charge-agent-options` require `CanCompleteSelfServiceBookings`.
Both are authenticated and company/source-branch scoped. No user-administration permission or
new page permission is required. See [Parcel Operations](PARCEL_OPERATIONS.md#agent-who-charged-the-parcel).

The matrix is split by domain so each reference remains readable:

Parcel information edits use a dedicated endpoint with authenticated company/destination-branch
scope. A receiver correction requires both a supported parcel workflow permission and
`CanUpdateCustomers`; customer management permission alone cannot rewrite a parcel name.
Details-only edits retain the workflow permission without a customer-update grant. See
[Operations endpoint permissions](permissions/ROUTE_PERMISSION_OPERATIONS.md#parcel-information-edits).

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

The shared delivery fee editor on Rider Returns and Delivery Cashier uses
`GET/PATCH /deliveries/dd/:parcelId/fee`. It accepts `CanDispatchForDelivery`,
`CanMarkDoorstepCalled`, or `CanCompleteDoorstepDelivery`, plus active non-rider account,
company and destination-branch checks. Riders retain the reviewed change-request workflow.
No page permission override changes. See [Editing delivery fees](PARCEL_OPERATIONS.md#editing-delivery-fees-and-manually-repairing-cleared-fees).

The shared staff pickup action `POST /deliveries/dd/:parcelId/return-to-pickup` checks the
current locked parcel state: `CanMarkDoorstepCalled` for Home Delivery Requested,
`CanDispatchForDelivery` for Address Collected/Returned to Office, or
`CanCompleteDoorstepDelivery` for Rider Given Parcel to Customer. It derives company and
destination-branch scope from authentication and rejects rider/inactive accounts. No page
permission overrides change. The legacy `returned-to-pickup` endpoint retains its dispatch
permission and completed-return-only constraint. See
[Returning home delivery parcels to main-office pickup](PARCEL_OPERATIONS.md#returning-home-delivery-parcels-to-main-office-pickup).
