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
- `/shipments/parcels/sticker-prints`: record a successful sticker print and its copy count.
- `/shipments/consignments`: consignment creation, dispatch, receiving, completeness, and exceptions.
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
