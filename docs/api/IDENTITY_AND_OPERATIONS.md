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

`PATCH /users/:id` accepts partial user updates and requires `CanUpdateUsers`. `{ "status": 0 }` activates a user without changing or validating an omitted cashier type. Changing a user's type to cashier requires a cashier type, either in the request or already stored on the user. Setting a cashier's type to null returns `400`. Switching to a non-cashier type clears cashier type. This contract applies to web, mobile, and desktop callers.

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
- `GET /shipments/parcels`: optional `sentDate=YYYY-MM-DD` filters by the linked consignment's
  creation day (inclusive start, exclusive next day, UTC); optional `consignmentNumber` matches
  its daily serial or full code. Both can be combined with the existing `sourceId`, `destinationId`,
  `status`, and search parameters. Invalid calendar dates return 400. Rows without a consignment
  cannot match either consignment filter. These predicates apply to both result rows and total count.
  The optional `cashierCollectionRequired` list filter is mutually exclusive routing support for
  pickup workflows. `true` returns parcels with outstanding principal or storage; `false` returns
  parcels with neither. Storage is computed from the company ageing policy, effective received
  time, non-voided storage payments, and waivers. The response remains paginated after filtering.
- `GET /shipments/parcels/call-center`: require `CanReadCallCenterAssignment` and return Arrived,
  Customer Contacted, or Returned to Office parcels for the authenticated company and destination
  branch. Results include every payment state and are ordered unassigned first, then assigned, with
  the newest effective received time first inside each group. Pagination and search cannot broaden
  the authenticated company or branch scope.
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
- `GET /shipments/parcels/:id/home-delivery-receipt`: require `CanDispatchForDelivery` and return
  current charge, delivery fee, non-voided paid amounts, balances due, and an unsaved tax breakdown
  calculated from full charge plus delivery fee. The parcel must belong to the authenticated
  company and destination branch, be address-collected, returned to office, dispatched, handed to
  the customer, or delivered at home, and have an active doorstep delivery record. It also returns
  current sender, receiver, destination, and address details for printing. Missing scope,
  ineligible parcels, or missing delivery data return an error without changing data. Used by each
  Home Delivery Dispatch and Rider Assigned Parcels row's A5 print action.
- `POST /customers/resolve-second-receiver`: require `CanCreateCustomers`, accept `fullname` and
  `telephone`, and return `{ id }`. Within the authenticated company, an exact match against an
  active customer's primary or secondary telephone returns that customer's ID; otherwise a new
  customer is created. A concurrent creation is rechecked before returning an error. The endpoint
  does not update an existing customer's name or telephone. Invalid input or missing permission
  rejects the request before any parcel mutation. Used by web second-receiver handovers and call
  outcomes and mobile call outcomes.
- `POST /shipments/parcels/:id/update-shelf-picker`: persist the selected shelf-picker staff on the
  parcel and, when present, mirror it to the active pickup queue. This endpoint works independently
  of the branch `usePickupQueue` setting and requires `CanUpdateParcelShelfPicker`.
- `GET /shipments/parcels/shelf-picker`: require `CanReadShelfPickerUpdate` and list awaiting-pickup
  parcels for the authenticated company and destination branch. Unassigned shelf-picker parcels
  precede assigned parcels before pagination, considering both parcel and legacy pickup-queue
  assignments. Within each group, pickup-queue branches retain queue-number order when no search
  is active; other results use creation order. Results include paid and due amounts so web clients
  can show Paid, To Be Paid, or Partial. Search does not change assignment priority. Request
  failures return the standard API error and do not update assignments. QA: paginate through
  mixed assigned and unassigned parcels, search for both kinds, and verify the payment amounts.
- `POST /shipments/parcels/bulk-mark-received`: atomically mark 1–100 authenticated-branch incoming
  parcels as arrived. The body contains only unique `parcelIds`; company, branch, and receiving user
  are taken from authentication. Any missing, out-of-scope, deleted, already-received, non-transit,
  or concurrently changed parcel rejects the entire batch.
- `GET /shipments/parcels/delivery-reversal-candidates`: list office- and home-delivered parcels
  for the authenticated company and destination branch, with search and pagination. Requires
  `CanReverseParcelDelivery`.
- `POST /shipments/parcels/:id/reverse-delivery`: require `CanReverseParcelDelivery` and a 5–500
  character `reason`. For an undeleted delivered parcel in the authenticated branch, restore
  Awaiting Pickup for office handover (and reopen its latest ended queue ticket), or Rider Given
  Parcel to Customer for home delivery (and restore the delivery record to rider handover).
  Payments remain recorded. Reject missing/out-of-scope, already reversed, or inconsistent
  delivery records. Response contains the parcel ID and restored status. The action is audited.
- `POST /shipments/parcels/bulk-call-outcome`: save one call outcome for 1–100 unique parcels assigned
  to the authenticated call agent in their company and destination branch. The body contains
  `parcelIds` and `outcome` (`follow_up`, `pickup`, or `delivery`). The server validates every parcel,
  then updates them sequentially in one transaction. Missing, deleted, reassigned, out-of-scope,
  ineligible, or concurrently changed parcels reject the batch without partial updates. No SMS or
  email is sent. The response returns `parcelIds`, `updatedCount`, and the resulting `status`.
- `GET /shipments/parcels/call-center/receiver-lookup/:telephone`: exact ten-digit lookup for an
  active customer in the authenticated company, matching either telephone field. Returns ID,
  name, and telephones or `null`. Requires `CanReadCallCenterParcelStatus`.
- `POST /shipments/parcels/:id/call-outcome/change-main-receiver`: require
  `CanReadCallCenterParcelStatus`; body has `telephone`, optional `fullname`, and a single
  `outcome` (`follow_up`, `pickup`, or `delivery`). Recheck company, destination branch, call-agent
  assignment, and eligible parcel status. Reuse an existing exact-phone customer, or require a
  name and create one. Set the new main `receiverId` and outcome status together; clear stale
  second-receiver/card fields. A missing name, same current receiver, invalid phone, stale parcel,
  or out-of-scope request fails. Return parcel ID, receiver ID/name, and status; record an audit
  event. Notifications remain a separate single-outcome request after this save.
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
