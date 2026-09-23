# Mobile Frontline Workflows

Last audited: 2026-09-21

## Scope

The mobile client implements five task-focused workflows that reuse the same authenticated APIs, permission keys, company scope, branch scope, and server validation as web and desktop:

- self-service booking completion
- call-center follow-up and doorstep address collection
- receiving discrepancies with photo evidence
- supervisor delivery-change review
- customer lookup and limited contact editing

The implementation lives under `apps/mobile/src/features`. Route files under `apps/mobile/app/(app)` are one-line feature exports. Navigation entry points are shown only when the corresponding screen permission is present, and every destination screen independently checks access before loading protected data.

Each Operations workflow card opens its registered native screen. The shared mobile link adapter passes the original route path directly to the navigation service. It must not parse the path into a native screen name and then parse that screen name again, because unknown paths intentionally fall back to the Dashboard.

## Permission Matrix

| Workflow                | Read/entry permission                                      | Mutation permission                                                                                                                                                             |
| ----------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Self-service drafts     | `CanReadSelfServiceBookings`                               | Claim and complete: `CanCompleteSelfServiceBookings`                                                                                                                            |
| Call-center follow-up   | `CanReadCallCenterParcelStatus` or `CanMarkDoorstepCalled` | Record call: `CanReadCallCenterParcelStatus`; save address/fee: `CanMarkDoorstepCalled`                                                                                         |
| Receiving discrepancies | `CanReadParcelIncoming`                                    | The current server discrepancy endpoints use `CanReadParcelIncoming` for create/list/resolve; photo upload requires authentication and is linked to the authorized discrepancy. |
| Delivery-change review  | `CanMarkDoorstepCalled`                                    | Approve/reject: `CanMarkDoorstepCalled`, plus server branch matching.                                                                                                           |
| Customer directory      | `CanReadCustomers`                                         | Limited contact update: `CanUpdateCustomers`                                                                                                                                    |

Read access never substitutes for a separate mutation permission. The server remains authoritative when a cached screen or stale session attempts an action.

## Self-Service Completion

Mobile exposes **Self-Service Bookings** directly in the navigation drawer and in the Operations Hub
when the user has `CanReadSelfServiceBookings`. It lists active drafts for the authenticated branch.
Staff can inspect sender, receiver, declared contents, declared value, submission time, expiry, and
claim status.

An authorized completing agent can:

1. Open an available draft; mobile claims it before displaying the completion form, matching the web
   workflow and preventing another agent from completing it concurrently.
2. Confirm parcel details and the authoritative charge.
3. Select sender, receiver, or split payment responsibility.
4. Enter the sender portion for a split payment.
5. Complete the draft through `POST /self-service/drafts/:id/complete`.

Mobile currently submits `PAY_NOW` settlement. Credit completion remains available on desktop until the mobile flow includes customer credit eligibility, credit-limit presentation, and cashier-session parity. The server rejects concurrent claims, expired drafts, invalid destinations, invalid charges, and unavailable payment/session combinations.

Users with read permission but without `CanCompleteSelfServiceBookings` can inspect drafts without
claiming them. A failed claim keeps the user on the queue and shows the server error; it must not open
an editable completion form.

## Call-Center Assigned Calls and Address Collection

The Call Center Follow-up screen has two permission-aware queues:

- **Assigned calls** is available with `CanReadCallCenterParcelStatus`. It uses `GET /shipments/parcels/call-center/assigned`, which restricts results to the authenticated user's company, destination branch, and user ID. It includes Arrived at Destination, Customer Contacted, and Returned to Office parcels so follow-up remains visible until a pickup or delivery outcome is recorded.
- **Delivery addresses** is available with `CanMarkDoorstepCalled`. It uses `GET /shipments/parcels/call-center/address-collection`, scoped by the server to the authenticated company and branch and to Home Delivery Requested parcels.

When both permissions are present, mobile shows a native queue switch and defaults to Assigned calls. Users with only one permission see only the permitted workflow. Both queues support search by booking, tracking, receiver, or telephone data.

An assigned parcel card shows booking and received time, parcel and receiver details, route, receiver amount, contact state, and underlying parcel status. The Call Outcome sheet can open the device telephone application and records one of:

- Customer will get back → Customer Contacted
- Customer will come → Awaiting Pickup
- Customer wants delivery → Home Delivery Requested

