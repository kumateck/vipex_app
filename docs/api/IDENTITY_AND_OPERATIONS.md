# API: Identity and Parcel Operations

All paths are relative to `/v1`.

## Identity and Master Data

- `/auth`: login, refresh, logout, invitation setup, forgot/reset password, change password, and current-password verification.
- `/users`: user list/detail/create/update, invitation flows, password-management options, and System Admin password assignment.
- `/rbac`: roles, permissions, and permission assignment.
- `/branches`: branch master data and pickup/receiver OTP controls.
- `/locations`: operational locations.
- `/warehouses`: branch-owned warehouse options and CRUD.
- `/customers`: customer master, CRM, statements, transactions, payments, and credit views.
- `/cards`: card reference and customer-card operations.
- `/uploads`: model-linked upload, list, delete, and object proxy.

Mobile receiving evidence uses `POST /shipments/parcels/discrepancies/:id/evidence`. The endpoint validates incoming-parcel permission and company ownership, then creates a shared upload with model type `parcel-discrepancy-evidence` and the discrepancy ID as `modelId`.

Security-sensitive identity methods include:

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/set-password`
- `POST /auth/change-password`
- `POST /auth/me/verify-password`
- `GET /users/password-management/options`
- `PUT /users/:id/password`

System Admin password assignment revokes the target user's active sessions and writes an audit event.

## Shipments

- `/shipments/bookings`: booking creation and query, including booking-with-parcels operations.
- `/shipments/parcels`: parcel search, detail, lifecycle actions, corrections, and receiver OTP-related operations.
  The optional `cashierCollectionRequired` list filter is mutually exclusive routing support for
  pickup workflows. `true` returns parcels with outstanding principal or storage; `false` returns
  parcels with neither. Storage is computed from the company ageing policy, effective received
  time, non-voided storage payments, and waivers. The response remains paginated after filtering.
- `GET /shipments/parcels/call-center/assigned`: require `CanReadCallCenterParcelStatus` and return
  only Arrived, Customer Contacted, or Returned to Office parcels assigned to the authenticated
  user at their company and destination branch. Callers can provide pagination and search only;
  they cannot broaden identity scope.
- `GET /shipments/parcels/call-center/address-collection`: require `CanMarkDoorstepCalled` and
  return only Home Delivery Requested parcels for the authenticated company and destination branch.
  Missing company or branch identity returns an empty paginated response.
- `GET /shipments/parcels/:id/details`: return parcel relations and storage settlement. Remaining
  principal is based on charge minus non-voided principal payments. For legacy rows with no
  `receivedAt`, the response and storage settlement use the earliest audited arrival transition.
- `POST /shipments/parcels/:id/update-shelf-picker`: persist the selected shelf-picker staff on the
  parcel and, when present, mirror it to the active pickup queue. This endpoint works independently
  of the branch `usePickupQueue` setting and requires `CanUpdateParcelShelfPicker`.
- `POST /shipments/parcels/bulk-mark-received`: atomically mark 1–100 authenticated-branch incoming
  parcels as arrived. The body contains only unique `parcelIds`; company, branch, and receiving user
  are taken from authentication. Any missing, out-of-scope, deleted, already-received, non-transit,
  or concurrently changed parcel rejects the entire batch.
- `/shipments/parcels/sticker-prints`: record a successful sticker print and its copy count.
- `/shipments/consignments`: consignment creation, dispatch, receiving, completeness, and exceptions.
- `GET /shipments/consignments/history`: list saved consignments for an inclusive `dateFrom` and
  `dateTo` (`YYYY-MM-DD`) range. Agency scope is taken from the authenticated branch; head office
  may supply an optional `sourceId` filter.
- `GET /shipments/consignments/:id/print`: return the saved consignment number, destination, and
  active parcel manifest needed for an A4 reprint. Company/source scope and
  `CanReadConsignments` are enforced server-side.
- `/shipments/parcel-internal-transfers`: internal custody create, detail, acknowledge, cancel, and history.
- `/shipments/auto-grouping`: dispatch/consignment grouping assistance.
- `/shipments/parcels/discrepancies`: create, list open, and resolve receiving discrepancies.
- `POST /shipments/parcels/discrepancies/:id/evidence`: upload permission-checked photo evidence for a company-owned discrepancy.

Internal transfers change custody only and do not directly change shipment status.

## Cashier and Payment Operations

- `/cashiers`: cashier assignments, types, and options.
- `/shifts`: cashier-session open, current, summary, close, history, and permitted same-day reopen behavior.
- `/payments`: general collection, sender collection plus processing, receiver collection plus handover/delivery, calculation, and OTP request/verification.
- `/momo`: configured mobile-money transaction operations.

The server owns charge validation, payment component allocation, cashier-session attribution, and atomic parcel/payment transitions.

## Pickup and Delivery

- `/pickup-queues`: queue create, search, boards, and collection operations.
- `/deliveries`: dispatch, rider assignment, current/history, collection, return, completion, and change-request operations.

Mobile call-center and supervisor operations reuse:

- `POST /deliveries/dd/:parcelId/call`
- `POST /deliveries/dd/:parcelId/address-collected`
- `GET /deliveries/dd/change-requests/pending`
- `POST /deliveries/dd/change-requests/:deliveryId/decision`

Pickup or receiver OTP rules are derived from the destination branch controls and enforced by the server.

## Self-Service

Public, branch-bound temporary-session operations:

- `POST /self-service/sessions`
- `GET /self-service/branches/:branchId`
- `GET /self-service/customers/lookup`
- `GET /self-service/destinations/branches`
- `GET /self-service/destinations/locations`
- `POST /self-service/drafts`

Public calls after session creation send `x-self-service-session`. Customer lookup is exact and returns a minimal result.
`POST /self-service/drafts` requires `termsAccepted: true` and the current `termsVersion`. Missing,
false, or outdated consent returns a validation/bad-request response. Successful draft creation
records the accepted version and server acceptance time for audit.

Authenticated agent operations:

- `GET /self-service/drafts`
- `GET /self-service/drafts/:id`
- `POST /self-service/drafts/:id/claim`
- `POST /self-service/drafts/:id/complete`
- `POST /self-service/drafts/:id/cancel`

See [Parcel Operations](../PARCEL_OPERATIONS.md), [Cashier Payments and Shifts](../CASHIER_PAYMENTS_AND_SHIFTS.md), [Self-Service Booking](../SELF_SERVICE_BOOKING.md), and [Mobile Frontline Workflows](../MOBILE_FRONTLINE_WORKFLOWS.md).
