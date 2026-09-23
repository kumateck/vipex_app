# Parcel Operations

## Scope

Parcel operations cover booking, parcel creation, payment responsibility, physical movement, custody transfer, receiving, pickup, delivery, and exception handling. The main implementation areas are:

Call-center assignment and shelf-picker updates are separate permission-gated workflows. Their pages
require `CanReadCallCenterAssignment` and `CanReadShelfPickerUpdate`; mutations require
`CanAssignCallCenterParcels` and `CanUpdateParcelShelfPicker`. Shelf-picker assignment is stored on
the parcel in `parcels.shelf_picker_staff_id`, so it remains available when pickup queues are
disabled. When an active pickup queue exists, the server mirrors the assignment to
`pickup_queues.picker_staff_id` for compatibility. The server enforces these permissions
independently of sidebar visibility.

The Call Center Assignment and Shelf Picker Update tables show a Payment column and legend: green
is **Paid**, amber is **To Be Paid**, and blue is **Partial**. A Paid parcel shows only its paid
amount, a To Be Paid parcel shows only its balance due, and a Partial parcel shows both. The
indicator is informational and does not change assignment behavior.

Shelf Picker Update lists unassigned parcels first across the full paginated result. Assigned
parcels follow. Within each group, branches using pickup queues retain queue-number order when
there is no search; other results retain creation order. The server considers both the parcel's
stored shelf-picker assignment and a legacy pickup-queue assignment when determining whether a
parcel is assigned. A failed list request leaves the current table error visible and does not
change any assignment. QA: check Paid, To Be Paid, and Partial rows for the correct amount lines;
assign a picker to a parcel on page one, refresh, and verify that it moves below all unassigned
rows, including those on later pages; repeat on a branch with pickup queues enabled.

Call Center Assignment shows sender and receiver names with every available telephone, payment
status and applicable balances, parcel details, received date and time, and the current assignee.
Unassigned parcels appear before assigned parcels across the full paginated result. Within each
group, the newest effective received date is first; creation time is the fallback for legacy rows
without a received timestamp. Paid rows omit a zero To be paid line, To Be Paid rows omit a zero
Paid line, and Partial rows show both balances.

All Parcels Super Search uses the same payment legend and places the matching colored indicator in
each Payment cell. A fully paid parcel shows only its **Paid** amount; a fully unpaid parcel shows
only its **To be paid** amount; a partial parcel shows both amounts. Zero rows for the inapplicable
payment side are omitted, while the declared parcel value remains visible for every result.

Call-center assignment list and mutation failures display the message returned by the API, including
validation, permission, and rate-limit messages. If the response cannot be decoded, the web client
uses an operation-specific fallback. Authenticated rate limits are isolated by bearer credential,
so staff sharing a branch network do not consume one another's request allowance; unauthenticated
traffic remains isolated by client IP. A failed list request leaves the current table state intact.

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
in one action. Incoming and outgoing transit tables use one **Route** column with four lines: source
branch, source location, destination branch, and destination location. Missing route values display
as `-`. The confirmation dialog lists the selected bookings before submission. The server
uses the authenticated user's company, receiving branch, and user ID; client-supplied ownership or
receiver identity is not accepted. Every parcel must still be undeleted, in transit, not previously
received, and destined for the authenticated receiving branch. Validation and updates run in one
database transaction, so an unavailable, out-of-scope, already-received, or concurrently changed
parcel rejects the whole batch without partial status changes. Successful batches set one shared
receipt time, move every parcel to `ARRIVED_AT_DESTINATION`, record the receiving user, and write a
batch audit event. Mobile receiving remains scan-based and processes one reviewed parcel at a time.

Mobile scan-to-receive accepts the current parcel tracking URL, a bare booking or tracking code, and legacy production payloads in the form `QR-<tracking-code>`. The client normalizes these formats before searching for an in-transit parcel at the authenticated user's destination branch. The overview count loads from the server when the screen gains focus and shows the server's total record count, not only the currently rendered page. An unreadable code or a code for another branch/status remains unmatched and does not change parcel state.

The mobile camera displays a high-contrast moving scan band with a solid center line and an active-scanner status while it is looking for a QR code. It starts on the device's neutral back-camera lens, supports pinch-to-zoom, and presents a Light toggle on devices with a torch. Staff should flatten reflective wrapping and change the camera angle to remove glare. Android production builds must set `VisionCamera_enableCodeScanner=true`; this bundles the ML Kit barcode model instead of relying on an on-demand model download. Changing this native property requires rebuilding and reinstalling the Android application. If a printed QR remains unreadable because of glare, small print, or label damage, the scanner card provides an in-place booking/tracking-code fallback. Parcel stickers do not print a human-readable code beneath the QR.

