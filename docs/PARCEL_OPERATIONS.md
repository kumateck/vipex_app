# Parcel Operations

## Scope

Parcel operations cover booking, parcel creation, payment responsibility, physical movement, custody transfer, receiving, pickup, delivery, and exception handling. The main implementation areas are:

Call-center assignment and shelf-picker updates are separate permission-gated workflows. Their pages
require `CanReadCallCenterAssignment` and `CanReadShelfPickerUpdate`; mutations require
`CanAssignCallCenterParcels` and `CanUpdateParcelShelfPicker`. Shelf-picker assignment is stored on
the active pickup queue in `pickup_queues.picker_staff_id`; the server enforces these permissions
independently of sidebar visibility.

- Web: `src/features/operations/parcel`, `src/features/bookings`, and related operations features.
- Server: `src/server/features/shipments`, `consignments`, `deliveries`, `pickup-queues`, `parcel-internal-transfers`, and `parcel-receiver-otp`.
- Mobile: `mobile/src/features/parcel-create`, `receive`, `operations`, and `rider`.

## Core Records

| Record              | Purpose                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------- |
| Booking             | Customer-facing shipment reference and commercial details.                                   |
| Parcel              | Physical item tied to a booking and tracking code. One booking can contain multiple parcels. |
| Consignment         | Group of parcels moved between branches or locations.                                        |
| Payment             | Sender, receiver, split, credit, or later-settled amount for a parcel or booking.            |
| Cashier session     | Shift context required for cashier-controlled collections.                                   |
| Delivery            | Last-mile assignment and delivery lifecycle.                                                 |
| Transfer            | Internal custody movement with acknowledgement.                                              |
| Reconciliation case | Controlled correction or exception record with review history.                               |

## Parcel Creation

The creation flow captures sender, receiver, destination, parcel contents, declared value, charge, payment responsibility, and operational options. Customer records can be found or created during the flow.

Important rules:

- Required customer and destination data must be valid before submission.
- Charges are validated by the server; the client must not be treated as the pricing authority.
- Payment responsibility can be sender, receiver, or split where that workflow is enabled.
- Sender-paid creation requires an eligible cashier and an active cashier session when payment is collected immediately.
- Credit settlement is available only when account and permission rules allow it.
- Multi-parcel creation processes each submitted parcel and produces separate tracking and print outcomes.
- The `callSender` option follows the parcel into receiving workflows when staff must contact the sender.

## Creation Print Decision

After creation, an eligible sending or full cashier can choose to print. The current document selection is:

| Settlement            | Documents selected after creation |
| --------------------- | --------------------------------- |
| Sender paid now       | Sticker and A5 receipt/invoice.   |
| Receiver to pay       | Sticker and A5 document.          |
| Zero charge or credit | Sticker only.                     |

Sticker quantity requirements and current implementation gaps are documented in [Parcel Printing](PARCEL_PRINTING.md).

## Operational Lifecycle

| Stage        | Primary capability                                                |
| ------------ | ----------------------------------------------------------------- |
| Created      | Search, inspect, print, and prepare the parcel.                   |
| Outgoing     | Assign or include parcels in an outbound consignment.             |
| In transit   | Track movement to the receiving branch or location.               |
| Receiving    | Scan and compare received parcels with the consignment.           |
| Incoming     | Resolve incomplete, unexpected, or discrepant receipts.           |
| Pickup queue | Make branch-collection parcels available to the receiver cashier. |
| Last mile    | Dispatch parcels to a rider and track delivery.                   |
| Completed    | Record pickup or delivery and final settlement.                   |

The server owns status transitions. Clients should request domain actions rather than update status fields directly.

## Previous Consignment Reprinting

The web **Previous Consignments** page at `/parcels/consignments/history` retrieves persisted
consignments by one consignment date or an inclusive date range and rebuilds the A4 manifest for
reprinting. A single selected date is submitted as the same start and end date. Results show the
consignment number, source and destination branches, consignment date, active parcel count, and a
Reprint action. Search within the retrieved results is by consignment number.

