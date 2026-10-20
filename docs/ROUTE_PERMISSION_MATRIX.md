# Route Permission Matrix

Last generated: 2026-10-17

`/customer-messages` requires `CanReadCustomerMessages`; handling changes additionally
require `CanManageCustomerMessages`. The backend derives company scope from the
authenticated user. Internal ticket permissions grant no inbox access. See
[Customer website messages](CUSTOMER_WEBSITE_MESSAGES.md).

Source of truth: `src/shared/permissions/constants.ts` (`RoutePermissionOverrides`).

Saved call outcome notification resends use
`POST /v1/notification-hub/events/parcel-status-call/resend`: authentication, the
`notification_hub` module, and either `CanSendCallCenterNotifications` or
`CanReadCallCenterParcelStatus` are required. The server additionally checks authenticated
company/destination branch, the current caller assignment, and a matching saved call outcome.
The `/parcels/status` page permission is unchanged; no retry or parcel-update grant is added.

Charge-agent selectors use existing workflow permissions: booking options at
`GET /shipments/bookings/charge-agent-options` require `CanCreateBookingWithParcels`; self-service
options at `GET /self-service/charge-agent-options` require `CanCompleteSelfServiceBookings`.
Both are authenticated and company/source-branch scoped. No user-administration permission or
new page permission is required. See [Parcel Operations](PARCEL_OPERATIONS.md#agent-who-charged-the-parcel).

The matrix is split by domain so each reference remains readable:

Parcel information edits use a dedicated endpoint with authenticated company/destination-branch
scope, extended to the source branch for actors with `CanUpdateParcels`. A receiver correction requires both a supported parcel workflow permission and
`CanUpdateCustomers`; customer management permission alone cannot rewrite a parcel name.
Details-only edits retain the workflow permission without a customer-update grant. See
[Operations endpoint permissions](permissions/ROUTE_PERMISSION_OPERATIONS.md#parcel-information-edits).

- [Operations and people](permissions/ROUTE_PERMISSION_OPERATIONS.md)
- [Platform and finance](permissions/ROUTE_PERMISSION_PLATFORM_FINANCE.md)
- [Supply chain and fleet](permissions/ROUTE_PERMISSION_SUPPLY_FLEET.md)
- [Reports](permissions/ROUTE_PERMISSION_REPORTS.md)

Each listed route is guarded by its exact override permission. Routes without an exact override use the application's shared path-access resolution and server endpoint authorization. Navigation visibility is not authorization: the server must still enforce permission, module, company, branch, and domain-assignment rules.

`/settings/devices` (Device Approvals, under Platform Configuration) requires
`CanApproveRegisteredDevices`; path access also admits `CanUpdateUsers` so the page can apply the
temporary head-office fallback, which the page and API enforce. It does not require the
`device_verification` module, so devices can be approved before verification is enabled. `/users/devices` redirects to `/settings/devices`.
See [Native Device Registration](DEVICE_REGISTRATION.md).

`/settings/whatsapp` (WhatsApp Settings) requires `CanReadCompanyProfile` and the
`whatsapp_messaging` module (route-module mapped, so the sidebar hides it when the module is off).
Saving the provider or templates additionally needs `CanManageNotificationProviders` /
`CanManageNotificationTemplates` (or `CanManageCompanyModules`) on the server.
See [WhatsApp Messaging](WHATSAPP_MESSAGING.md).

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

Self-service **View / Edit** permits inspection with `CanReadSelfServiceBookings`;
`PATCH /self-service/drafts/:id/customers` (legacy contacts-only) and the full web/mobile edit
`PATCH /self-service/drafts/:id` require `CanCompleteSelfServiceBookings`.
Saved matching customer profile changes additionally require `CanUpdateCustomers`.
Edits are company/branch scoped and reject another officer's claim or a stale draft.
No page override changes. Location capability controls retain the existing location
create/update/read permissions. Receiving quota exemptions do not bypass any route guard.

Delivery Cashier's upcoming handovers section uses `CanManageParcelSecondReceiver` for
`PUT/DELETE /shipments/parcels/:id/second-receiver`, scoped to the destination branch. The
editable states now include Address Collected and Dispatched until rider handover. Mobile rider
selection remains under `CanCompleteDoorstepDelivery`, without customer-create/manage rights.
See [Parcel Operations](PARCEL_OPERATIONS.md) for validation and stale-selection behavior.

Source-branch sender reassociation uses `GET /shipments/parcels/:id/sender-candidates` and
`POST /shipments/parcels/:id/correct-sender`, requiring **both** `CanUpdateParcels` and
`CanUpdateCustomers`. Authentication determines company and sending branch. Only an active
existing customer matching the exact telephone can be selected; stale sender IDs and sender
credit history are rejected. The change is audited and does not merge customer profiles or
move payments. See [Parcel Operations](PARCEL_OPERATIONS.md) for the correction workflow.
