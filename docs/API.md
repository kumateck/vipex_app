# API Documentation Index

Base URL: `/v1`

`POST /self-service/sessions` issues a branch-bound, single-use 15-minute token persisted in
PostgreSQL (migration `0087`). All subsequent public self-service calls require
`x-self-service-session`; the server remains the expiry authority. Missing, expired, used, or
wrong-branch tokens return 410 with `SELF_SERVICE_SESSION_EXPIRED` (draft POST retries with a
saved matching receipt return the original success). The web client offers
**Start new booking** for expired sessions. Successful bookings offer **New booking** up to 10
total per QR scan, then require the QR entry again. It does not expire tokens
using the customer's device clock. See [Session lifetime and recovery](SELF_SERVICE_BOOKING.md#session-lifetime-and-recovery)
for deployment order, rate limits, storage failures, and older-client behavior.

Parcel creation and self-service completion accept optional nullable `chargeAgentUserId`.
Current staff clients require the selection next to the parcel charge; older clients may omit it.
`GET /v1/shipments/bookings/charge-agent-options` and
`GET /v1/self-service/charge-agent-options` list active source-branch agents under their respective
booking-create and self-service-complete permissions. See
[Identity and parcel operations](api/IDENTITY_AND_OPERATIONS.md) and
[Parcel Operations](PARCEL_OPERATIONS.md#agent-who-charged-the-parcel) for scope, rejection rules,
and production rollout of migration `0080`.

Last audited at the mounted route-group level: 2026-10-08.

Sticker printing now verifies saved payment state through
`GET /v1/shipments/parcels/sticker-payment`. Only verified PAID, TO BE PAID with a receiver balance,
or ledger-approved CREDIT can print. Initial bookings and reprints use this endpoint; the first
web/desktop print after successful cashier collection/confirmation uses that completed transaction
without a second GET. Unknown/unpaid states and verification outages block stickers requiring
the lookup, while an otherwise valid receipt can still print.
See [Identity and parcel operations](api/IDENTITY_AND_OPERATIONS.md#sticker-payment-verification)
and [Parcel Printing](PARCEL_PRINTING.md#verified-sticker-payment-status) for access, failure behavior,
web/desktop/mobile coverage and rollout order.

The API reference is split by domain:

- [Identity and parcel operations](api/IDENTITY_AND_OPERATIONS.md)
- [Enterprise modules](api/ENTERPRISE_MODULES.md)
- [Platform, communication, and intelligence](api/PLATFORM_AND_INTELLIGENCE.md)
- [Reporting](api/REPORTING.md)

Public parcel tracking is documented in [Public parcel tracking API](PUBLIC_PARCEL_TRACKING_API.md).

Rider returns use `POST /v1/deliveries/dd/:parcelId/returned`; dispatch staff list and
reprocess them through `GET /v1/deliveries/dd/returned` and
`POST /v1/deliveries/dd/:parcelId/returned-to-pickup` and
`POST /v1/deliveries/dd/:parcelId/redispatch-return`, or assign several at once through
`POST /v1/deliveries/dd/returned/redispatch-bulk`.
`POST /v1/deliveries/dd/:parcelId/return-to-pickup` is the shared staff action for Address
Collection, Home Delivery Dispatch, Delivery Cashier and Rider Returns. It takes no body and
returns `{ id }`. Scope comes from the authenticated company/destination branch; only active
non-rider branch staff can execute it. The current parcel stage requires
`CanMarkDoorstepCalled` (Home Delivery Requested), `CanDispatchForDelivery` (Address Collected
or completed rider return), or `CanCompleteDoorstepDelivery` (Rider Given Parcel to Customer).
Success atomically sets Awaiting Pickup, nullifies the configured delivery fee, clears the
active handover/declared collection fields and records their previous values in audit history.
Principal, to-be-paid amount and recorded payments are unchanged; Receiver Cashier collects
outstanding principal at office pickup. No payment is created, voided or refunded. Missing,
deleted or foreign parcels return 404; missing authentication/permission or rider/inactive
actors return 401/403. Invalid or finalized states and incomplete rider returns return 409;
repeated calls after success return 409. The existing `returned-to-pickup` endpoint delegates
to the same implementation but only accepts completed rider returns. Web/desktop provide
this action; mobile rider returns retain their existing flow.

Returning **by the rider** and redispatching preserve the configured delivery fee.
Staff moving a parcel to office pickup nullify that fee, retaining its old value in audit history. Rider responses expose
`deliveryFeePsw`, and parcel details expose `delivery.chargePsw` for delivery cashier completion;
existing non-voided delivery fee payments reduce the outstanding balance. Historically erased
fees are manually restored through the shared Edit Delivery Fee dialog and are not automatically
backfilled. `GET/PATCH /v1/deliveries/dd/:parcelId/fee` reads/updates the configured fee using
authenticated branch scope, optimistic concurrency and a required reason; it does not collect
payment or change parcel status.
See [Identity and parcel operations](api/IDENTITY_AND_OPERATIONS.md) for scope and failure rules.

Native device registration is documented in [Native device registration](DEVICE_REGISTRATION.md).
`POST /v1/auth/devices/register` verifies staff credentials and returns a pending device ID and
one-time secret. `GET /v1/auth/devices/status` accepts device credential headers.
`GET /v1/auth/devices/access` requires a bearer token and returns whether the company's
`device_verification` module is enabled after checking native access. Users with
`CanApproveRegisteredDevices` (or, as a temporary fallback, head-office users with
`CanUpdateUsers`) use `GET /v1/auth/devices/` and `POST /v1/auth/devices/:id/review` to approve,
revoke, block, unblock, or permanently deny; others receive 403.
Native login/refresh and bound authenticated requests require the matching approved credential
only while that company module is enabled; otherwise native sign-in proceeds without registration.
Desktop clients retry `GET /v1/auth/devices/access` after refreshing an expired access token.
They block protected content, but keep the saved session for Retry, when this check or its refresh
request is temporarily unavailable. A confirmed invalid refresh session or denied device clears
the local login. The same refresh operation is shared with ordinary web/desktop API requests.

`GET /v1/reports/daily-parcel-audit?date=YYYY-MM-DD` provides the current payment and delivery
state for parcels created on that Ghana calendar date. Head office may add `branchId`; other users
are scoped to their own branch. It requires `CanViewReportParcelsDailyAudit`. See
[Reporting](api/REPORTING.md) for response and failure behavior.

`POST /v1/self-service/drafts/:id/complete` accepts optional boolean `callSender`. The completed
parcel uses that explicit officer choice; if omitted, it keeps the stored draft value. The
existing completion permission, branch ownership, state, and charge validation still apply. Web
and mobile officer clients expose this checkbox. The public `POST /v1/self-service/drafts` endpoint
no longer sets CS: an optional `callSender` field is still accepted for stale clients but ignored,
and the draft is stored with `callSender = false`. See
[Self-Service Booking](SELF_SERVICE_BOOKING.md).

Parcel list/search responses include `senderPaidPrincipalPsw` and `receiverPaidPrincipalPsw`,
non-voided principal totals by payer in pesewas. Both are zero when that payer has no principal
payment. Super Search uses these fields only for delivered-parcel payer badges; see
[Parcel operations](PARCEL_OPERATIONS.md). Delivery fees, storage, and voided payments are excluded.

`GET /v1/shipments/parcels` retains its case-insensitive search, company/branch filters and
pagination response. To prevent PostgreSQL parallel-query shared-memory failures from producing
500 responses, app connections send `max_parallel_workers_per_gather: '0'` as a **string**;
the driver silently omits numeric `0`. Deploy/restart the backend to replace existing connections.
No migration, permission change or parcel repair is required. The read-only booking-search
diagnostic reports and verifies the effective session settings; see
[Parcel search performance](PARCEL_OPERATIONS.md#parcel-search-performance) for failure cases and QA.

Parcel list/search responses include `riderUserId` and `riderName` from the parcel's delivery
record (both `null` when there is none or no rider is assigned). `GET
/v1/shipments/parcels/:id/details` includes `delivery.riderName` alongside `delivery.riderUserId`.
Super Search uses these for its home-delivery rider line; see [Parcel operations](PARCEL_OPERATIONS.md).

`GET /v1/shipments/parcels/:id/details` also returns `summary` (the parcel as list/search rows show
it, or `null`), `userNames` (user ID to full name for every person referenced), and the delivery's
`riderAssignedAt`, `riderCompletedAt` and `returnedAt`. `GET /v1/shipments/parcels/:id/history`
returns `{ events }`, oldest first, each `{ id, occurredAt, category, title, description,
actorName, branchName }`. Both require `CanReadParcels` and return 404 for a parcel outside the
caller's company. Details were not company-checked before October 2026. See
[Parcel details and history](PARCEL_DETAILS.md).

`GET /v1/shipments/parcels/:id/receipt-reprint-tax` returns the summed, non-voided sender
principal payment and recorded tax amounts for a receipt reprint, or `null` when no such payment
exists. It requires authentication plus one of `CanReadConsignments`, `CanReadParcelOutgoing`, or
`CanReadParcels`. The parcel must belong to the user's company; users without broad parcel read
permission must be at head office or the parcel's source branch. Missing or out-of-scope
parcels return 404. The endpoint is read-only and is used by web and desktop reprint actions, not
by mobile or the original payment print flow. See [Parcel printing](PARCEL_PRINTING.md) for the
failure and QA behavior.

`GET /v1/shipments/parcels/:id/receiver-receipt-reprint` requires authentication and
`CanCreateReceiverPayments`. It is restricted to non-deleted parcels in the authenticated company
and destination branch, with status `DELIVERED_BY_OFFICE` and a saved confirmation timestamp.
It returns non-voided receiver principal and storage gross totals (`receiverPrincipalPsw`,
`storageChargePsw`, `grossAmountPsw`), sender principal paid (`senderPaidPsw`), recorded
`vatPsw`/`getfundPsw`/`nhilPsw`/`covidPsw`/`taxTotalPsw`, `taxComponentKeys`, `issuedAt`, and
`receivedByName`. Monetary values are pesewas. Storage is recognized by the `OTHER` component
and `STORAGE_CHARGE` note prefix. Delivery fees and unrelated charges are excluded. Missing,
deleted, or out-of-scope parcels return 404; ineligible state/date or unavailable receiver payment
returns 400. Unauthenticated/unauthorized callers receive 401/403. This read-only endpoint serves
web and desktop receipt duplicates, with no mobile UI. See [Parcel printing](PARCEL_PRINTING.md)
for the existing original-storage-tax mismatch and QA scenarios.

Parcel list/search responses include the ageing snapshot fields `storageChargePsw`,
`storageChargeDays`, `storageChargeStartAt`, `isParcelAgeingEligible`, and `isParcelAged` when
the row is eligible for storage accrual, including aged-warehouse parcels. `storageChargePsw` is the currently accrued storage fee
in pesewas and is used by web and mobile search results to show the storage-fee indicator. It is
informational; outstanding collection continues to use the server-side cashier eligibility and
settlement rules, including recorded storage payments and waivers.

Storage fee clearance reconciliation uses the parcel prefix `/v1/shipments/parcels`:

| Method and suffix                                | Behavior / permission                                                                                                                                   |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /storage-clearances`                        | Paginated requests, search and status filters; accepts read, request, approve, or execute clearance permission.                                         |
| `GET /storage-clearances/:id`                    | Current unpaid/total accrued days, rate, outstanding/paid/waived amount, remaining days, request and audit history; same read permissions.              |
| `GET /storage-clearances/parcel-search`          | Scoped parcel search with `search` (2–255 characters), `page`, `pageSize` (1–100); requires request permission.                                         |
| `GET /storage-clearances/parcels/:id`            | Current unpaid accrual for creating a request; requires request permission.                                                                             |
| `POST /storage-clearances`                       | Creates Pending Approval with `parcelId`, `requestedDays` or `clearAll`, `reason`, optional `evidenceUrl`; requires `CanRequestParcelStorageClearance`. |
| `POST /storage-clearances/:id/resubmit`          | Original requester revises a returned request; refreshes snapshot, clears approval, returns to Pending Approval; requires request permission.           |
| `POST /storage-clearances/:id/approve`           | Pending → Approved for Finance; optional `note`; requires `CanApproveParcelStorageClearance`.                                                           |
| `POST /storage-clearances/:id/reject`            | Required `note`; pending stage requires approve permission, approved stage requires execute permission. Closes request; restart requires a new request. |
| `POST /storage-clearances/:id/return-for-review` | Approved → Returned for Review, required `note`; requires execute permission.                                                                           |
| `POST /storage-clearances/:id/execute`           | Finance final step, optional `note`; requires `CanExecuteParcelStorageClearance`. Returns `id`, `executedDays`, `executedAmountPsw`.                    |

The authenticated company and branch determine scope; supplied list company/branch IDs cannot
widen access. Agency scope includes source or destination parcels; head office is company-wide.
Wrong company/branch, deleted parcels or unknown records return 404; missing authentication or
permissions returns 401/403. The requester cannot approve or execute their own request (409).
Creation/resubmission needs unpaid accrual and a positive whole day count (1–2147483647),
reason (3–1000 characters), and optional evidence reference (up to 2000 characters). Invalid
input returns 400/422; absent accrual, an existing open request or an invalid transition returns 409. Days above current unpaid accrual are accepted for review. Clear All snapshots exact unpaid
balance after existing payments/clearances; its days are outstanding / rate, rounded up.

Approval checks for remaining accrual. Execution checks current unpaid balance/rate: no accrual,
changed Clear All days or amount, changed rate, or requested amount above balance returns 409
with no financial changes. Finance can return it for review; resubmission requires approval again.
Execution commits waiver, accounting posting (when enabled), status and audit atomically under
row locks; repeats/concurrent calls create one waiver. Missing active accounting accounts or
posting/audit errors roll back the transaction. No clearance action collects a payment or changes
parcel delivery status. The former `POST /:id/storage-waivers` route is no longer mounted (404).
See [Parcel operations](PARCEL_OPERATIONS.md#storage-fee-clearance-reconciliation) for migration,
client differences and QA scenarios.

Shelf pickup reassignment is available under `/v1/shipments/parcels`:

- `GET /shelf-picker-reassignments` requires `CanUpdateParcelShelfPicker`; accepts `search`,
  `page`, and `pageSize` (1–100). Returns the standard paginated parcel response, limited to
  assigned, undeleted Awaiting Pickup parcels at the actor's company and destination branch.
  `pickerStaffId`/`pickerStaffName` resolve the parcel's picker or latest active ticket picker.
  Historical tickets do not duplicate rows or supply an assignment by themselves.
- `GET /shelf-picker-staff` accepts `CanReadShelfPickerUpdate` or `CanUpdateParcelShelfPicker`.
  Returns active staff at the authenticated company/branch, limited to the actor's location
  when present. Without a location it returns active branch staff, rather than an empty list.
- `POST /:id/update-shelf-picker` requires `CanUpdateParcelShelfPicker`. Body: `userId`
  (replacement staff ID), optional `expectedPickerStaffId` (current picker ID or null).
  Returns `{ success: true, parcelId, pickerStaffId, changed }`. Both initial assignment and
  reassignment use this endpoint. Supplied company/branch IDs cannot widen scope.

Missing authentication/permission returns 401/403. Wrong company/branch, unknown or deleted
parcels return 404; inactive, foreign-branch or wrong-location staff returns 400. A parcel that
is no longer awaiting pickup or is already confirmed, an inconsistent ticket scope, or a changed
expected picker returns 409 with no changes. Parcel, active tickets and audit are committed
atomically under locks; an audit/database failure rolls back all changes. Ended tickets, queue
codes/numbers, payments and delivery status are unchanged. Repeating the current assignment
returns `changed: false` without another audit event. Optional expected picker preserves existing
client compatibility; the dedicated web/desktop page always sends it. Mobile has no reassignment
page. See [Shelf pickup reassignment](PARCEL_OPERATIONS.md#shelf-pickup-reassignment) for QA.

## Current Mounted Roots

`auth`, `users`, `branches`, `locations`, `warehouses`, `customers`, `cards`, `uploads`, `cashiers`, `shipments`, `payments`, `deliveries`, `pickup-queues`, `accounting`, `inventory`, `shifts`, `company-modules`, `module-workspace`, `procurement`, `fleet-transport`, `customer-wallet-credit`, `reconciliation`, `notification-hub`, `whatsapp`, `digital-receipts`, `momo`, `self-service`, `desktop-updates`, `mobile-updates`, `communication`, `customer-service`, `help-assistant`, `executive-insights`, `fleet-anomaly-brief`, `operations-exceptions-brief`, `management-daily-brief`, `ai-chat`, `it-support`, `reports`, `audit`, `hr`, `payroll`, `rbac`, and `geolocation`.

Parcel delivery, pickup, rider handover, and home-delivery dispatch endpoints return HTTP 409
when the parcel (or the linked parcel in a duplicate-entry case) has a requested or approved
parcel reconciliation case. The response message is “Parcel has an open reconciliation case;
resolve it before delivery”. Combined payment and handover endpoints reject before recording
payment. Executed and rejected cases do not block delivery.

`POST /v1/shipments/parcels/:id/return-to-source` requires `CanUpdateParcels` and a
`reason` of 5–500 characters. It uses the authenticated user's company and destination
branch. Success returns the parcel ID and `RETURN_TO_SOURCE` status. It returns 404
when the parcel is outside that branch, 409 when the parcel is not eligible or has an
open reconciliation case, and 400 for an invalid reason. Delivery attempts after return
receive HTTP 409. Web and desktop expose the action in All Parcels Super Search;
mobile does not expose it.

`GET /v1/shipments/parcels/return-to-source` requires `CanReadParcels` and returns a
paginated, searchable list of parcels in `RETURN_TO_SOURCE` status whose original source
is the authenticated user's branch. The company and branch are taken from the session,
not client filters. Users without a company or branch receive an empty list. Invalid
pagination receives 400; unauthenticated or unauthorized requests are rejected. Web and
desktop use this endpoint for the Returns to Source page; mobile has no list page.

`GET /v1/shipments/parcels/reconciliation-cases` with a branch filter includes cases whose
parcel source or destination is that branch. Requested cases may be approved, then executed,
after destination arrival as long as the parcel has not been delivered to the customer.

Parcel creation stores the sender, receiver, and optional second receiver names on the parcel
alongside their linked customer IDs. Existing parcel list/detail, consignment, delivery, and
report responses return these stored names. A later customer profile rename leaves older
parcel names unchanged. Changing a parcel's receiver ID through an authorized parcel action
captures the replacement customer's current name. Contact fields remain linked to the customer
record. Migration `0073` adds the columns and capture trigger without rewriting existing
parcels. Run `bun run scripts/backfill-parcel-customer-names.ts --apply` before deploying a
server build that reads these columns. It commits batches of 500 and is safe to rerun; run it
without `--apply` to check for remaining rows. Names already lost before backfill cannot be
recovered from current customer records. The capture trigger rejects a missing, blank, or
cross-company customer name on a new parcel or receiver change.
Parcel list search matches the stored sender, main receiver, and second receiver names with
case-insensitive partial matching; both total count and page rows use the same filter.
For a legacy parcel whose name snapshot is null or blank, parcel list, detail, rider delivery,
pickup queue, consignment receiving, discrepancy, and report responses temporarily display
the linked customer's current name, and list search matches that name.
Once a snapshot is populated, it takes precedence over later customer profile changes.

`POST /v1/shipments/parcels/:id/edit-information` atomically saves optional `parcelDetails`,
`parcelContent`, and `receiver: { id, fullname?, telephone? }`. The receiver ID must still
match the parcel; a supplied name updates both the customer and this parcel's main-receiver
snapshot, without modifying other recorded parcel names. A phone-only patch does not rename
either record. Omitted fields are preserved; telephone `null` clears the primary phone.
Success returns `{ id }`. Authentication and one of `CanUpdateParcels`, `CanReadParcelIncoming`,
`CanCompleteOfficePickup`, `CanCreateReceiverPayments`, `CanReadParcelScan`, or
`CanReadShelfPickerUpdate` are required; any `receiver` payload also requires
`CanUpdateCustomers`. Company/branch scope comes from the session; destination-branch edits
use their workflow grant, and source-branch edits require `CanUpdateParcels`. Missing context
or invalid names/phones/details return 400/422, missing authentication/permission 401/403,
out-of-scope/deleted parcels or inactive/missing receiver customers 404, and a stale receiver
ID, duplicate phone, or a database trigger that cannot persist the correction 409. Failure rolls back parcel, customer, and audit writes. Names must
trim to 1–255 characters; non-null telephones must be exactly ten digits and distinct from
the secondary phone and other active customers' primary/secondary phones. Migration `0081`
must be applied before deploying this endpoint. Standard/CRM customer PATCH behavior remains
profile-only. See [Parcel Operations](PARCEL_OPERATIONS.md#correcting-a-receiver-from-a-parcel).

Call-center clients should use `POST /v1/shipments/parcels/:id/call-center/contact` to record
a call outcome. For older clients, `PATCH /v1/shipments/parcels/:id` with exactly `status` 5 or
7 and `secondReceiverId` is handled as the equivalent call outcome. It requires call-center
permission and an assignment to the caller at the destination branch. The call time is saved,
the action is audited, and the parcel leaves the active calling queue. Other PATCH payloads
remain ordinary parcel updates.

`POST /v1/notification-hub/events/parcel-status-call` returns
`{ parcelId, trackingCode, sentCount, failedCount, failures }`, where each failure is
`{ channel: 'sms' | 'email', recipientType: 'receiver' | 'second_receiver', message }`.
The additive failure details contain bounded, redacted provider diagnostics; successful sends
return an empty array. Provider rejection remains a notification result, separate from saving
the call outcome. mNotify HTTP 5xx errors report unconfirmed delivery acceptance and must not
trigger automatic resends. Existing permissions/module gates and missing-contact skip behavior
are unchanged. See [Notification Hub](NOTIFICATION_HUB_MODULE.md#call-center-integration).

`POST /v1/notification-hub/events/parcel-status-call/resend` accepts
`{ parcelId, expectedOutcome: 'pickup' | 'delivery' | 'follow_up', sendSms, sendEmail,
includeSecondReceiver? }` and returns the same notification result. `sendSms` and `sendEmail`
are required booleans; at least one must be true. Company, destination branch, and caller
assignment are checked from the authenticated session. A completed call and a matching current
saved outcome are required. The handler does not repeat contact recording or mutate the parcel.
Missing scope/no channels returns 400, missing authentication 401, missing permission/module 403,
missing/deleted/out-of-scope/reassigned parcel 404, changed/uncalled/progressed outcome 409, and
malformed input 422. Provider failures return notification failed counts/details without automatic
retry. The existing call-center notification permissions/module gate apply. Each explicit resend
creates new dispatch records and marks its notification audit metadata `isResend: true`.

The web bulk outcome form saves through `POST /v1/shipments/parcels/bulk-call-outcome` first.
Its **Send SMS** checkbox defaults on; when checked, it then uses the existing
`POST /v1/notification-hub/events/parcel-status-call` for each server-confirmed parcel ID, with
SMS enabled, email disabled, and second receivers excluded. No bulk endpoint body/schema changes
are required. The UI reports SMS sent/failed/skipped counts independently of the saved outcome;
failed/unknown sends do not resubmit the status update or retry SMS automatically. See
[parcel operations](PARCEL_OPERATIONS.md#failure-and-recovery) for workflow and QA cases.

`GET /v1/shipments/parcels/financial-repair/preview?search=<booking-or-tracking-code>` and
`POST /v1/shipments/parcels/financial-repair/execute` require
`CanRepairParcelFinancialState`. Both use the authenticated company and branch and only match an
exact booking or tracking code for a parcel whose source or destination is that branch. Preview
shows the current To Be Paid amount and calculates the expected amount as parcel charge minus all
active principal payments, floored at zero. Execute requires a 5–500 character reason, locks and
rechecks the parcel, rejects currently delivered parcels, and changes only `plannedToBePaidPsw`.
Every change records the actor, reason, branch, old and new values, charge, and active principal
payments in the audit log. A no-op, ambiguous booking-code match, or currently delivered parcel
returns 409; missing/out-of-scope parcels return 404. Use the tracking code when a booking contains
multiple parcels. The web page is `/parcels/financial-repair`; mobile has no equivalent page.

`POST /v1/shipments/parcels/:id/reverse-delivery` also recalculates and returns
`plannedToBePaidPsw` after voiding recipient payments. It derives this amount from the parcel
charge minus remaining active principal payments. For confirmations made after migration `0074`,
the parcel stores its pre-delivery status and confirmation details plus payment IDs. Reversal
restores that status and voids only payments from the confirmation. Earlier payments remain valid.
The linked delivery state and pickup ticket are restored when applicable. A payment or delivery
change during reversal causes the transaction to fail rather than leaving status and balance out
of sync. Apply migration `0074` before deploying this server behavior; older delivered parcels
without snapshots use the legacy status and payment fallback.

## Contract Authority

`POST /v1/payments/collect-sender-and-process` assigns first processing confirmation to the
authenticated cashier's active session, replacing a provisional parcel entry-session link and
preserving the creator. This covers paid, split, and zero-payment To Be Paid confirmation,
including self-service bookings. Parcel locking gives concurrent confirmations one owner;
repeating confirmation preserves ownership. Missing/deleted/wrong-company/wrong-source-branch
parcels return 404 even without a payment; missing active sessions return 403. First processing
adds `PARCEL_SENDER_PROCESSED` audit metadata with current/prior session IDs. Immediate delegated
creation rejects a changed authorized session with 400 before persistence. Schemas/permissions
are unchanged.

Daily Cashier Sales To Be Paid rows and current-session totals require recorded session ownership,
with report date/location derived from the session/owning cashier rather than parcel creation.
Pending, deleted, unlinked, and contradictory processor/session records are excluded; historical
valid links need no backfill. See [cashier confirmation ownership](CASHIER_PAYMENTS_AND_SHIFTS.md#confirmation-owns-the-to-be-paid-report).

Swagger UI at `/docs` and OpenAPI JSON at `/docs/json` from the running server are authoritative for exact methods, schemas, validation, and response bodies. These documents explain the stable domain surface and access rules.

Every protected endpoint must enforce authentication, permission, company-module availability where applicable, company scope, branch/location scope, and any required operational assignment. Hiding a client route is not sufficient authorization.

Cashier session delegation endpoints and `completeToBePaid` booking creation are documented in
[Identity and parcel operations](api/IDENTITY_AND_OPERATIONS.md). Delegation is scoped to the
owning cashier's active session; the processed parcel records that cashier as `processedBy`.

## Shared Conventions

- JSON is used for ordinary request and response bodies.
- Upload endpoints use multipart data and store objects through the configured S3/MinIO service.
- Errors use the shared server error model and request ID.
- Dates and money must follow the endpoint schema; clients must not infer business totals.
- Retried mutations must use the domain's duplicate-protection or idempotency behavior.
- Public self-service and application-update endpoints expose only their explicitly documented limited surface.

### Error display contract

Server failures use the normalized shape
`{ "error": { "code": string, "message": string, "status": number, "details"?: object } }`.
Web and mobile clients recursively read the server `message` from direct responses, transport
`response`/`body`/`data`, nested `error`/`detail`/`cause`, and validation `errors`. User-facing alerts, inline failures, and toasts must
show that server message when it exists; feature-specific text is only a fallback for network,
empty, or non-JSON failures. Clients must not replace a supplied authorization, validation,
conflict, rate-limit, or business-rule message with a generic “failed” message.
Web query failures are surfaced by the shared API boundary, while mutation screens add their own
contextual toast through the same parser. Duplicate identical global messages are suppressed.

The shared API rate limit is per HTTP method, route, and client identity (valid signed access
token when present, client IP otherwise). It uses a fixed window beginning with the first request; a
rejected request does not extend that window. The standard default remains 120 requests per 60
seconds. Staff API `GET` requests with a valid, unexpired signed access token have a 5× read allowance (600 per
60 seconds by default) so routine list/search work is not throttled. This does **not** grant
access: route authentication and permissions still apply. Authenticated `/auth/me/*` reads use
the staff-read allowance. Public tracking, sign-in/refresh,
self-service, application-update routes, anonymous requests, and non-GET methods keep the
standard limit even if a bearer header is supplied. `OPTIONS` preflights do not consume quota.
`RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_WINDOW_SECONDS`, and
`RATE_LIMIT_STAFF_READ_MULTIPLIER` configure these limits. Response headers report the applied
limit, remaining count, window, and policy; `429 RATE_LIMITED` also carries `Retry-After` and
the message above for web, Electron desktop, and mobile clients. Once the original window
expires, the next request starts a fresh quota. The first rejected request per window is logged
with method, path, policy, and limit but without credentials or client IP. Clients should avoid
immediate repeated retries.

QA scenarios:

1. Return `429 RATE_LIMITED` from any authenticated list request and verify the web and mobile UI
   shows “Too many requests. Please retry shortly.”
   Repeat requests while limited and verify the original window still expires on time.
   Verify a staff `GET` receives the configured read allowance, while a write, public tracking,
   sign-in, and preflight retain their respective standard or exempt treatment.
2. Return a nested validation error from a mutation and verify its first actionable validation
   message is displayed.
3. Return a plain-text error body and verify direct-fetch screens show that text.
4. Simulate an offline or empty response and verify the relevant feature fallback is displayed.

## Location Capabilities and Self-Service Customer Corrections

Location create/update bodies accept optional booleans `canSend` and `canReceive`;
create defaults to true for each, and omitted update fields retain existing values.
Location DTOs/options return both flags. `GET /v1/locations/options` accepts optional
`canSend`/`canReceive` filters. Destination booking clients request `canReceive=true`.
Selected booking source/destination locations are validated in the booking transaction;
invalid scope/deleted locations or disabled required services fail with HTTP 400 before
creation. Migration `0082_location_service_capabilities` must be applied first. See
[Location services](PLATFORM_AND_ACCESS.md#location-sending-and-receiving-services).

`PATCH /v1/self-service/drafts/:id/customers` requires `CanCompleteSelfServiceBookings`,
company/branch scope, `sender`/`receiver` (`fullname`, `phone`, nullable/optional `phone2`)
and `expectedUpdatedAt`. It returns the updated draft. Updating a matching saved customer
also requires `CanUpdateCustomers`. Invalid names/phones return 400/422, missing/expired
or foreign drafts return 404, permission failures 401/403, and stale versions, another
staff member's claim, conflicting customer numbers or finalized drafts return 409.
Profile, draft and audit writes are atomic; no booking or payment is created. See
[Staff customer corrections](SELF_SERVICE_BOOKING.md#staff-search-and-customer-corrections).

`PATCH /v1/self-service/drafts/:id` (used by web and mobile) has the same permission, scope,
contact validation, claim/stale checks and atomic audit behavior, and additionally requires
`parcelContent` and `parcelValueCedis`, with optional `destinationBranchId` and optional/null
`destinationLocationId`. Without `destinationBranchId` the draft destination is kept. It returns the updated draft. An invalid destination (source branch,
head office, other company) or location not receiving for that branch, blank contents or a
negative/non-numeric value returns 400; schema violations return 422.

Authenticated receiving requests bypass the shared request quota: in-transit parcel GET
searches, parcel details, consignment receiving reads/receive/close, parcel mark-received,
and PATCH arrival confirmation. Authentication and endpoint permissions still apply;
other parcel updates and invalid/unsigned/public traffic keep their quotas. See
[Receiving quotas](MOBILE_FRONTLINE_WORKFLOWS.md#scan-to-receive-request-quotas).

## Customer website messages

Customer website messages use public `POST /v1/public/contact` and staff-only
`GET /v1/customer-messages`, `GET/PATCH /v1/customer-messages/:id`. They use dedicated
storage and read/manage permissions, separate from internal ticketing. See
[Customer website messages](CUSTOMER_WEBSITE_MESSAGES.md) for payloads, limits,
retry behavior, permissions and deployment requirements.

## WhatsApp Messaging and Digital Receipts

- `GET /v1/whatsapp/availability`, `GET /v1/whatsapp/settings`, `PUT /v1/whatsapp/settings/provider`,
  `PUT /v1/whatsapp/settings/events/:eventCode`, `POST /v1/whatsapp/settings/test`: see
  [WhatsApp messaging](WHATSAPP_MESSAGING.md#api-summary). Secrets are never returned.
- Public `GET|POST /v1/public/whatsapp/webhook`: Meta verify-token handshake and signed delivery
  status callbacks (403 on a bad token or signature).
- `GET|PUT /v1/digital-receipts/customers/:id/preference`, `GET /v1/digital-receipts/parcels/:id/options?kind=`,
  `POST /v1/digital-receipts/parcels/:id/send`: see [Digital receipts](DIGITAL_RECEIPTS.md#other-api).
- Public `GET /v1/public/receipts/:token`: `{ kind, bookingCode, issuedAt, summary, html }`. Unknown,
  expired, malformed or module-disabled links all return 404.
- `POST /v1/payments/receiver-otp/request` accepts optional `channel: 'sms' | 'whatsapp'` and
  returns `{ expiresAt, channel }`.

## Receiver OTP Send Failures

`POST /v1/payments/receiver-otp/request` still returns `{ expiresAt }` after successful SMS
provider acceptance. It now returns HTTP 503 with a diagnostic error if dispatch fails,
including no active default provider or invalid/missing SMS configuration. The failed newly
created OTP is expired and cannot block the next request. A previously sent code is retained
when its forced replacement fails. Existing HTTP 409 behavior for an active OTP without
`force: true`, receiver/phone validation, branch OTP requirements and verification/payment
rules are unchanged. This behavior applies to web, desktop and mobile clients using the
shared endpoint. Notification dispatch logs retain the send failure. Tests:
`src/server/features/parcel-receiver-otp/otp-sms-delivery.test.ts` and
`src/server/features/notification-hub/sms-provider-payloads.test.ts`.

Self-service public `POST /self-service/drafts` now returns `bookingsCompleted` and nullable
`nextSession` alongside `draftId`/`expiresAt`. One QR scan permits ten successful drafts within
its original 15-minute deadline; tokens remain single-use. Persistence and continuation issuance
are atomic. Matching draft POST retries return the saved response; changing the details under
a consumed token returns 409. See [Self-service booking](SELF_SERVICE_BOOKING.md) for refresh/rescan behavior and
separate daily abuse quotas. Staff completion and sticker APIs are unchanged.

Delivery Cashier can manage a second receiver before rider handover, including Address Collected
and Dispatched parcels, through the existing permission-guarded receiver endpoint. Mobile rider
handover supports an optional `handoverTarget` and only selects the cashier-linked second contact;
stale choices fail with 409. See [Identity and operations APIs](api/IDENTITY_AND_OPERATIONS.md).

The shift-session cashier sales clients derive separate Delivery Cashier **Delivery fees received**
and **To Be Paid received** summaries from existing `GET /reports/daily-cashier-sales` transaction
fields (`cashierType`, `component`, `grossAmountPsw`). No response or permission changes are
required. The API continues to exclude voided payments and apply report scope. See
[Cashier payments and shifts](CASHIER_PAYMENTS_AND_SHIFTS.md#delivery-cashier-received-summary)
for component classification, outstanding-versus-received labels, printing and QA.

Parcel information editing now also accepts the parcel's source branch when the authenticated
actor has `CanUpdateParcels`; receiver fields still additionally require `CanUpdateCustomers`.
`POST /shipments/parcels/:id/edit-information` keeps its existing request and response. Actor
permissions and company/branch scope come from authentication, not the request body. Source Edit
is exposed on Processed Parcels / Consignment, In Transit Outgoing and Super Search on web/desktop.
Third branches and other companies remain rejected. See
[Parcel Operations](PARCEL_OPERATIONS.md#correcting-a-receiver-from-a-parcel).

Source-branch sender reassociation now uses `GET /shipments/parcels/:id/sender-candidates` and
`POST /shipments/parcels/:id/correct-sender`, guarded by both parcel/customer-update permissions.
The selected customer must already own the exact entered primary/secondary number; the change
is isolated to one parcel and audited atomically. Sender credit history blocks reassociation
pending Accounts reconciliation. See [Identity and operations APIs](api/IDENTITY_AND_OPERATIONS.md).
Booking customer-name popups on web/mobile reuse existing lookup and customer PATCH endpoints;
no customer-directory read grant is needed for minimal booking lookup.