Access requires `CanReadConsignments`. Agency users can retrieve and print only consignments whose
source is their authenticated branch. Head-office users can retrieve all company consignments or
filter by a source branch. Company and agency scope come from authentication rather than client
ownership fields. The printable manifest is rebuilt from the saved consignment and its active
items; removed items are not included. The system does not store a separate consignment-print flag,
so every saved, in-scope consignment in the selected range is available to reprint.

Dates must use `YYYY-MM-DD`, be valid calendar dates, and have an end date on or after the start
date. Invalid ranges are rejected without returning data. An unknown, other-company, or
out-of-scope consignment returns not found and does not open printing. Browser and desktop clients
use the existing routed A4 print flow; mobile has no previous-consignment reprint page.

## Consignment Receiving

Receiving supports scan-based parcel identification, completeness tracking, discrepancy recording, and confirmation. Staff can identify missing or unexpected parcels before completing the receipt.

On the web Incoming (In Transit) page, users can select parcels individually or select every parcel
on the current page, retain selections while paging, and mark up to 100 selected parcels as arrived
in one action. The confirmation dialog lists the selected bookings before submission. The server
uses the authenticated user's company, receiving branch, and user ID; client-supplied ownership or
receiver identity is not accepted. Every parcel must still be undeleted, in transit, not previously
received, and destined for the authenticated receiving branch. Validation and updates run in one
database transaction, so an unavailable, out-of-scope, already-received, or concurrently changed
parcel rejects the whole batch without partial status changes. Successful batches set one shared
receipt time, move every parcel to `ARRIVED_AT_DESTINATION`, record the receiving user, and write a
batch audit event. Mobile receiving remains scan-based and processes one reviewed parcel at a time.

Mobile scan-to-receive accepts the current parcel tracking URL, a bare booking or tracking code, and legacy production payloads in the form `QR-<tracking-code>`. The client normalizes these formats before searching for an in-transit parcel at the authenticated user's destination branch. The overview count loads from the server when the screen gains focus and shows the server's total record count, not only the currently rendered page. An unreadable code or a code for another branch/status remains unmatched and does not change parcel state.

The mobile camera displays a high-contrast moving scan band with a solid center line and an active-scanner status while it is looking for a QR code. It starts on the device's neutral back-camera lens, supports pinch-to-zoom, and presents a Light toggle on devices with a torch. Staff should flatten reflective wrapping and change the camera angle to remove glare. Android production builds must set `VisionCamera_enableCodeScanner=true`; this bundles the ML Kit barcode model instead of relying on an on-demand model download. Changing this native property requires rebuilding and reinstalling the Android application. If a printed QR remains unreadable because of glare, small print, or label damage, the scanner card provides an in-place booking/tracking-code fallback. Parcel stickers print the booking code beneath the QR so this fallback does not require leaving the receive workflow.

Scanner assistance does not make low-contrast stock compliant. New parcel QR codes require black
modules on an opaque white area with a full quiet zone. Existing blue stickers require a white
QR-only overlay label or manual code search; the camera must not be treated as a substitute for
correct label stock.

After detecting a QR code, mobile provides immediate haptic feedback, pauses further camera scanning, and covers the camera preview with a high-contrast progress overlay reading **QR detected — Finding incoming parcel…**. The overlay remains until the branch-scoped in-transit lookup succeeds or fails, preventing an ambiguous or apparently idle processing state.

From mobile parcel review, **Back To Incoming List** always navigates to the existing native scan-to-receive screen (`/(app)/receive`). It must not depend on browser or navigation history, reset the navigator, create a second camera screen, or open the desktop incoming-parcels page.

The native camera and code-scanner output exist only while the scan-to-receive screen is focused. Navigating to parcel review unmounts the camera and releases its session; returning mounts a fresh camera while preserving a stable `codeScanner` output configuration. Focus also clears stale scan-processing state. This prevents a dark preview and Vision Camera's `session/invalid-output-configuration` error on repeat visits.

If a native camera session still fails, mobile handles the camera error in-screen and presents **Restart Camera**. It must not expose the developer console error screen or leave staff with an unexplained dark preview.