Scanner assistance does not make low-contrast stock compliant. New parcel QR codes require black
modules on an opaque white area with a full quiet zone. Existing blue stickers require a white
QR-only overlay label or manual code search; the camera must not be treated as a substitute for
correct label stock.

Thermal parcel stickers encode the compact `QR-<tracking-code>` payload rather than the longer
public tracking URL. The mobile scanner normalizes this payload before branch-scoped lookup. The
portrait sticker reserves a 22 mm black-on-white QR area, preserves square pixels during desktop
and browser printing, without additional text beneath it. Older or blurred stickers must be
reprinted; updating the mobile app does not alter an existing physical QR.

After detecting a QR code, mobile provides immediate haptic feedback, pauses further camera scanning, and covers the camera preview with a high-contrast progress overlay reading **QR detected — Finding incoming parcel…**. The overlay remains until the branch-scoped in-transit lookup succeeds or fails, preventing an ambiguous or apparently idle processing state.

From mobile parcel review, **Back To Incoming List** always navigates to the existing native scan-to-receive screen (`/(app)/receive`). It must not depend on browser or navigation history, reset the navigator, create a second camera screen, or open the desktop incoming-parcels page.

The native camera and code-scanner output exist only while the scan-to-receive screen is focused. Navigating to parcel review unmounts the camera and releases its session; returning mounts a fresh camera while preserving a stable `codeScanner` output configuration. Focus also clears stale scan-processing state. This prevents a dark preview and Vision Camera's `session/invalid-output-configuration` error on repeat visits.

If a native camera session still fails, mobile handles the camera error in-screen and presents **Restart Camera**. It must not expose the developer console error screen or leave staff with an unexplained dark preview.
The scanner also shows the native camera error message for support diagnosis, directs permanently
denied users to system camera settings, and recommends updating or reinstalling when the native
scanner runtime is missing. Android QR support is bundled in Vipex Mobile `1.0.18` and later; an
older installed APK must be replaced because JavaScript updates cannot add the native ML Kit model.

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

The Receiver Payment + Pickup Verification and sender-paid Pickup Verification dialogs show a
two-column skeleton while their required parcel, staff, card, location, branch, payment,
consignment, storage, queue, and receiver data load. Interactive form content and delivery actions
appear only after the required resources and derived form values are ready. If a required request
fails, the skeleton ends and the dialog displays a load error; closing and reopening retries the
resource queries.

Receiver-cashier principal due is the parcel charge minus all non-voided principal payments. The
stored `plannedToBePaidPsw` value is already reduced as principal payments are collected, so clients
and list queries must not subtract those payments from it again. For example, a GHS 150 charge with
a GHS 100 sender payment leaves GHS 50 available for receiver collection.

Storage settlement uses the parcel's persisted `receivedAt` timestamp. For legacy parcels where
that field is null, the earliest audited transition to `ARRIVED_AT_DESTINATION` is the effective
received time. The detail response and storage settlement use the same effective timestamp, so the
informational accrual and payable outstanding storage amount remain consistent. A parcel still
inside its grace period has zero payable storage; failed or voided storage payments do not reduce
the outstanding amount.

### Shelf-picker assignment

`POST /v1/shipments/parcels/:id/update-shelf-picker` accepts a required `userId` and persists the
assignment on the parcel. A successful response is `{ success: true, parcelId }`. The Shelf Picker
Update list must show the assigned staff member after refresh, and reopening the update dialog must
preselect that member. Pickup Verification and Receiver Cashier also preload the parcel assignment;
an older pickup-queue assignment is used only when the parcel-level value is absent.

This workflow is supported whether `usePickupQueue` is enabled or disabled. A missing parcel fails
with not found, and a failed write must not report success. The web and desktop clients share this
behavior; mobile does not currently expose the shelf-picker update page.

Last-mile delivery includes dispatch, rider assignment, current deliveries, delivery history, rider change requests, and real-time updates. Mobile riders operate on assignments available to their authenticated account and branch scope.

Mobile call-center staff can call receivers, record call contact when authorized, and save confirmed doorstep addresses and delivery fees. Branch supervisors can approve or reject pending rider address/fee changes from mobile; branch and pending-state validation remain server-side.

