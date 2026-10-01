# API Documentation Index

Base URL: `/v1`

Last audited at the mounted route-group level: 2026-08-27.

The API reference is split by domain:

- [Identity and parcel operations](api/IDENTITY_AND_OPERATIONS.md)
- [Enterprise modules](api/ENTERPRISE_MODULES.md)
- [Platform, communication, and intelligence](api/PLATFORM_AND_INTELLIGENCE.md)
- [Reporting](api/REPORTING.md)

Public parcel tracking is documented in [Public parcel tracking API](PUBLIC_PARCEL_TRACKING_API.md).

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

QA scenarios:

1. Return `429 RATE_LIMITED` from any authenticated list request and verify the web and mobile UI
   shows “Too many requests. Please retry shortly.”
2. Return a nested validation error from a mutation and verify its first actionable validation
   message is displayed.
3. Return a plain-text error body and verify direct-fetch screens show that text.
4. Simulate an offline or empty response and verify the relevant feature fallback is displayed.
