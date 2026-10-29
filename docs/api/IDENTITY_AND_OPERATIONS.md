# API: Identity and Parcel Operations

All paths are relative to `/v1`.

## Identity and Master Data

- `/auth`: login, refresh, logout, invitation setup, forgot/reset password, change password, and current-password verification.
- `/auth/devices`: native device registration/status, authenticated access-policy check, and review by `CanApproveRegisteredDevices` holders (head-office `CanUpdateUsers` fallback). Approval enforcement follows the company's `device_verification` module; see [Native Device Registration](../DEVICE_REGISTRATION.md).
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
- `POST /auth/devices/register`
- `GET /auth/devices/status`
- `GET /auth/devices/access`
- `GET /auth/devices/`
- `POST /auth/devices/:id/review`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/set-password`
- `POST /auth/change-password`
- `POST /auth/me/verify-password`
- `GET /users/password-management/options`
- `PUT /users/:id/password`

`POST /auth/refresh` returns a rotated access/refresh token pair and the current user on
success. Expired, revoked, or invalid refresh sessions return 401; a temporarily unavailable
server may return 5xx. Web and desktop clients preserve their saved login after a network/5xx
failure, but clear it after a confirmed invalid session. Desktop policy checks retry their first
401 once after this refresh, and never display protected content while the check is unavailable.

System Admin password assignment revokes the target user's active sessions and writes an audit event.

## Shipments

`GET /shipments/bookings/charge-agent-options` requires `CanCreateBookingWithParcels`.
`GET /self-service/charge-agent-options` requires `CanCompleteSelfServiceBookings`. Both require
staff authentication and return an array of `{ id, fullname }` for active users in the caller's
company and source branch. Client-supplied company/branch values cannot widen the scope. A missing
company/branch or head-office context returns 403; `CanReadUsers` is not required.

Each parcel in `POST /shipments/bookings/create-with-parcels` may include optional nullable
`chargeAgentUserId`; `POST /self-service/drafts/:id/complete` accepts the same field for its parcel.
The quoted-charge agent may differ from the creator and payment cashier. Supplied IDs are checked
inside the booking transaction against active company/source-branch users and saved in
`parcels.charge_agent_user_id`. Empty-string IDs fail identifier validation; unknown, inactive,
wrong-company, or wrong-branch IDs return 400 and create no partial booking/parcel/payment records.
Omitted/null IDs store NULL for older-client compatibility. Current web/desktop/mobile staff forms
require an explicit agent selection; the public draft form does not expose it. Existing responses
and financial calculations remain unchanged. Deploy migration `0080` before the updated backend.

`POST /shipments/bookings/create-with-parcels` accepts `completeToBePaid: true` only for fully
receiver-paid parcels with no sender payment. It requires `CanCreateBookingWithParcels` and an
active sender/full cashier session owned by the caller or delegated to the caller. The server
derives the owning cashier and session, marks the parcel processed, and attributes the parcel to
that session. The parcel's `processedBy` is the cashier user ID; `createdBy` and the audit record
identify the staff member who submitted the booking. `deferSenderCashierCompletion` and
`completeToBePaid` cannot both be true. Missing
authorization returns `403`; an invalid payment mix returns `400`.

Cashier session delegates: `GET /cashiers/sessions/:id/delegates` lists eligible and assigned staff;
`POST` to that path with `{ "userId": "..." }` assigns one; `DELETE
/cashiers/sessions/:id/delegates/:userId` removes one. Only the active session's sender/full
cashier owner may manage them, with read/open/close session permissions respectively. Delegates
must be active in the same company and branch, match the cashier's location when one is assigned,
and hold `CanCreateBookingWithParcels`. The location rule applies to the list, assignment, and
completion request; a cashier without a location can select any eligible staff in their branch.
Out-of-scope assignment and completion return `403`. Revocation or session closure ends
authorization. Web and mobile use the same endpoints.

- `GET /customers/lookup/booking-by-telephone/:telephone`: ten-digit exact lookup across active
  primary and secondary telephone fields, scoped to the authenticated company and guarded by
  `CanCreateBookingWithParcels`. Returns only customer ID, full name, and two telephone fields;
  multiple matches require an explicit choice on mobile. Invalid numbers return 400. General
  `/customers/lookup/by-telephone` remains protected by `CanReadCustomers`.

- `/shipments/bookings`: booking creation and query, including booking-with-parcels operations.
- `/shipments/parcels`: parcel search, detail, lifecycle actions, corrections, and receiver OTP-related operations.

### Sticker payment verification

`GET /v1/shipments/parcels/sticker-payment?bookingCode=...&trackingCode=...` returns
`{ bookingCode, trackingCode, status, amountCedis }` with `Cache-Control: no-store`.
Both identifiers are required (1–255 characters). `status` is only `PAID`, `TO BE PAID`, or `CREDIT`;
`amountCedis` is positive only for `TO BE PAID`, otherwise zero. This endpoint is read-only.

Authentication and any of `CanCreateBookingWithParcels`, `CanCompleteSelfServiceBookings`,
`CanCreateSenderPayments`, `CanCreateReceiverPayments`, `CanReadConsignments`,
`CanReadParcelOutgoing`, or `CanReadParcels` are required. Scope is the authenticated company and
source/destination branch, or company-wide parcel-read/head-office access. The `sticker_print`
module must be enabled. Missing/inaccessible/deleted/cancelled parcels return 404, missing
permission or disabled module returns 403, and an unconfirmed/inconsistent payment state returns 409. Verification failure blocks stickers requiring this lookup without a cached fallback. The first
web/desktop print immediately after successful cashier sender collection/confirmation uses that
completed transaction instead of repeating this GET. Receipt-only jobs do not call this endpoint;
a failed sticker lookup does not cancel an otherwise valid receipt in a combined job.

PAID requires recorded non-void principal payments to equal the charge. TO BE PAID requires a
positive saved receiver allocation covering the remaining principal. The saved allocation may
already be reduced by sender/receiver payments; do not derive a new sender shortfall from it.
The returned amount is charge minus recorded sender and receiver principal, so partial receiver
settlement remains TO BE PAID and full settlement becomes PAID.
CREDIT requires a matching posted sender/parcel credit ledger entry and saved credit method.
Existing payments and credit entries count for historical confirmations as well; no new
confirmation or non-null `processedBy` is required. Aggregate subqueries retain explicit outer
parcel/company/sender references so valid saved payments are not incorrectly returned as zero.
Unknown/missing/zero charges, unpaid sender shares, overpayment and credit without ledger approval
are rejected. Verification excludes delivery/storage fees, creates no financial record or print log,
and does not authorize handover. See [Parcel Printing](../PARCEL_PRINTING.md#verified-sticker-payment-status)
for client deployment order and QA scenarios.

- `POST /deliveries/dd/:parcelId/rider-given`: requires `CanCompleteDoorstepDelivery` and an
  assigned, Dispatched parcel with no pending delivery change/reconciliation block. Mobile sends
  `handoverTarget: "main" | "second"`; second requires the currently linked `secondReceiverId`.
  A missing/replaced/removed second choice returns 409 and instructs refresh. Main plus an explicit
  second ID returns 400; inactive/foreign-company or main-customer second IDs return 400. Signature
  and existing collection checks remain required. Selection does not create a customer or change
  the cashier-authorized contact. `RIDER_HANDOVER_RECEIVER_SELECTED` audit records target and ID
  atomically with handover. The optional field preserves existing web/desktop requests; legacy
  explicit receiver changes are validated and audited. Rider list responses add
  `secondReceiverName` (parcel snapshot, customer fallback) and `secondReceiverPhone`.
- `POST /deliveries/dd/:parcelId/returned`: the assigned rider returns a dispatched parcel;
  parcel status becomes `RETURNED_TO_OFFICE` (displayed as **Returned by Rider**), with a
  recorded delivery return time. It preserves `deliveries.chargePsw` and the dropoff address.
  Single/bulk redispatch and dispatch reassignment retain that fee. Rider list responses expose
  it as `deliveryFeePsw`; parcel details expose `delivery.chargePsw` for cashier completion.
  Outstanding fee calculations subtract non-voided delivery fee payments, never the parcel's
  principal charge. Existing fees erased by the previous return implementation are not backfilled.
  A wrong rider or non-dispatched parcel returns 409; a missing
  parcel/delivery returns 404. Requires `CanCompleteDoorstepDelivery`.
- `GET/PATCH /deliveries/dd/:parcelId/fee`: active non-rider staff with any of
  `CanDispatchForDelivery`, `CanMarkDoorstepCalled`, or `CanCompleteDoorstepDelivery` read/edit
  a configured doorstep fee at their own company and destination branch. GET returns
  `{ parcelId, bookingCode, chargePsw, paidFeePsw, riderCollectedFeePsw, updatedAt }`; monetary
  values are pesewas. PATCH accepts `{ deliveryFeeCedis, expectedChargePsw, expectedUpdatedAt,
reason }` and returns `{ id, chargePsw, changed }`. The reason must be 3–500 trimmed characters;
  the GHS fee must be non-negative, at most GHS 100,000, with at most two decimal places and
  cannot be less than non-voided fee payments or the rider's recorded collection. Only home
  requested/address-collected/dispatched/returned/rider-handover states with one active
  doorstep record are editable. Out-of-scope/deleted parcels return 404; invalid input returns
  400; inactive/rider accounts return 403; stale values, pending requests, completed/office or
  other invalid state, ambiguous delivery records and reconciliation holds return 409.
  Authentication/permission failures return 401/403. Fee and audit update atomically. This
  powers the shared web/desktop dialog on Rider Returns and Delivery Cashier, including the
  cashier finalization dialog. Mobile riders see the new fee when refreshed. It does not
  create payments, change address/status/assignment, or reopen completed deliveries.
- `GET /deliveries/dd/returned?page=&pageSize=&search=`: paginated, searchable rider returns
  at the authenticated company's destination branch. Requires `CanDispatchForDelivery`; callers
  cannot choose another company, branch, or status. Only parcels with a completed delivery
  return appear; manually marked or incomplete records are excluded. The parcel row includes
  `riderReturnedAt`.
- `GET /deliveries/dd/returned/riders`: active riders at the authenticated company and branch;
  returns only ID and name for the redispatch picker. Requires `CanDispatchForDelivery`, not
  directory administration permission.
- `POST /deliveries/dd/:parcelId/returned-to-pickup`: moves a returned parcel to Awaiting Pickup
  after checking company, destination branch, status, and completed delivery return. Out-of-scope
  parcels return 404; stale or invalid return state returns 409. Requires `CanDispatchForDelivery`.
  `POST /deliveries/dd/:parcelId/redispatch-return` requires an active rider in the same company
  and branch, a completed return, and no open reconciliation hold. It atomically redispatches
  the parcel and delivery and notifies the rider. Missing or out-of-scope parcels return 404;
  stale return state or invalid rider selection returns 409. Both actions use the same permission.
- `POST /deliveries/dd/returned/redispatch-bulk` accepts `{ parcelIds: string[], riderUserId }`
  with 1-100 unique parcel IDs and requires `CanDispatchForDelivery`. The active-branch-rider
  check runs once up front and returns 409 before anything changes if the rider is missing,
  inactive, or in another company or branch. Each parcel is then redispatched through the same
  rules as `POST /deliveries/dd/:parcelId/redispatch-return`, and the 200 response reports
  partial success: `succeeded: string[]` holds the redispatched parcel IDs and
  `failed: { parcelId, message }[]` explains parcels that were stale, out of scope, missing a
  completed return, or held by an open reconciliation case. Every successful parcel gets its own
  audit entry and rider assignment notification.
- `POST /payments/collect-receiver-and-deliver`: returns separate principal `payment` and ageing
  `storagePayment` records when collected. When storage is collected, `receiptTaxBreakdown` is
  calculated from the sum of both collected amounts using the company tax profile or default
  Ghana rules. It is for the A5 receiver receipt only and is not persisted as payment tax. With
  no storage payment, the receiver receipt continues to use the principal payment's saved tax
  breakdown. Storage-only collection returns a receipt breakdown even when `payment` is null.
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
  Customer Contacted, Returned to Office, Awaiting Pickup, Home Delivery Requested, Address
  Collected, Dispatched, or Rider Given Parcel to Customer parcels that have not been called,
  for the authenticated company and destination branch, narrowed to the user's location when
  assigned. A branch-only user can see all locations in that branch. Results include every
  payment state and are ordered unassigned first, then assigned, with
  the newest effective received time first inside each group. Pagination and search cannot broaden
  the authenticated scope. Missing company/branch context returns 403.
- `GET /shipments/parcels/call-center/assigned`: require `CanReadCallCenterParcelStatus` and return
  uncalled parcels in the same statuses as `/call-center`, assigned to the authenticated user
  at their company, destination branch, and assigned location (or all branch locations when
  the user has no location). Callers can provide pagination and search only; they cannot broaden
  identity scope. Missing company/branch context returns 403. The general parcel search with
  `assignedToCurrentUser=true` enforces the same identity/location hierarchy, including when
  listing saved outcomes, and overrides supplied company/destination/location filters.
- `GET /shipments/parcels/assignment-staff`: active officers at the authenticated company and
  branch; restrict to the user's location when assigned, otherwise include every branch location
  and officers without a location. Missing company/branch returns `[]`.
- `POST /shipments/parcels/:id/assign-call-center` and `/bulk-assign-call-center`: require
  `CanAssignCallCenterParcels`. The single body contains `userId`; bulk also requires 1–200 unique
  `parcelIds`. Validate parcel company/destination/pickup location and active officer
  company/branch/location from authentication. Missing/deleted/out-of-scope parcels return 404,
  invalid officers 400, missing context 403, and invalid bodies 422. Bulk changes are atomic.
  Successful assignment retains existing status mapping and clears the call timestamp.
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
- `PUT /shipments/parcels/:id/second-receiver`: require `CanManageParcelSecondReceiver`; body has
  `fullname` (1-255 characters) and `telephone` (normalized to exactly ten digits). The parcel must
  belong to the caller's company and destination branch, not be deleted, and be Arrived at
  Destination, Customer Contacted, Returned to Office, Awaiting Pickup, Home Delivery Requested,
  Address Collected, or Dispatched. A completed rider handover is not editable.
  Resolves the telephone like `resolve-second-receiver`, then sets `secondReceiverId`, clears
  `secondCardId`/`secondCardNumber`, and expires active or verified-but-unused `second` receiver
  OTPs. Returns `{ id, secondReceiverId, changed }`; `changed` is false and nothing is written when
  the customer is already the second receiver. Missing or out-of-scope parcels return 404;
  ineligible status, the main receiver as second receiver, or a concurrent change return 409;
  invalid name or telephone return 400; a missing permission returns 403. Sends no SMS or email.
  Records audit event `PARCEL_SECOND_RECEIVER_SET`. Used by Shelf Picker Update and Parcel
  Assignment and Delivery Cashier's upcoming handovers section. No separate customer-create
  permission is needed on this endpoint.
- `DELETE /shipments/parcels/:id/second-receiver`: same permission, scope, and status rules as the
  `PUT`. Clears `secondReceiverId` and the second ID card fields and expires `second` receiver
  OTPs. Returns `{ id, secondReceiverId: null, changed }`; `changed` is false when the parcel had
  no second receiver. Sends no SMS or email. Records audit event `PARCEL_SECOND_RECEIVER_REMOVED`.
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
  to the authenticated call agent in their company and destination branch, restricted to their
  assigned pickup location when present. Single contact saves, legacy call-outcome PATCH requests,
  and main-receiver changes apply the same location check. The body contains
  `parcelIds` and `outcome` (`follow_up`, `pickup`, or `delivery`). The server validates every parcel,
  then updates them together in one transaction. Missing, deleted, reassigned, out-of-scope,
  ineligible, or concurrently changed parcels reject the batch without partial updates. This endpoint
  itself sends no SMS or email. When **Send SMS** is checked in the web bulk form, the client follows
  a successful batch with `POST /notification-hub/events/parcel-status-call` per returned parcel ID,
  using the saved `outcome`, `sendSms: true`, `sendEmail: false`, and `includeSecondReceiver: false`.
  Notification requests run with a maximum concurrency of four, retain the existing module and
  permission gates, and return individual sent/failed counts. A notification failure leaves the
  saved outcomes intact and is not retried automatically. Each parcel is marked called, so it
  leaves the assigned call queue. The response
  returns `parcelIds`, `updatedCount`, and the resulting `status`. Both `follow_up` and
  `pickup` result in Awaiting Pickup; `delivery` results in Home Delivery Requested.
- `POST /shipments/parcels/:id/call-center/contact`: requires `CanReadCallCenterParcelStatus` and
  the assigned caller in the destination branch. Empty body marks a parcel called without changing
  status. Optional `outcome` (`follow_up`, `pickup`, `delivery`) changes an eligible outcome and
  records the call; optional `secondReceiverId` updates the second receiver with that outcome.
  The `follow_up` outcome retains Awaiting Pickup and sets `callCenterCalledAt`; it does not
  persist Customer Contacted as the parcel status.
  Reject called, delivered, deleted, reassigned, or out-of-branch parcels. Outcome changes are
  rejected after address collection or dispatch, though a call can still be recorded.
- `POST /shipments/parcels/:id/shelf-picker/request-delivery`: requires
  `CanUpdateParcelShelfPicker` and an Awaiting Pickup parcel in the caller's company and
  destination branch. Atomically sets Home Delivery Requested and ends an active pickup queue
  ticket. Returns the parcel ID and status. Missing or out-of-scope parcels return 404; stale
  statuses or concurrent changes return 409.
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
Sessions are persisted in PostgreSQL after migration `0087`, shared across backend instances,
expire after 15 server minutes and are consumed once by an atomic delete. Public session failures
return 410 / `SELF_SERVICE_SESSION_EXPIRED`; a customer can start a new session from the same
branch page. Browser clock skew does not determine expiry. The session-start IP quota remains
30 starts per 15 minutes using Redis when configured, or process-local counters otherwise.
See [Session lifetime and recovery](../SELF_SERVICE_BOOKING.md#session-lifetime-and-recovery)
for deploy order, old-token behavior and the recovery QA scenarios.
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

Self-service draft continuation: `POST /self-service/drafts` returns
`{ draftId, expiresAt, bookingsCompleted, nextSession }`. `nextSession` is null after booking 10
or when the original scan deadline has elapsed; otherwise it contains a fresh single-use token,
branch identity, original `issuedAt`/`expiresAt`, and the next `bookingNumber`. The server derives
that number from the consumed stored token, never from request body input. The consumed token,
draft insert, next token insert and submission receipt are one transaction. Identical concurrent
or retried submissions return the same successful response without another insert or counter
increment. Different details under a consumed token return 409; unknown/expired tokens return 410. Receipt expiry matches the draft deadline; failed persistence rolls back consumption. Daily submission quotas are 50 attempts per sender phone and
200 per forwarded IP; QR issuance remains 30 per IP per 15 minutes. See
[Self-service booking](../SELF_SERVICE_BOOKING.md).

Parcel sender correction (web/desktop source branch):

- `GET /shipments/parcels/:id/sender-candidates?telephone=<10 digits>` requires both
  `CanUpdateParcels` and `CanUpdateCustomers`, plus company/source-branch scope on the parcel.
  Returns exact active primary/secondary phone matches as `{ id, fullname, telephone, telephone2 }[]`.
- `POST /shipments/parcels/:id/correct-sender` uses the same guards and accepts
  `{ expectedSenderId, customerId, telephone, reason }`. Reason trims to 5–1000 characters.
  Reuses an existing matching customer and returns `{ id, changed }`, without modifying profiles,
  amounts, status or payment rows. A missing/deleted/out-of-scope parcel returns 404; invalid
  number/reason or inactive/nonmatching customer returns 400/422; stale sender, sender credit
  history, or failed snapshot persistence returns 409. Sender ID/name update and
  `PARCEL_SENDER_CHANGED` audit are one transaction. Same sender is a no-op. Credit ledger
  history is not transferred by this endpoint.

Parcel-creation customer pencil actions use the existing
`GET /customers/lookup/booking-by-telephone/:telephone` and `PATCH /customers/:id`. Lookup needs
`CanCreateBookingWithParcels` and returns minimal company-scoped identity; profile changes need
`CanUpdateCustomers`. No `CanReadCustomers` grant is required for this booking lookup. Web can
edit name and optional secondary number; mobile edits name only. The primary lookup number and
selected customer ID remain unchanged, and existing parcel snapshots are preserved.
