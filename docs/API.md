# API Documentation Index

Base URL: `/v1`

Last audited at the mounted route-group level: 2026-08-27.

The API reference is split by domain:

- [Identity and parcel operations](api/IDENTITY_AND_OPERATIONS.md)
- [Enterprise modules](api/ENTERPRISE_MODULES.md)
- [Platform, communication, and intelligence](api/PLATFORM_AND_INTELLIGENCE.md)
- [Reporting](api/REPORTING.md)

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