The mobile assigned-call queue provides separate **Call receiver** and **Call sender** actions. Each
action opens the device dial pad with the corresponding primary telephone prefilled; an unavailable
telephone disables only its matching action.

A parcel awaiting pickup is routed to Receiver Cashier whenever either its principal amount or its
storage accrual remains outstanding. This includes a fully paid parcel that accumulated unpaid
storage charges. The ordinary Waiting Pickup workflow excludes that parcel until storage is paid or
waived by the cashier workflow. This eligibility is calculated by the API from the current company
ageing policy, non-voided storage payments, and recorded storage waivers, so web clients cannot
bypass the routing rule with local filters.

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

Bulk call outcomes on the web Call Receivers page show the selected booking preview and resulting
status. One request saves the selected outcome for all parcels on the server. The bulk action sends
no SMS or email and does not change second-receiver assignments. A failed batch retains its selection
for correction or retry. The single-parcel Call Outcome action retains its notification and optional
second-receiver controls.

## Verification Scenarios

- Sender-paid, receiver-paid, split, zero-charge, and credit creation.
- Call-center list, single assignment, and bulk assignment failures display the nested API message;
  two authenticated staff behind one public IP have independent rate-limit quotas.
- Call-center assignment lists sender and receiver contacts, payment state, received D&T, unassigned
  rows before assigned rows across pages, and newest received rows first within each group.
- Bulk call outcome success for each of the three statuses, unauthorized request, out-of-scope or
  reassigned parcel, stale status, and concurrent change with no partial updates or notifications.
- Mobile call-center receiver and sender call actions open the appropriate primary number, disable
  cleanly when absent, and do not substitute one party's number for the other.
- A paid parcel with outstanding storage appears in Receiver Cashier and not Waiting Pickup; after
  full storage payment or waiver it leaves Receiver Cashier and becomes eligible for Waiting Pickup.
- A fully paid parcel with no outstanding storage appears only in Waiting Pickup, even when its
  original receiver-payment plan was greater than zero; routing uses non-voided principal payments,
  not the original payment plan.
- Single and multi-parcel creation with partial failure.
- Consignment complete, missing, extra, and duplicate scans.
- Previous-consignment retrieval for one date and a multi-day inclusive range, empty results,
  reversed/invalid dates, agency branch isolation, head-office source filtering, an out-of-scope
  print request, a consignment with no active items, and successful A4 reprint.
- Web incoming batch selection across pages, select-all for the current page, successful bulk
  arrival, more than 100 selections, wrong receiving branch, already-received parcel, and concurrent
  status change with no partial updates.
- Incoming and outgoing Route cells show From branch/location and To branch/location without
  duplicate Source or Destination columns.
- Super Search payment cells cover paid-only, unpaid-only, and partial balances, including the
  matching legend indicator and omission of inapplicable zero-value rows.
- Mobile scan-to-receive with current tracking URL, bare code, legacy `QR-` payload, unreadable code, wrong branch, and non-in-transit status.
- OTP enabled, disabled, expired, incorrect, alternate recipient, and alternate phone.
- Pickup with and without receiver payment.
- Receiver-payment and sender-paid pickup dialog initial loading, cached loading, optional
  second-receiver/location data, completed form initialization, and required-resource failure
  without an endless skeleton.
- Split principal payment where a sender payment leaves a receiver balance, subsequent partial
  receiver payment, and voided/non-principal payments that must not reduce the principal balance.
- Storage settlement for a current `receivedAt`, a legacy null `receivedAt` with an audited arrival,
  grace-period zero accrual, and accrual reduced by valid storage payments or waivers.
- Shelf-picker assignment with pickup queues enabled and disabled, list refresh after assignment,
  reopening with the assigned staff selected, pickup-verification preload, receiver-cashier
  preload, and an unknown parcel.
- Call-center and shelf-picker assignment payment indicators for paid, to-be-paid, and partial
  parcels, including unchanged single and bulk assignment behavior.
- Rider assignment, change request, completion, and real-time refresh.
- Mobile call-only, address-only, and combined call-center permissions.
- Mobile photo evidence success and upload failure after discrepancy creation.
- Mobile supervisor approval, rejection, branch mismatch, and already-reviewed conflict.
- Internal transfer create, acknowledge, reject, and history.
- Reconciliation request, approval, rejection, and original-session correction.