Branch controls can require:

- Pickup OTP before a receiver collects at a branch.
- Receiver OTP before a parcel is completed through the receiver workflow.

Both controls default to enabled for branches unless explicitly changed. OTP enforcement must occur on the server even if the UI also performs checks.

Mobile discrepancy capture supports an expected system parcel that is physically missing and a physical parcel without a system record. Mobile requires notes and a camera photo. The photo is uploaded with model type `parcel-discrepancy-evidence` and the created discrepancy ID. If photo upload fails after record creation, the client reports partial success and must not create a duplicate discrepancy.

## Receiver OTP

- A receiver OTP is six digits and expires after five minutes.
- Staff can select the main or alternate recipient and the primary or secondary stored phone where available.
- Request, verification, and final action are separate server operations.
- Verification must be tied to the intended parcel and action; a valid code must not authorize another parcel.
- OTP failure must leave the parcel and payment state unchanged.

## Pickup and Last-Mile Delivery

Branch pickup uses queues for parcel readiness, cashier collection, payment where required, and OTP confirmation when enabled.

Last-mile delivery includes dispatch, rider assignment, current deliveries, delivery history, rider change requests, and real-time updates. Mobile riders operate on assignments available to their authenticated account and branch scope.

Mobile call-center staff can call receivers, record call contact when authorized, and save confirmed doorstep addresses and delivery fees. Branch supervisors can approve or reject pending rider address/fee changes from mobile; branch and pending-state validation remain server-side.

## Internal Transfers

Internal transfers provide a custody trail when a parcel moves between internal actors or locations. Creation and acknowledgement are distinct operations. History must preserve the sender, receiver, time, parcel, and resulting state.

## Reconciliation and Corrections

Reconciliation cases are the approved path for correcting controlled parcel, payment, or operational discrepancies. Corrections should preserve the original values, requested changes, approver, decision, timestamps, and reason.

Recent correction support includes original-session amount corrections so adjustments remain attributable to the session in which the transaction occurred.

## Permissions and Branch Scope

- Menu visibility is not authorization; every server action must enforce its permission.
- Branch users operate within their assigned branch unless a permission explicitly grants broader scope.
- Cashier-controlled actions additionally require the correct cashier type and an active session.
- Mobile, desktop, and browser clients must receive the same server-side authorization result.

## Failure and Recovery

- A failed payment must not advance parcel delivery or pickup state.
- A failed OTP must not consume or complete the protected action.
- A failed print does not invalidate a successfully created parcel; the user must be able to reprint.
- Retried domain actions must avoid duplicate payments, duplicate parcel creation, and duplicate completion.
- Partial multi-parcel failure must show which parcels succeeded and which require retry.

## Verification Scenarios

- Sender-paid, receiver-paid, split, zero-charge, and credit creation.
- Single and multi-parcel creation with partial failure.
- Consignment complete, missing, extra, and duplicate scans.
- Previous-consignment retrieval for one date and a multi-day inclusive range, empty results,
  reversed/invalid dates, agency branch isolation, head-office source filtering, an out-of-scope
  print request, a consignment with no active items, and successful A4 reprint.
- Web incoming batch selection across pages, select-all for the current page, successful bulk
  arrival, more than 100 selections, wrong receiving branch, already-received parcel, and concurrent
  status change with no partial updates.
- Mobile scan-to-receive with current tracking URL, bare code, legacy `QR-` payload, unreadable code, wrong branch, and non-in-transit status.
- OTP enabled, disabled, expired, incorrect, alternate recipient, and alternate phone.
- Pickup with and without receiver payment.
- Rider assignment, change request, completion, and real-time refresh.
- Mobile call-only, address-only, and combined call-center permissions.
- Mobile photo evidence success and upload failure after discrepancy creation.
- Mobile supervisor approval, rejection, branch mismatch, and already-reviewed conflict.
- Internal transfer create, acknowledge, reject, and history.
- Reconciliation request, approval, rejection, and original-session correction.