Awaiting Pickup optionally supports a newly created second receiver, subject to server customer-create permission and validation. The form requires a name and a ten-digit telephone number. SMS is selected by default; email is optional. Parcel status is saved before notification dispatch. If notification dispatch fails, mobile reports partial success, closes the completed outcome, and refreshes the assigned queue rather than inviting a duplicate status mutation.

- In Delivery addresses, users who also have `CanReadCallCenterParcelStatus` can record the call through `/deliveries/dd/:parcelId/call`.
- Users with `CanMarkDoorstepCalled` can save a confirmed address and delivery fee through `/deliveries/dd/:parcelId/address-collected`.
- A user with only one permission receives only that capability; opening the telephone application itself does not grant the server mutation.

Address validation requires at least three characters. Delivery fees must be numeric and non-negative. A successful save moves the parcel to Address Collected according to the server delivery service.

## Receiving Discrepancies and Photo Evidence

Mobile supports both discrepancy categories used by desktop:

- `record_not_physical`: an expected system parcel was not physically received; staff must search and select the parcel.
- `physical_missing_in_system`: a physical parcel was received without a matching system record; staff enter any visible booking or tracking identifier.

Notes and one captured camera photo are required by the mobile form. The server first creates the discrepancy, then the client uploads the image through `POST /shipments/parcels/discrepancies/:id/evidence`. The endpoint verifies `CanReadParcelIncoming`, company ownership of the discrepancy, and then stores the file through the shared upload subsystem using:

- model type: `parcel-discrepancy-evidence`
- model ID: the created discrepancy ID

This links evidence through the existing upload model without duplicating image storage. If discrepancy creation succeeds but photo upload fails, mobile explicitly reports partial success and keeps an in-session Retry photo upload action tied to the created discrepancy. The discrepancy must not be submitted again merely to retry the photo. If the app is closed before retry succeeds, evidence must be attached to the existing discrepancy through operational recovery.

## Supervisor Delivery-Change Review

Mobile lists pending rider requests for the supervisor's branch. Each request shows:

- booking and tracking identity
- rider
- current address and delivery fee
- requested address and delivery fee
- rider reason and request time

The supervisor can approve or reject and optionally enter a review note. The server verifies branch scope, pending state, and concurrency. A second decision receives a conflict instead of replacing the first review.

## Customer Lookup and Limited Editing

Mobile can search the company customer directory by the server-supported text search and view customer identity and contact details. With `CanUpdateCustomers`, staff can update only:

- full name
- primary telephone
- secondary telephone
- email
- address

Credit eligibility, credit limit, customer type, identity verification, government logging, cards, statements, payments, and deletion are read-only or excluded from this mobile workflow. Those higher-risk fields remain in their permission-specific desktop workflows.

## Failure and Recovery

- `401`: refresh once when possible; otherwise clear the mobile session.
- `403`: show authorization denial and do not retry through a broader permission.
- Branch mismatch: preserve the server denial and do not broaden filters.
- Concurrent draft claim or review: reload the current list and show the conflict.
- Completion failure: keep the draft/form available; do not create a second draft.
- Discrepancy photo failure after record creation: report partial success and retain the discrepancy ID for evidence recovery.
- Telephone application unavailable: report that the call could not start; do not mark the call as recorded.
- Customer update failure: preserve the editable form values for correction and retry.

## QA Scenarios

- Granted, read-only, action-only where supported, and fully denied permission combinations for every workflow.
- Direct navigation with no permission performs no protected request.
- Self-service available, claimed, concurrent claim, expired, completed, split-payment, and server-validation cases.
- Call-center agent with no assignments, assigned arrival/contacted/returned parcels, search, each outcome, missing phone, invalid second receiver, notification partial failure, and refresh after save.
- Call-center user with assigned-call-only permission, address-only permission, both permissions, invalid address, and invalid fee.
- Discrepancy selected-system-record, unmatched physical parcel, missing identity, missing notes, denied camera, capture failure, upload failure after create, and successful linked upload.
- Delivery review branch mismatch, already-reviewed conflict, approval, rejection, and optional note.
- Customer search with no results, read-only details, permitted contact update, duplicate telephone conflict, and company isolation.
- Android and iOS camera, telephone deep link, keyboard, scrolling, loading, and offline recovery checks.
