# API Documentation Index

Base URL: `/v1`

Last audited at the mounted route-group level: 2026-10-08.

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
See [Identity and parcel operations](api/IDENTITY_AND_OPERATIONS.md) for scope and failure rules.

Native device registration is documented in [Native device registration](DEVICE_REGISTRATION.md).
`POST /v1/auth/devices/register` verifies staff credentials and returns a pending device ID and
one-time secret. `GET /v1/auth/devices/status` accepts device credential headers.
`GET /v1/auth/devices/access` requires a bearer token and returns whether the company's
`device_verification` module is enabled after checking native access. Head-office
users with `CanUpdateUsers` use `GET /v1/auth/devices/` and
`POST /v1/auth/devices/:id/review` to approve, revoke, block, unblock, or permanently deny.
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
parcel uses that explicit officer choice; if omitted, it keeps the customer's draft value. The
existing completion permission, branch ownership, state, and charge validation still apply. Web
and mobile officer clients expose this checkbox; the public draft form remains separate. See
[Self-Service Booking](SELF_SERVICE_BOOKING.md).

Parcel list/search responses include `senderPaidPrincipalPsw` and `receiverPaidPrincipalPsw`,
non-voided principal totals by payer in pesewas. Both are zero when that payer has no principal
payment. Super Search uses these fields only for delivered-parcel payer badges; see
[Parcel operations](PARCEL_OPERATIONS.md). Delivery fees, storage, and voided payments are excluded.

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

`auth`, `users`, `branches`, `locations`, `warehouses`, `customers`, `cards`, `uploads`, `cashiers`, `shipments`, `payments`, `deliveries`, `pickup-queues`, `accounting`, `inventory`, `shifts`, `company-modules`, `module-workspace`, `procurement`, `fleet-transport`, `customer-wallet-credit`, `reconciliation`, `notification-hub`, `momo`, `self-service`, `desktop-updates`, `mobile-updates`, `communication`, `customer-service`, `help-assistant`, `executive-insights`, `fleet-anomaly-brief`, `operations-exceptions-brief`, `management-daily-brief`, `ai-chat`, `it-support`, `reports`, `audit`, `hr`, `payroll`, `rbac`, and `geolocation`.

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

Call-center clients should use `POST /v1/shipments/parcels/:id/call-center/contact` to record
a call outcome. For older clients, `PATCH /v1/shipments/parcels/:id` with exactly `status` 5 or
7 and `secondReceiverId` is handled as the equivalent call outcome. It requires call-center
permission and an assignment to the caller at the destination branch. The call time is saved,
the action is audited, and the parcel leaves the active calling queue. Other PATCH payloads
remain ordinary parcel updates.

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
