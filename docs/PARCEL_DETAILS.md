# Parcel Details and History

One shared, read-only view shows everything recorded about a parcel and its full history: who
did each step, when, and at which branch. Every web page that lists parcels opens this same view.
Mobile keeps its own Super Search details screen (see [Mobile differences](#clients)).

## Access and scope

- Opening details requires `CanReadParcels` (unchanged). The history uses the same permission.
  Anyone who can open a parcel sees its history. Seeing it does **not** require the audit-log
  permissions (`CanListAuditLogs`, `CanGetEntityAuditHistory`).
- Both endpoints are company-scoped. A parcel belonging to another company returns `404 Parcel not
found`, the same as a missing parcel, so parcel IDs from other companies are not disclosed.
  Before October 2026, `GET /shipments/parcels/:id/details` did not check the company.
- Super Search offers **Send receipt** above the tabs when Digital Receipts is enabled, the
  parcel is not deleted, and the user has a receipt API permission. The send dialog loads on demand;
  closing it keeps parcel details open. See [Digital receipts](DIGITAL_RECEIPTS.md).
- The parcel fields are read-only. Page-specific actions stay on their pages: Super Search and Return to
  Source show **Return to Source** above the tabs and disposition controls in an **Actions** tab.

## Where it opens

The dialog is mounted once in the signed-in layout (`ParcelDetailsHost`) and lazy-loaded the
first time a parcel is opened. Pages open it through `useParcelDetailsViewer().open(parcelId)` or
the drop-in `ViewParcelDetailsMenuItem` / `ViewParcelDetailsButton`.

| Page                                                                                                                                                                                                                                      | Entry point                                                                       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Super Search, Return to Source                                                                                                                                                                                                            | Existing **View Details** / **Review Details** (with page actions)                |
| Incoming / Outgoing In Transit                                                                                                                                                                                                            | Existing **View Details** (old in-transit dialog removed)                         |
| Customer profile → Transactions                                                                                                                                                                                                           | Existing parcel link (old customer parcel dialog removed)                         |
| Waiting for Pickup                                                                                                                                                                                                                        | **Full Details** menu item (its **View Details** still opens pickup verification) |
| Receive, Parcel Status, Receiver Cashier, Sender Payments, Delivery Cashier, Home Delivery Address, Home Delivery Dispatch, Rider Current, Pickup Queue, Shelf Picker Update, Internal Transfers search, Processed Parcels (reprint menu) | **View Details** in the row menu                                                  |
| Discrepancies                                                                                                                                                                                                                             | **View Parcel** in the row menu, when the discrepancy is linked to a parcel       |
| Call Center Assignment, Rider Assigned, Uncollected, Delivery Reversal, Shelf Pickup Reassignment, Pickup Queue Board, Delivery Change Requests, Daily Parcel Audit report                                                                | **Details** button                                                                |
| Reconciliation Cases, Storage Clearances                                                                                                                                                                                                  | **Parcel** button                                                                 |
| Financial Repair preview                                                                                                                                                                                                                  | **Full Details** button                                                           |
| Consignment receiving session, Internal transfer details and history preview                                                                                                                                                              | **Details** button next to each parcel                                            |
| Storage clearance search results                                                                                                                                                                                                          | **Details** button next to each result                                            |

Rows that represent consignments or transfers rather than parcels (Incoming Consignments, Previous
Consignments, Internal Transfer lists) have no row action; their parcel lists do.

## Layout

The dialog is up to 1280px wide (96% of the viewport on smaller screens). Fields are laid out in two
or three columns, and sections are tabs. The header shows booking code, status and tracking code. A
deleted parcel shows a warning above the tabs: who deleted it and why, using the parcel's reason or
else the reason from the deletion audit entry, with "Please consult the person before proceeding".

| Tab            | Contents                                                                                                                                                                                                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Overview       | Status, then the rider line for home-delivery statuses (Assigned Rider / D By / Returned By) and **Created By** directly under it, storage badge, booking, tracking, consignment, details, content, declared value, current holder, created/received/confirmed/delivered times, deletion. Tracking QR code. |
| People & Route | Sender and receiver names and phones, CS flag, card numbers, second receiver; source and destination branch (location), dropoff address, call-center agent and called time.                                                                                                                                 |
| Payments       | Charge, planned to-be-paid, payment method, paid/outstanding (total, by sender, by receiver), delivery fee and outstanding fee. Every payment: time, amount, component, payer, method, receipt, the cashier who received it, and void time, user and reason. Voided rows are struck through.                |
| Delivery       | Mode, status, address, fee, amount paid, rider and rider timestamps (home delivery), delivered time, front desk, delivery officer, receiver-call and delivery confirmations, record creator, receiver signature.                                                                                            |
| Custody        | Current internal holder and since when, shelf picker, pickup-queue ticket (code, number, bucket, queued/ended and by whom), every consignment the parcel was on (route, dates, active or removed).                                                                                                          |
| Storage        | Storage days, charging start, accrued/paid/waived/outstanding, each waiver and disposition action with user and time.                                                                                                                                                                                       |
| Handled By     | Every person recorded against the parcel by role. A `-` means the field was not recorded on the parcel; History shows who actually did that step (for example, a receive recorded only as a status change).                                                                                                 |
| History        | Timeline grouped by day, newest day first and newest event first within a day. Each entry has a title, category badge, details, time, "by" user and branch.                                                                                                                                                 |
| Actions        | Only when the opening page supplies actions (Super Search, Return to Source).                                                                                                                                                                                                                               |

Missing values show `-`. Money is in GHS. Times use the app's date-time format.

## Data

`GET /v1/shipments/parcels/:id/details` now returns `summary` (the parcel exactly as list/search rows
show it, built by `listParcelsRepo` with a `parcelId` filter) and `userNames` (a map from user ID to
full name for every person referenced in the details). The dialog no longer depends on the row the user
clicked.

`GET /v1/shipments/parcels/:id/history` returns `{ events: ParcelHistoryEvent[] }`, oldest first:
`{ id, occurredAt, category, title, description, actorName, branchName }`, with `category` one of
`created, status, custody, payment, delivery, storage, exception, communication, edit, print`.
User and branch names are resolved in one batch. An ID that no longer resolves shows `Unknown user`.

### History sources

| Source                                                          | Entries                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Parcel record                                                   | Booked (creator, source branch); received at destination (only when no audit arrival exists); handover confirmed; deleted (only when no deletion audit exists)                                                                                                                                                                 |
| Audit log: `entity_type='parcel'`                               | Status changes (`PARCEL_UPDATED` with `patch.status`, with the previous status), edits (changed fields), information edits, receiver/second-receiver changes, call-center calls, shelf picker (re)assignment with the picker named, home delivery requested, delivery reversed, deletion with reason, repairs and corrections. |
| Audit log: other entity types                                   | `notification_dispatch` for this parcel (customer SMS/email); `delivery` entries whose metadata names the parcel (address/fee change requested/approved, fee updated); `parcel_batch` entries listing the parcel (bulk call outcome, bulk receive).                                                                            |
| Consignment items                                               | Added to, scanned in from, removed from a consignment                                                                                                                                                                                                                                                                          |
| Payments                                                        | Payment received (amount, component, payer, method, receipt, cashier, branch); payment voided (user, reason)                                                                                                                                                                                                                   |
| Deliveries                                                      | Delivery set up (address, fee), rider assigned, receiver call confirmed, rider handed to customer, rider returned, rider cash collection, delivered, delivery confirmed                                                                                                                                                        |
| Pickup queue, internal transfers, receiver OTPs, sticker prints | Queued/closed; transfer sent/acknowledged/cancelled with route; OTP sent (phone masked to last four digits)/verified; sticker printed (copies)                                                                                                                                                                                 |
| Discrepancies, reconciliation cases                             | Logged/resolved; requested/approved/executed/rejected with case type and action                                                                                                                                                                                                                                                |
| Storage waivers, clearance requests, disposition actions        | Waived; clearance requested/approved/returned/rejected/executed; disposition performed                                                                                                                                                                                                                                         |

Audit actions whose own table already supplies the entry (`PAYMENT_*`, `PARCEL_STORAGE_*`,
`PARCEL_DISPOSITION_ACTION*`, `PARCEL_RECONCILIATION_*`, `PARCEL_DISCREPANCY_*`,
`PARCEL_INTERNAL_TRANSFER_*`) are skipped so steps are not listed twice. Any other audit action
without a dedicated label is still shown, using its audit message or the humanized action code,
so nothing recorded is left out. A source table missing from an older database schema contributes
no entries instead of failing the history.

## Limitations

- History shows only what was recorded. Older parcels may have gaps where no audit row or timestamp
  exists. Nothing is inferred or invented.
- The delivery record holds only the latest rider and the latest address/fee change request. Earlier
  requests appear through their audit entries; earlier rider assignments do not.
- `received_by` is empty on parcels received through some flows; the receiving user appears in
  History as the actor of the "Status changed to Arrived at Destination" entry.
- The bulk-action audit lookup scans the `parcel_batch` metadata (about 8,000 rows, 160ms in
  production, October 2026); it grows with bulk actions.

## Clients

Web and desktop share this view. Mobile Super Search details (`apps/mobile/src/features/super-search/
parcel-details`) uses the same two endpoints and shows the same information in five phone-sized
tabs, chosen with a horizontally scrolling switcher:

| Mobile tab | Contents                                                                                                                                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Overview   | Deleted-parcel notice (who, when, reason), status with rider and Created By lines, parcel, holder and pickup-queue cards                                                                                                               |
| People     | Sender/receiver names and phones, second receiver, CS flag, route, call-center agent and called time, Handled By (created, processed, received, confirmed, shelf picker, queued, delivery created, rider, delivery confirmed, deleted) |
| Payments   | Charges (parcel charge, to-be-paid, paid by sender/receiver, outstanding, delivery fee and outstanding fee), each payment with Received By and void user/reason, storage waivers and settlement                                        |
| Delivery   | Office or home delivery record with rider steps, front desk, delivery officer, confirmations and record creator                                                                                                                        |
| History    | The history timeline (newest day first, newest entry first), then consignments, disposition actions and related booking records                                                                                                        |

History loads separately from details. If it fails, the other tabs still work and History shows the
error; pull to refresh reloads both. The Delivery card that used to sit in Overview is now the
Delivery tab. Mobile does not show the tracking QR code or the receiver signature image, and it has
no page actions, because Super Search is its only entry point.

## QA

1. Open a home-delivered parcel (for example KS1642448M in production) from Super Search: Overview
   shows status, `D By: <rider>` and `Created By` under it; History lists booked, payment,
   consignment, arrival, call, home delivery requested, rider assigned, handed over, delivery-fee
   payment and delivery confirmed, each with a user.
2. Open the same parcel from Receiver Cashier, Parcel Status, In Transit, a customer profile and the
   Daily Parcel Audit report and confirm the identical view.
3. Waiting for Pickup: **Full Details** opens this view; **View Details** still opens pickup
   verification.
4. Open a deleted parcel and confirm the warning names the user and reason.
5. Request another company's parcel ID directly and confirm 404 for details and history.
6. Resize below 768px: tabs wrap and fields drop to one column without horizontal scrolling.

Automated: `src/server/features/shipments/parcel-history/*.test.ts` (audit mapping, duplicate
rule, unknown-action fallback, arrival detection, delivery steps, name resolution and ordering),
`src/features/operations/parcel-details/**/*.test.ts(x)` (day grouping, name/phone fallbacks,
history rendering and empty/error states).
