# Parcel Operations

## Scope

Parcel operations cover booking, parcel creation, payment responsibility, physical movement, custody transfer, receiving, pickup, delivery, and exception handling.

### Agent Who Charged the Parcel

Staff select **Agent who charged the parcel** for each parcel while entering its charge. Web,
desktop, and mobile booking forms require an explicit selection and start with no agent selected.
The same selector is required when an officer prices and completes a self-service draft. It records
the person responsible for the quoted parcel charge, which may differ from the logged-in creator,
the officer completing the draft, or the cashier collecting payment. It does not collect payment
or change the charge, payment responsibility, tax, printing, cashier session, or parcel status rules.

The server lists only active users in the authenticated company and source branch, returning
`{ id, fullname }`. Booking options require `CanCreateBookingWithParcels`; self-service options
require `CanCompleteSelfServiceBookings`. Neither requires `CanReadUsers`. Head-office and missing
branch/company contexts are rejected. Different parcels in the same booking may have different
agents. The booking transaction rechecks and locks selected user rows until commit, rejecting
unknown, inactive, wrong-company, wrong-branch, and empty-string IDs with a parcel-indexed error.
Rejected selections create no booking, parcel, or payment records; a self-service draft remains
uncompleted. A failed agent lookup offers Retry; no available agent prevents form completion.

Attribution is stored in nullable `parcels.charge_agent_user_id varchar(25)` referencing `users(id)`.
Booking audit metadata also records `chargeAgentUserIds` in parcel order. For compatibility with
installed mobile/desktop clients, API requests may omit `chargeAgentUserId` or send `null`; these
produce NULL attribution rather than guessing an agent. Existing historical parcels remain NULL.
The public customer self-service form does not choose a staff agent.

#### Production Rollout

Migration `0080_parcel_charge_agent` is additive and idempotent. It preserves existing rows, amounts,
statuses, and any existing attribution. It adds a nullable column without a default or backfill,
checks schema drift, and adds an absent FK as `NOT VALID` so existing rows are not scanned under
the ALTER lock. Equivalent FKs retain their name and validation state. Conflicting definitions
fail for manual review. Lock acquisition is limited to 3 seconds and each statement to 15 seconds;
failure rolls back. An aligned schema performs no ALTER.

1. Run read-only `bun run scripts/check-parcel-assignment-schema.ts` against the intended database
   and review every pending migration, including earlier entries.
2. Apply the vetted migrations with the existing migration runner before deploying the backend
   that reads/writes the new column. Retry at a quieter time if lock acquisition times out.
3. Deploy backend and updated clients. The previous clients continue to submit without attribution.
4. After commit, separately validate a newly added FK during an appropriate operational window:

```sql
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '60s';
ALTER TABLE public.parcels
  VALIDATE CONSTRAINT parcels_charge_agent_user_id_users_id_fk;
COMMIT;
```

Only use this constraint name if `0080` created it. Validation scans existing rows, so it is a
separate step; review pre-existing orphan values if validation fails. Application rollback can
leave the additive column/FK in place without changing parcel data. This change does not run a
production migration automatically.

Read-only preflight on 2026-10-12 confirmed the configured production database has migrations
through `0078` applied and lacks `charge_agent_user_id`. Both
`0079_pickup_queue_legacy_uniqueness` and `0080_parcel_charge_agent` are pending. Production
still has the legacy parcel-only pickup queue unique index alongside the valid daily indexes;
review that earlier repair before invoking the migration runner. No production writes were
performed for this check.

QA covers multi-parcel selections, independent creator/cashier attribution, inactive/wrong-branch/
wrong-company rejection, unchanged payments and amounts, empty selection, failed lookup/retry,
form reset, and legacy NULL requests. Repeat ordinary creation and self-service pricing on web,
desktop, and mobile. Automated booking tests use `CHARGE_AGENT_BOOKING_TEST=1` with a dedicated
local `vipex_charge_agent_booking_test` database in `TEST_DATABASE_URL`. Migration tests use
`CHARGE_AGENT_MIGRATION_TEST_DATABASE_URL` pointing only to an empty local
`vipex_charge_agent_migration_test` database, covering normal migrator registration, preservation,
idempotency, schema drift, FK enforcement, and lock-timeout rollback.
The migration suite also reproduces production's pending `0079` + `0080` batch, checking preserved
parcel/ticket data and complete batch rollback when the new column cannot acquire its lock.

When a staff member enters a second receiver during a call outcome, office pickup, receiver
cashier handover, or rider handover, web and mobile resolve the exact telephone against active
customers in the authenticated company. A match in either the primary or secondary telephone
field links that existing customer to the parcel without creating or changing the customer record.
If no match exists, the server creates a new customer. The form still requires a name and valid
ten-digit telephone before submission. A missing customer-create permission or failed lookup or
creation leaves the parcel outcome/handover unsaved. This does not change ordinary customer
creation, which still rejects duplicate telephones. QA: enter a phone already saved as a primary
number and then as a secondary number, confirm each links the existing ID; enter a new number and
confirm one customer is created; verify a missing permission and invalid phone do not update the
parcel. Repeat the existing-number case on mobile call outcomes.

The web **Call Outcome** dialog also supports **Change Main Receiver** for a sender-requested
replacement. It shows the current main receiver and telephones. After staff enter a valid
ten-digit new telephone, an exact match in the company (primary or secondary telephone) displays
the existing customer's name and links that customer ID. If there is no match, staff enter a name
and the server creates a customer, then associates the new ID with `parcels.receiver_id`. This is
a single-parcel action; bulk outcomes do not change receivers. Saving also applies the selected
call outcome. It clears the former second-receiver and handover-card fields so an earlier handover
authorization cannot carry over to the new main receiver. SMS/email options remain available for
the single outcome and use the newly linked main receiver. The server requires the parcel to remain
assigned to the call agent, at their destination branch, and in an outcome-eligible state. A
missing or invalid telephone, missing name for a new customer, same existing main receiver, or
concurrent parcel change rejects the association. QA: lookup a number stored as primary and as
secondary, create a new receiver, save each outcome, check the updated receiver ID and notification
target, then verify wrong-branch, reassigned, stale, and duplicate-main-receiver requests fail.

Call-center assignment and shelf-picker updates are separate permission-gated workflows. Their pages
require `CanReadCallCenterAssignment` and `CanReadShelfPickerUpdate`; mutations require
`CanAssignCallCenterParcels` and `CanUpdateParcelShelfPicker`; adding, changing, or removing a
second receiver on either page requires `CanManageParcelSecondReceiver`. Shelf-picker assignment is stored on
the parcel in `parcels.shelf_picker_staff_id`, so it remains available when pickup queues are
disabled. When an active pickup queue exists, the server mirrors the assignment to
`pickup_queues.picker_staff_id` for compatibility. The server enforces these permissions
independently of sidebar visibility.

### Call-center assignment schema compatibility

The application stores call-center assignments in the nullable
`public.parcels.call_center_assigned_to_user_id varchar(25)` column referencing `public.users(id)`.
The field previously existed in TypeScript without a committed migration, so a database built
only from migrations could raise **column does not exist** when searching or creating parcels.
Migration `0078_parcel_call_center_assignment` repairs that omission. It preserves existing
assignments and equivalent foreign keys, including differently named constraints. It does not
change parcel rows, statuses, payment amounts, storage accruals or historical staff assignments.
When the column is absent, existing parcels receive NULL (unassigned); there is no staff backfill.

The repair checks column type/nullability and foreign-key compatibility before proceeding.
Unexpected definitions fail for manual review rather than replacing them. An aligned database
performs no ALTER TABLE. A missing column/FK requires a brief table lock; the migration has a
3-second lock timeout and 15-second statement timeout, and failure rolls back the transaction.
New foreign keys use `NOT VALID` to enforce new writes without scanning old parcel rows while
the ALTER lock is held. After migration commits, validate a newly created constraint separately:

```sql
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '60s';
ALTER TABLE public.parcels
  VALIDATE CONSTRAINT parcels_call_center_assigned_to_user_id_users_id_fk;
COMMIT;
```

Run this validation only when that constraint was newly created. Existing equivalent validated
constraints retain their names and validation state. Validation failure can indicate pre-existing
orphan staff IDs; review those records instead of deleting assignments automatically. `NOT VALID`
does not defer checking new assignments. Validation scans existing rows, so schedule it separately
and retry after lock contention or a statement timeout.

Read-only preflight: `bun run scripts/check-parcel-assignment-schema.ts`. It uses `CHECK_DATABASE_URL`
or `.env`/environment `DATABASE_URL`, connects with read-only transactions, and reports database
identity/search path, parcel schemas, required column definitions, FK validation state and pending
migration tags. It does not apply migrations, create databases, or print credentials/customer data.
`CHECK_DATABASE_URL` can point to another environment without changing the application's settings.
The production check on 2026-10-08 found the column and its validated FK already present, with
migrations through `0077` applied. The configured local `vipex_test` database lacked this column;
it also had `0077` pending. Production was not modified during this check. An error still occurring
on another server requires checking that server's actual database/schema before applying a repair.

Migration QA (`tests/server/parcel-call-center-assignment-migration.spec.ts`) uses a dedicated
empty local `vipex_call_center_migration_test` database via `MIGRATION_TEST_DATABASE_URL`.
It covers missing-column repair, preserved parcel/payment data and assignments, repeated runs,
equivalent validated FK preservation, concurrent writes on an aligned schema, lock-timeout
rollback, incompatible types/conflicting FKs, and deferred validation of pre-existing orphans.
These shared database rules affect web, desktop, mobile and backend jobs; no new permission,
route or API payload is introduced.

### Shelf pickup reassignment

Pickup ticket history follows daily uniqueness: one active ticket per parcel and queue date,
and one queue number per branch/location/date. Ended tickets and tickets on different dates can
share a parcel. The legacy lifetime key `pickup_queues_parcel_uq` conflicts with this behavior
and causes duplicate-key failures in the reassignment history tests. Migration `0011` originally
removed it, but some databases retained it after their migration ledger advanced.

Forward repair `0079_pickup_queue_legacy_uniqueness` removes only that obsolete key. It first
checks that the legacy key has the expected parcel-only definition and that both replacement
daily unique indexes are valid, ready and have compatible columns/predicates. Missing or
incompatible replacements stop the migration without relaxing uniqueness. It preserves all
ticket rows and replacement index identities; it does not recreate indexes or change parcel,
payment or delivery data. Dependent foreign keys cause an error rather than being removed.
The repair uses a 3-second lock timeout and 15-second statement timeout, with atomic rollback.
An already aligned database makes no change and takes no queue table lock. Read-only preflight
`scripts/check-parcel-assignment-schema.ts` now includes pickup queue index definitions.

QA: `tests/server/pickup-queue-uniqueness-migration.spec.ts` covers history preservation,
repeated runs, both retained daily protections, missing/wrong replacement definitions,
lock-timeout rollback, and constraint-backed/standalone legacy indexes. Reassignment fixtures
use midnight UTC queue dates and increasing ticket numbers so they obey daily queue uniqueness.
Run `bun run migrate:test`, then `bun run test:prepush`; do not skip the hook or remove uniqueness
from tests to hide the failure. Production repair requires verifying that environment's current
indexes; applying this migration to the local test database does not update production.

**Pickup & Collection → Reassign Shelf Pickup** opens the separate page at
`/parcels/shelf-pickup-reassignment`. It requires the existing
`CanUpdateParcelShelfPicker` permission; `CanReadShelfPickerUpdate` alone does not allow
reassignment. Shelf Picker Update now offers **Assign Shelf Picker** for unassigned parcels and
**Reassign Shelf Pickup** for assigned parcels. Reassignment opens the dedicated page. Assigned
pickers in Waiting for Pickup and Receiver Cashier have a permission-gated link to that page;
unsaved handover/payment forms are not submitted by following it.

The page lists only assigned, undeleted parcels awaiting pickup at the signed-in user's
company and destination branch, including both paid and to-be-paid parcels. Users can search
booking/tracking codes, names and telephones, and paginate the results. A legacy assignment from
the latest active pickup ticket is included when the parcel itself has no picker; ended tickets
alone do not make a parcel eligible. Only one row per parcel appears in this page's results,
even when older tickets exist. Selecting a parcel shows its current picker and an inline form for
choosing an active replacement. Staff must belong to the same company and branch and, when the
operator has a location, that location. An operator without a location can select active branch
staff. The currently assigned staff cannot be saved as a new reassignment. Staff/list load failures
show a retry action; typing a search does not fetch until Search is pressed.

Saving changes the parcel picker and all active pickup tickets in one transaction. Ended tickets,
queue numbers/codes, parcel status, payments and delivery confirmation are preserved. Each
successful change records the acting user, previous/new picker IDs, affected active ticket IDs,
and timestamp in parcel audit history. An audit failure rolls back the assignment. A duplicate
save of the current assignment makes no further change or audit event. The page sends the picker
shown when selecting the parcel as `expectedPickerStaffId`; if another user changes it first,
the server returns 409 and the user must select it again from refreshed results. Delivered,
confirmed, deleted or wrong-branch parcels cannot be reassigned.

This page is available in web and Electron desktop. Mobile has no dedicated reassignment screen;
the shared endpoint now enforces these server checks for every client. No new database migration
or permission key is required. Existing integrations can omit the optional expected picker for
compatibility, but still require company/branch/staff validation. QA is covered by
`shelf-pickup-reassignment.service.spec.ts` and `.routes.spec.ts`: parcel/ticket synchronization,
ended-ticket preservation, no-queue and legacy assignments, stale/concurrent updates, audit
rollback, inactive/wrong-location/wrong-branch staff, delivered/deleted parcels, read-only denial,
permission-only page/API access, and duplicate-free scoped search. Manual QA: open the sidebar
page and each handover link, submit searches, select a replacement, save, then verify the current
picker in Shelf Picker Update, Waiting for Pickup and Receiver Cashier.

Client route registration is verified by `tests/utils/client-page-routes.spec.ts` for this page
and all four storage clearance pages. Web development and builds regenerate the router
automatically; see [Client Applications](CLIENT_APPLICATIONS.md#web-application). A missing route
in an older bundle requires rebuilding and serving the updated web application.

The Call Center Assignment and Shelf Picker Update tables show a Payment column and legend: green
is **Paid**, amber is **To Be Paid**, and blue is **Partial**. A Paid parcel shows only its paid
amount, a To Be Paid parcel shows only its balance due, and a Partial parcel shows both. The
indicator is informational and does not change assignment behavior.

Shelf Picker Update lists unassigned parcels first across the full paginated result. Its existing
date column shows **Created** from the parcel creation timestamp and **Received** from its recorded
receipt timestamp in the same cell; missing or invalid timestamps show `-`. This display does not
change assignment order. Assigned parcels follow.
Within each group, branches using pickup queues retain queue-number order when
there is no search; other results retain creation order. The server considers both the parcel's
stored shelf-picker assignment and a legacy pickup-queue assignment when determining whether a
parcel is assigned. A failed list request leaves the current table error visible and does not
change any assignment. QA: check Paid, To Be Paid, and Partial rows for the correct amount lines;
assign a picker to a parcel on page one, refresh, and verify that it moves below all unassigned
rows, including those on later pages; repeat on a branch with pickup queues enabled.
Verify both date lines for a newly received parcel and the `-` fallback for a legacy row without a
receipt timestamp.

On **Shelf Picker Update**, typing in the search field changes only the draft text; it no longer
fetches parcels or staff on each keystroke. Pressing **Search** commits the trimmed term and
loads the matching parcel list. Pagination keeps that submitted term, and pressing **Search**
again with the same term refreshes the list. The branch staff options load once per signed-in
session/branch change, not on every list refresh. A staff-option failure displays an error toast
without suppressing an otherwise successful parcel list. This affects web and Electron desktop;
mobile uses its own screens. QA: type a long query and verify zero requests until submit, then
one parcel-list request; paginate and verify the term persists without another staff-directory
request; submit the same term to refresh, and verify list and staff failures are independent.

Call Center Assignment shows sender and receiver names with every available telephone, payment
status and applicable balances, parcel details, creation and received date/time together in the
existing date column, and the current assignee. Invalid or missing timestamps show `-`.
Unassigned parcels appear before assigned parcels across the full paginated result. Within each
group, the newest effective received date is first; creation time is the fallback for legacy rows
without a received timestamp. Paid rows omit a zero To be paid line, To Be Paid rows omit a zero
Paid line, and Partial rows show both balances.
Waiting for Pickup (Awaiting Pickup parcels) and Receiver Cashier also show **Created** and
**Received** together in their existing date column. Each uses the parcel's `createdAt` and
`receivedAt` from the current list response; no new endpoint or sort order is introduced.
QA: compare Created on all four pages to the parcel record, confirm Received is unchanged, and
verify a missing receipt timestamp displays `-` without affecting sorting or actions.

Shelf Picker Update and Call Center Assignment (sidebar **Parcel Assignment**) also show a
**Content** column with the parcel content recorded at creation (`-` when empty), next to
**Details**. Under the receiver, a row with a second receiver shows `2nd: <name> (<telephone>)`.

Both pages let staff add, change, or remove a parcel's second receiver without recording a call
outcome. This requires the dedicated `CanManageParcelSecondReceiver` permission (group
Deliveries); it is not granted to any role automatically, so an administrator must add it to the
roles that need it. Without it the action is hidden and the server returns 403. Shelf Picker
Update offers **Add Second Receiver** / **Change Second Receiver** in the row action menu; Parcel
Assignment shows an **Add 2nd Receiver** / **Change 2nd Receiver** button beside Assign. The
action appears only for parcels in Arrived at Destination, Customer Contacted, Returned to Office,
Awaiting Pickup, or Home Delivery Requested; parcels with a rider, delivered, or returning to
source do not offer it.

The dialog requires a name and a ten-digit telephone that differs from the main receiver's, and is
prefilled with the current second receiver when one exists. The telephone is resolved like other
second-receiver entries: an existing company customer with that primary or secondary telephone is
linked as-is (its name is not changed); otherwise a new customer is created. When a second
receiver exists, **Remove Second Receiver** asks for confirmation and then clears it, leaving only
the main receiver able to collect. Adding, replacing, or removing clears second-receiver ID card
details and expires any pickup OTP or unused OTP verification issued for the previous second
receiver; the main receiver, status, call-center call state, and assignments are unchanged. Audit
events `PARCEL_SECOND_RECEIVER_SET` and `PARCEL_SECOND_RECEIVER_REMOVED` are recorded. Saving the
same customer again, or removing when there is none, changes nothing. These pages send no SMS or
email; customer notifications remain available only from the call outcome. The server rejects
parcels outside the staff member's company and destination branch. Web only; mobile has no
equivalent page.

QA: with a role lacking `CanManageParcelSecondReceiver`, confirm neither page shows the action;
grant it and add a second receiver on each page and confirm it appears under the receiver and in
Waiting for Pickup with no SMS sent; change it and confirm the old second receiver's OTP no longer
verifies; remove it, confirm the prompt, and verify the row no longer shows a second receiver;
enter an existing customer's telephone and confirm that customer is linked unchanged; enter the
main receiver's telephone and a nine-digit number and confirm both are rejected; confirm a
dispatched parcel offers no action and a direct request for another branch's parcel returns 404.

All Parcels Super Search uses the same payment legend and places the matching colored indicator in
each Payment cell. A fully paid parcel shows only its **Paid** amount; a fully unpaid parcel shows
only its **To be paid** amount; a partial parcel shows both amounts. Zero rows for the inapplicable
payment side are omitted, while the declared parcel value remains visible for every result.
For parcels currently delivered by office or rider, the Payment cell also shows who paid the
principal: a blue `S` badge for a sender payment, a red `R` badge for a receiver payment, or both
badges when both contributed. These badges use non-voided principal payment records, not the
original payment plan; delivery fees, storage charges, and voided payments do not determine them.
If a delivered parcel has no recorded principal payer, the cell shows `Paid by: -`. Non-delivered
and returned parcels do not show payer badges. Badge titles spell out Sender and Receiver.

In Super Search, **Delivered D&T** shows the delivery record's completion time when available.
Office handovers and rider-given parcels may have no delivery completion record, so the page
uses the parcel's confirmation time for those delivered statuses. The same value appears in
parcel details. Non-delivered, returned, or reversed parcels show no delivered time, even if an
older delivery record retains a timestamp. If neither timestamp exists, the page shows `-`
rather than inventing a delivery time. QA: check office handover, rider handover before cashier
finalization, completed home delivery, a reversed/returned parcel, and a legacy delivered parcel
without either timestamp.

Super Search shows the rider for home-delivery statuses directly under the parcel status: under
the status badge in the web table, under the status in the shared details view's Overview tab
(every page; see [Parcel details and history](PARCEL_DETAILS.md)), under the status chip on mobile
result cards, and as the first row under the Parcel status in mobile details. **Created By** (the
parcel's creator) is shown under the status for every parcel in the same places. The rider is read
from the parcel's delivery record (`deliveries.rider_user_id`):

| Parcel status                                          | Label                   |
| ------------------------------------------------------ | ----------------------- |
| Home Delivery Requested, Address Collected, Dispatched | Assigned Rider          |
| Rider Given Parcel To Customer, Delivered at Home      | D By (web), By (mobile) |
| Returned by Rider                                      | Returned By             |

If the delivery record has no rider, the line shows `Not assigned`. Office-delivery and all other
statuses show no rider line. The rider shown is the one currently on the delivery record; if a
delivery was reassigned, only the latest rider is shown (earlier assignments are in the audit
log, not Super Search). QA: search a parcel in each status above and confirm the label and rider
name on web and mobile; search a dispatched parcel with no rider and confirm `Not assigned`;
search an office-delivered parcel and confirm no rider line.

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
- The `callSender` option is available in web and mobile parcel creation and self-service officer
  completion. It follows the parcel into receiving workflows and prints as `CS` on stickers while
  preserving receiver name and phone. Staff must call the sender before receiver handover.

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

The **In Transit (Sending Branch)** table provides independent **Print Sticker** and **Print Receipt**
actions for each outgoing parcel. Sticker copies can be selected before printing. These actions
use the same sticker and A5 receipt templates as the processed-consignment page,
including the parcel's sender/receiver, destination, payment responsibility, and authenticated
cashier name. Printing does not change transit or payment state. QA: print an outgoing sender-paid
parcel, a to-be-paid parcel, and a partial parcel; print each document separately, verify the
selected sticker copy count, and confirm the row remains in transit.

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

The web **In Transit (Receiving Branch)** list has optional Send Date, Source Branch, and
Consignment Number filters. Apply Filters combines them with the destination branch and in-transit
status, the text search, and pagination; Clear Filters removes only these three fields. Send Date
matches the consignment's creation date shown as **Sent** under Booking, using the selected Ghana
calendar day. Source Branch selects a branch in the current company. Consignment Number accepts
the displayed daily serial number or the full consignment code. A parcel without a consignment
cannot match Send Date or Consignment Number. Invalid dates and out-of-scope branches do not change
parcel state; the server rejects invalid date values and returns no rows for branches without
matching parcels. The outgoing list and mobile receiving scan flow do not expose these filters.

QA: Combine all three filters and a text search across multiple pages; verify the total count and
rows agree. Check a leap-day date, a non-existent date, serial and full-code matches, a source
branch with no matches, Clear Filters, and a parcel without a consignment.

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
- The BMS/mNotify integration sends pickup OTP messages with `sms_type: "otp"` and the
  unscheduled JSON boolean `is_schedule: false`. The company's active default SMS provider
  and BMS main-wallet funds are separate from branch OTP toggles and ordinary SMS credits.
- Failed provider dispatch returns HTTP 503 instead of "OTP sent" and expires only the newly
  generated code. Staff can retry; a previous valid code survives a failed forced resend.
  Failed-send dispatch logs retain the diagnostic error. See
  [SMS dispatch diagnostics](NOTIFICATION_HUB_MODULE.md#application-sms-definitions).
- QA: test success, missing provider/configuration, provider rejection, transport exceptions,
  retry and failed forced resend; verify unchanged parcel/payment state and five-minute expiry.
  Automated coverage: `otp-sms-delivery.test.ts`, `sms-provider-payloads.test.ts`.

## Pickup and Last-Mile Delivery

### Customer names retained on parcels

Each parcel keeps the sender, main receiver, and optional second receiver names that were
associated with their customer IDs when the parcel was created. The customer IDs remain linked
for contact and customer-account operations. Editing a customer's profile name later does not
change the names shown on older parcel records, searches, consignments, delivery views,
receipts, or reports. If staff deliberately change a parcel's main or second receiver, the
parcel records the replacement customer's name at that change. Removing a second receiver
clears its stored name. Phone numbers and other customer contact fields still come from the
linked customer record.

#### Correcting a receiver from a parcel

The **Edit** action on incoming in-transit parcels, Waiting for Pickup, Receiver Cashier,
and Shelf Picker Update saves a deliberate receiver-name correction on the selected parcel
and the linked customer in one transaction. The receiver ID stays associated with the same
customer. Other parcels for that customer retain their recorded names, including sender and
second-receiver names. Editing through Customer Management still changes only the customer
profile; it does not rewrite parcel history. Telephone-only edits preserve both the recorded
parcel name and any newer customer profile name. Contact telephone changes remain shared
across parcels because contact fields come from the customer record.

Web and desktop use `POST /v1/shipments/parcels/:id/edit-information`; mobile's incoming
receive-process screen uses the same operation. Parcel details/content changes and supplied
receiver corrections are atomic, including their audit records. The server scopes the parcel
to the authenticated company and destination branch, rejects deleted parcels and a stale
receiver ID, and requires the existing workflow permission plus `CanUpdateCustomers` when
receiver fields are supplied. Invalid/blank names, malformed phones, a duplicate telephone
in either customer phone field, or a database write failure leave the entire edit unsaved.
Details-only edits do not require customer-update permission. No status, payment, receiver
association, second-receiver authorization, or shelf assignment change is part of this operation.

**Deployment requirement:** apply migration `0081_parcel_receiver_name_corrections` before
deploying the new endpoint and clients. It replaces the existing capture function so explicit
main-receiver snapshot corrections can persist, while ordinary parcel updates preserve the
snapshot and receiver-ID changes still capture the new customer's name. It does not backfill
or rewrite historical parcels. The migration has been validated locally. Live verification on
2026-10-13 confirmed migration `0081` in the ledger, an enabled parcel-name trigger, and a
function matching the migration exactly; no migrations remain pending on that verified database.
Session-only synthetic records confirmed that a parcel correction saves both receiver name and
details, other parcel names remain unchanged, and Customer Management renames preserve history.
No real parcel or customer records were changed during verification. Other environments must
apply `0081` before deploying the endpoint. Older clients still using customer-only PATCH calls cannot correct
a parcel's saved name and need the updated web/desktop bundle or mobile build.

If the new endpoint is running before migration `0081`, the old trigger discards the supplied
receiver-name correction. The endpoint returns 409 (`Receiver name correction could not be
saved; contact support`) and rolls back customer, parcel details/content, and audit writes.
This is a database/code rollout mismatch; retrying the same combined edit cannot succeed
until the capture function supports corrections. The read-only
`bun run scripts/check-parcel-assignment-schema.ts` check reports
`receiverNameCorrectionsSupported`, the active name-snapshot trigger, and pending migration tags.
Check the backend's actual database target: a localhost web URL does not imply a local database.
The former UI sent separate `PATCH /shipments/parcels/:id` and `PATCH /customers/:receiverId`
requests; that customer-only write did not correct a populated parcel receiver snapshot.

QA: create two parcels for one receiver, correct the name from one parcel, and confirm only
that parcel and the customer change. Rename again from Customer Management and confirm both
parcels retain their names in lists, detail, receipts, consignments, reports, and name search.
Try a phone-only edit after a customer rename; the profile name must remain unchanged. Repeat
on all four web/desktop edit screens and mobile receiving. Reject missing permissions, another
company/branch, deleted parcels, a changed receiver ID, duplicate primary/secondary phones,
and invalid names/phones. A failed parcel write must roll back customer changes and audits.
Automated coverage is in `tests/server/parcel-information-edit*.spec.ts` and
`tests/utils/parcel-information-edit.spec.ts`. Persistence tests require
`PARCEL_INFORMATION_EDIT_TEST=1` and `TEST_DATABASE_URL` pointing to the empty local
`vipex_parcel_information_edit_test` database; they refuse other database targets.

#### Compact parcel tables

Shelf Picker Update stacks details above content in **Parcel**, and status above the shelf
picker in **Status / Shelf Picker**. Waiting for Pickup and Receiver Cashier combine parties
in **Customer**: receiver name, receiver phone(s), sender name, sender phone(s), in that order.
Multiple phones use `/`. **Route** shows source branch, source location, destination branch,
and destination location. Call-sender and storage-fee indicators, dates, payment amounts, and
actions remain available. These layouts apply to web and desktop; mobile keeps its native cards.
Location/route text wraps within a bounded column across shared data tables and native shared
tables, including report and attendance pages. See [Appearance System](APPEARANCE_SYSTEM.md).
QA: check long multiword and unbroken location names at narrow and wide window sizes, the
four-line party/route ordering, missing names/phones, both phone numbers, shelf assignments,
payment badges, and table actions. Automated layout coverage is in
`tests/utils/parcel-table-layout.spec.tsx`.

Parcel search matches the stored sender, main receiver, and second receiver names, case
insensitively and by partial name, as well as booking/tracking codes and customer phone
numbers. Searching the name recorded on an older parcel returns that parcel after the
customer profile is renamed. A newer name only matches parcels that recorded that name.
If a legacy parcel has a null or blank name snapshot, parcel list, detail, search, rider
delivery, pickup queue, consignment receiving, discrepancy, and report reads use the linked
customer's current name until the snapshot is backfilled. A populated snapshot
always takes precedence, so later customer edits do not change recorded parcel names.
Mobile parcel search, rider, and receiving screens consume these server responses, so this
fallback requires a server deployment but no mobile app update.

Migration `0073_parcel_customer_name_snapshots` adds nullable columns and a trigger in a
short transaction. It does not update historical rows or add a table-wide default. Its
three-second lock timeout makes it fail for retry if the table is busy. The trigger captures
names for new parcels and fills missing names when older parcels are updated. Run
`bun run scripts/backfill-parcel-customer-names.ts --apply` after migration `0073` and before
deploying server code that reads the columns. The script updates at most 500 parcels per
transaction, pauses between batches, and can be rerun after interruption. Running it without
`--apply` checks whether work remains. A customer with a missing, blank, or cross-company
name stops the backfill; correct the data and rerun. Confirm the script reports completion
before deploying the new server. The database columns remain nullable during this rollout,
while the trigger fills names for every new parcel. Earlier names already overwritten in the
customer table cannot be reconstructed; the backfill freezes the names available when each
batch runs. The trigger covers web, mobile, desktop, self-service, and pending-booking flows.

QA: create two parcels for one customer, rename the customer between creations, and verify
each parcel retains its own name in search, detail, consignment print, delivery print, and
reports. Rename the customer again and verify neither parcel changes. Change a parcel's
receiver through the authorized workflow and verify its displayed name switches to the new
receiver while the audit records the change. Verify a customer from another company cannot
be attached to a new parcel. On a production-sized copy, verify migration `0073` completes
without a table-wide update, interrupt and rerun the backfill, then confirm no parcel has a
missing sender, receiver, or applicable second receiver snapshot. Keep the old server running
until the backfill finishes; apply the migration before starting the new server.
Search by each recorded sender, main receiver, and second receiver name, including partial
case-insensitive matches, and confirm the result count matches the displayed rows.
For a legacy parcel with a missing snapshot, verify the linked customer's name appears in
list, detail, mobile rider and receiving screens, and reports, and returns in name search;
after backfill, rename the customer and verify
the parcel keeps the backfilled name.

### Return to source branch

Destination staff with `CanUpdateParcels` can find a parcel in **All Parcels Super Search**,
open its details, and select **Return to Source**. A reason of 5–500 characters is required.
The server checks that the actor belongs to the parcel's destination branch, that the
source and destination differ, and that the parcel is available at the destination.
Eligible statuses are Arrived at Destination, Customer Contacted, Awaiting Pickup,
Home Delivery Requested, Address Collected, Returned to Office, and Discrepancy.
Dispatched parcels must first be returned to the office. Parcels handed to a customer,
deleted parcels, parcels still in transit, repeated returns, and parcels with open
reconciliation cases are rejected without changing status.

The action records status **Return to Source** and audits the reason and branch IDs.
It ends any active pickup queue ticket, stops customer delivery, and removes the parcel
from active destination workflows.
This status records the destination branch's return decision; it does not assert physical
receipt at the source branch. No return consignment or source scan is created. The action
is available on web and desktop through the shared API; mobile displays the status but
has no return action.

Source-branch staff with Parcel Receiving module access and `CanReadParcels` can open
**Parcel Receiving → Returns to Source** to search and page through parcels marked for
return to their branch. They can
review the original parcel details. Staff with `CanReadParcelReconciliation` can select
**Manage Reconciliation** to open the case list searched by booking code; creating,
approving, and executing cases still require their separate permissions and server
eligibility checks. Staff with `CanCreateBookingWithParcels` can select **New Shipment**,
which opens the booking creation page for a separate shipment. The original returned
parcel remains in the list as history. No fields are copied into the new booking and
the list does not confirm physical receipt.

QA: return a parcel from the destination and verify it appears only for its source
branch. Search by booking code, review details, open reconciliation filtered to the
booking, and start a new shipment. Check that users lacking the relevant action
permissions do not see those actions, that pagination works, and that the original
return record remains after creating a new booking. A destination or unrelated branch
must not see the source branch's list.

QA: mark a parcel arrived at its destination, record a reasoned return, and verify the
status and audit entry. Repeat from Awaiting Pickup and Returned to Office. Verify
wrong-branch, in-transit, dispatched, delivered, open-case, and repeat requests fail.
Attempt office pickup and receiver cashier delivery after return; both must fail.

### Editing delivery fees and manually repairing cleared fees

Web and Electron desktop use the same **Edit Delivery Fee** button and dialog on Rider
Returns and Delivery Cashier. Cashiers can also open it inside the finalization dialog. Open
it, review the current configured fee and recorded payment/collection amounts, enter the
confirmed new fee in GHS and a reason, and select **Save Delivery Fee**. Saving changes only
the configured delivery charge; it does not record money received, change the address,
reassign a rider, or move the parcel to another status. Lists and the selected cashier parcel
refresh after saving, and the cashier payment defaults recalculate from the outstanding
balance. Finalization is disabled while parcel details are loading, refreshing, or unavailable.
Mobile has no staff fee-edit dialog; its rider screens read the updated charge on their next
refresh. Riders continue to request a reviewed address/fee change instead of editing directly.

`GET/PATCH /deliveries/dd/:parcelId/fee` requires an active non-rider staff account at the
parcel's company and destination branch, with `CanDispatchForDelivery`, `CanMarkDoorstepCalled`,
or `CanCompleteDoorstepDelivery`. The server derives company, branch, and actor from the
session. Eligible parcel states are Home Delivery Requested, Address Collected, Dispatched,
Returned by Rider, and Rider Given Parcel to Customer, with exactly one active doorstep
record. Missing/deleted or foreign-branch parcels, office delivery mode, completed/pickup or
other ineligible states, an open reconciliation hold, or a pending rider change request block
editing. Resolve the pending request before trying again.

Fees must be finite non-negative values with at most two decimal places, up to GHS 100,000;
a reason of 3–500 trimmed characters is required. The fee cannot fall below either the sum
of non-voided delivery fee payments or the rider's recorded delivery fee collection. The
request includes the fee and delivery update timestamp originally read by the dialog. A stale
value returns 409; use **Reload Fee**, review it, then save again. Updates lock the parcel and
delivery and write `DELIVERY_FEE_UPDATED` with old/new amounts, parcel ID and reason in the
same transaction. Audit failure rolls back the fee. An unchanged fee is a no-op.

Production inspection on 2026-10-10 found 40 zero-fee doorstep records with return history:
20 were still Returned by Rider, 3 awaited cashier finalization, 5 awaited office pickup,
10 were delivered by office, and 2 were delivered at home. These are candidates, not proof
of the original amount; approved fee-change records and rider collection fields contained no
recoverable amount for these candidates. The agreed repair is manual through the app for the
23 eligible active records, using customer/staff-confirmed amounts. No blanket fee or automatic
production mutation was applied. Deploy the fee-preservation fix and edit workflow first so
later returns do not erase restored amounts again. Office pickup does not require a doorstep
fee. Completed home deliveries need the existing supervised delivery-reversal/reconciliation
workflow before any fee correction; this dialog does not reopen them or alter posted payments.

`scripts/delivery-fee-repair/inspect.ts` runs read-only against `PRODUCTION_DATABASE_URL`,
then `MIGRATE_DATABASE_URL`, then `DATABASE_URL`, using the repository environment files.
It prints candidate counts/evidence keys and writes an inspection snapshot to
`/tmp/vipex-cleared-delivery-fees-2026-10-10.json`. The report contains booking/record IDs,
branch, state, current fee and paid fee, not an inferred replacement fee. Keep production
reports out of Git. Inspection does not change deliveries or payments.

QA: restore a zero-fee return to GHS 25, redispatch it, then verify rider and cashier amounts.
Restore a zero fee after rider handover directly from Delivery Cashier and collect it. Repeat
from its finalization dialog and verify refreshed payment defaults. Edit to zero when nothing
has been paid/collected, reject a reduction below paid or collected amounts, reject blank,
negative, excessive and over-precision inputs, require a reason, and verify concurrent edits
cannot overwrite each other. Verify wrong-branch, rider, missing-permission, deleted, office,
completed, pending-change and reconciliation-held cases are blocked. Cancel must save nothing.
Automated coverage: `tests/server/delivery-fee-edit.service.spec.ts` and
`tests/server/rider-return-delivery-fee.service.spec.ts`.

### Rider returns and reprocessing

When an assigned rider returns a dispatched parcel, the rider action sets the parcel to
**Returned by Rider** (`RETURNED_TO_OFFICE`, status 12) and records the delivery return time.
It no longer makes the parcel immediately available for office pickup. The return is atomic:
if either parcel or delivery update fails, neither state changes. A different rider, a parcel
that is no longer dispatched, or a missing delivery is rejected. The configured delivery fee
and address are preserved on return and on single or bulk redispatch/reassignment. The new
rider receives the saved fee and its unpaid balance; the delivery cashier sees the same fee
when finalizing the rider's customer handover. Previous non-voided delivery fee payments reduce
the outstanding amount, so returning a parcel does not create another fee or payment. An
explicit address/fee update still replaces the configured fee. Moving a return to office
pickup sets the active delivery fee to zero and preserves its previous value in audit history;
the doorstep fee is excluded from office settlement.
This applies to web and desktop cashiers and web/mobile riders through the shared backend.
Fees already erased by the previous return behavior are not automatically restored: the
old return audit did not record their amount. Staff confirm and restore the amount through **Edit Delivery Fee** on Rider Returns or
Delivery Cashier; address collection remains another option before dispatch. Do not infer
the original fee from principal charges or rider collections.
Return and reprocessing status changes are recorded in parcel audit history.

### Returning home delivery parcels to main-office pickup

Web and desktop use the same **Return to Pickup** action from Home Delivery Address
Collection, Home Delivery Dispatch and Delivery Cashier. Rider Returns retains its
**Move to Pickup** label and uses the same operation. A rider handover mistakenly marked
**Rider Given Parcel to Customer** can be returned by the delivery cashier before cashier
finalization, including cases like booking `KO3567556U`. This is a software workflow;
that specific booking has not been modified as part of this change.

Success moves the parcel to **Awaiting Pickup** at its existing destination branch and
sets the configured delivery fee to **zero**. It leaves the principal transport charge,
to-be-paid amount and recorded payments unchanged. Any outstanding principal is handled
by **Receiver Cashier** when the customer collects the parcel; this action does not collect
money or mark the outstanding principal paid. Normal pickup readiness, storage charges,
shelf-picker and receiver-verification requirements still apply.

The action clears parcel/delivery handover confirmation timestamps and actors, the active
rider completion timestamp, signature and declared rider collection fields. The previous
handover, delivery fee and declared amounts are retained in an audit snapshot committed in
the same transaction. The delivery retains its address and assigned rider as history and is
marked Returned to Office. It disappears from the applicable home-delivery list; both parcel
lists and cached parcel details refresh after success. Existing payments are neither voided
nor refunded. A future home-delivery request needs its delivery fee configured again.

The backend derives company and destination branch from the authenticated account and
accepts only active branch staff. Riders cannot use this staff correction. Permissions are
checked against the locked parcel state: `CanMarkDoorstepCalled` for Home Delivery Requested,
`CanDispatchForDelivery` for Address Collected or a completed rider return, and
`CanCompleteDoorstepDelivery` for an unfinalized rider handover. Wrong-company/branch,
missing or deleted parcels are hidden; invalid, already-picked-up, dispatched, returned-to-source
or finalized states are rejected. A completed delivery cannot be corrected through this action;
use the existing reversal workflow first. The old rider-return pickup endpoint delegates to
this implementation while retaining its Returned to Office status requirement. Mobile has no
new staff action; its rider return workflow continues to record returns for staff processing.

QA: exercise all four page actions and verify Awaiting Pickup, zero delivery fee, unchanged
principal/to-be-paid amount, payment history and address. For an unfinalized mistaken handover,
verify confirmation fields are cleared and its original signature/fee/declared collection are
in audit history. Confirm Receiver Cashier still collects outstanding principal at pickup.
Reject missing stage permission, rider accounts, foreign/deleted parcels, completed deliveries
and repeated requests. Race cashier finalization with return and verify exactly one succeeds.
Automated coverage: `home-delivery-pickup.rules.test.ts`,
`tests/server/home-delivery-pickup.service.spec.ts` and
`tests/server/rider-return-delivery-fee.service.spec.ts`.

Staff with `CanDispatchForDelivery` use **Last Mile Delivery → Rider Returns** to search and
page through returns at their own company's destination branch. The list groups each return
into five columns: **Parcel** (booking code, parcel details, parcel content), **Recipient**
(receiver name, telephone, home address), **Payment** (delivery fee, to-be-paid amount, and the
status rendered from the parcel status as `RETURNED_TO_OFFICE`), **Previous Assigned Rider**
(the rider who brought the parcel back, shown as `—` when none), and **Action** (a kebab menu
with **Move to Pickup** and **Redispatch**). Tracking code and return timestamp are no longer
shown as columns; the return time remains in parcel audit history. **Redispatch**
is disabled in the menu, with a hint to select a rider, until a rider is chosen in the **Rider
for redispatch** selector; **Move to Pickup** stays available either way. Staff can move a
returned parcel to **Awaiting Pickup** for office collection, or choose a rider and redispatch
it. Every row has a checkbox, and the header checkbox selects or clears the whole page (showing
a partial state when only some rows are selected). Selecting rows reveals a bulk bar with the
count, **Redispatch N to rider**, and **Clear selection**. The bulk button stays disabled, with
a hint, until a rider is chosen in **Rider for redispatch**; it calls
`POST /deliveries/dd/returned/redispatch-bulk`, which validates the rider once and then applies
the single-parcel redispatch rules to each selected parcel. The response reports partial
success: parcels that are stale, out of scope, missing a completed return, or held by an open
reconciliation case come back in `failed` with a reason and stay selected for review, while a
toast summarises how many were redispatched. Selection clears when the page or search changes.
Successful reprocessing removes the parcel from the active return list; old delivery return
history remains. Address-collected parcels continue to use **Dispatch Parcels**. The return list
is separate from **Returns to Source**, which is a different branch-to-branch decision. Web and
Electron desktop share this page and API; mobile riders can record returns but do not have the
reprocessing page.

QA: return a dispatched parcel from its assigned rider and verify status 12, return time,
removal from the rider's current list, and presence only in the destination branch's return
queue. Set a GHS 25 delivery fee, return and redispatch to a different rider, then hand over
to the customer: verify GHS 25 on the rider list and cashier completion dialog and collect
it successfully. Repeat through bulk redispatch and Dispatch Parcels reassignment, including
a second return. With GHS 10 already paid, verify the fee remains GHS 25 and only GHS 15
is collectable. Verify zero-fee deliveries remain zero, an explicit fee change survives a
later return, and Move to Pickup nullifies the saved doorstep fee for office collection.
Automated coverage: `tests/server/rider-return-delivery-fee.service.spec.ts`.
Verify wrong-rider and repeated returns fail without partial updates or fee changes. Confirm the row
groups show booking code, parcel details, parcel content, receiver name, telephone, home
address, delivery fee, to-be-paid amount, `RETURNED_TO_OFFICE`, and the previous assigned
rider, and that the **Redispatch** menu item is disabled with a rider-selection hint until a
rider is chosen. Move one return
to pickup and redispatch another; both should disappear from the return list and appear in
their corresponding workflows. Verify searching, paging, cross-company/branch isolation,
permission denial, missing rider selection, and a stale return that was already reprocessed.
Bulk: select several returns and confirm the count, the header checkbox partial state, and that
**Redispatch N to rider** stays disabled with a hint until a rider is chosen. Run a bulk
redispatch with one already-reprocessed parcel mixed in, and confirm the eligible parcels leave
the list and are audited and pushed to the rider, while the stale parcel stays selected with a
failure message. Clear selection, then change the page or search and confirm selection resets.

### Reconciliation hold on delivery

A parcel with a requested or approved parcel reconciliation case cannot be handed to a
receiver or marked delivered. The server returns HTTP 409 with “Parcel has an open
reconciliation case; resolve it before delivery” for office pickup, receiver cashier,
rider handover, doorstep completion, and delivery cashier finalization. The generic parcel
status update is subject to the same check. A duplicate-entry case also holds its linked
parcel. Home-delivery dispatch and rider assignment are blocked while the hold is active.
The check runs before collection in combined payment and delivery actions, so a blocked
attempt does not collect money or change delivery state. Execution or rejection of the
case clears the hold; approval alone does not. These rules apply to web, mobile, and
desktop clients through the shared API.

Reconciliation approval and execution remain available before customer handover, including
after the parcel has arrived at its destination branch, while it awaits pickup, and while
it is dispatched to a rider. The case list at a branch shows cases for parcels sent from
or destined for that branch. Creating a case can search parcels on either side of the
branch. A requested case requires an independent approver; an approved case may then be
executed. Office handovers, rider-confirmed handovers, and completed home deliveries
require finance exception handling and cannot enter this ordinary reconciliation workflow.

QA: raise a case for a parcel awaiting office pickup and attempt sender-paid pickup and
receiver cashier payment plus pickup; both must fail with HTTP 409 and no payment or
status change. Repeat for a dispatched parcel at rider handover, and for a parcel at
delivery cashier finalization. Verify both the primary and linked parcel of a duplicate
case are held. Approve the case and verify the hold remains. Execute or reject it and
verify normal delivery is available again when the parcel's other eligibility checks pass.
From the destination branch, find a parcel that originated elsewhere, raise a case,
approve it with a different user, and execute it after arrival but before handover.
Confirm the case appears in both the source and destination branch lists. Repeat with a
parcel awaiting pickup and a dispatched parcel. Completed deliveries must remain ineligible.

Shelf Picker Update offers **Request Delivery** for an Awaiting Pickup parcel. Staff with
`CanUpdateParcelShelfPicker` may use it for a parcel in their own company and destination branch.
The server changes its status to Home Delivery Requested and ends its active pickup queue ticket
in the same transaction. The parcel then leaves Shelf Picker Update and enters the home-delivery
workflow. Missing, deleted, out-of-branch, already confirmed, or no-longer-awaiting-pickup parcels
are rejected without changing status or queue. This web and desktop action is unavailable on the
mobile Shelf Picker screen. QA: request delivery for an active ticket, verify the status and ended
ticket, and confirm the parcel is no longer in the shelf picker list. Retry from a stale row and
with another branch or missing permission; confirm each request fails without changing the parcel.

The Waiting for Pickup and Receiver Cashier parcel tables include a **Received** column sourced from
the parcel's persisted `receivedAt` timestamp. It uses the application's shared date/time format and
shows `-` when a timestamp is unavailable; the display does not alter queue eligibility or payment
behavior.

### Reverse a mistaken delivery confirmation

On the web, **Pickup & Collection → Reverse Delivery Confirmation** lists parcels delivered to a
customer at the signed-in user's branch. Search by booking, tracking, sender, or receiver; choose
**Reverse** and enter a reason of 5–500 characters. This reverses the customer delivery
confirmation; it does not undo branch receipt. The page and API require the dedicated
`CanReverseParcelDelivery` permission. Mobile does not currently expose this correction page.
An administrator must grant this new permission to the appropriate role before staff can use it.

New confirmations save a pre-delivery snapshot on the parcel. Reversal restores that exact parcel
status and confirmation fields, reopens the pickup ticket that was active at confirmation, and
restores the linked delivery record's status, timestamps, and collected total. It voids only
payments created by that confirmation, preserving earlier recipient and sender payments. Credit
charges created by home delivery finalization receive offsetting adjustments; an allocated credit
charge requires finance review and blocks reversal. The parcel's stored to-be-paid principal
balance is recalculated from its charge minus all remaining active principal payments in the same
transaction. The payment badge, list amount, and cashier due then reflect that balance. A
confirmation snapshot is cleared after a successful reversal, allowing a later delivery attempt
to record a fresh one. The parcel's second receiver and ID card fields return to their
pre-delivery values. Older confirmations without a snapshot retain the legacy status fallback: office delivery
returns to **Awaiting Pickup** and home delivery to **Rider Given Parcel to Customer**; their
active recipient payments are voided as before.

Migration `0074_delivery_confirmation_snapshot` adds one nullable JSONB column and a trigger
that captures pre-delivery state for ordinary parcel status updates. It has no backfill or table
rewrite. Its three-second lock timeout makes it fail for retry if the parcels table is busy.
Apply it before deploying server code that records or reads snapshots. The
actor, reason, branch, prior state, and voided-payment count are audited. Missing, deleted,
other-branch, already reversed, or inconsistent home-delivery records are rejected without partial
updates. QA: reverse an office handover with and without a queue ticket, reverse a finalized home
delivery, verify confirmation-created payments are voided and the parcel is to-be-paid again,
verify earlier recipient and sender payments persist, and verify wrong-branch and repeat reversals
fail. Also test an office confirmation from a status other than Awaiting Pickup, home delivery
amount restoration, second-receiver/card restoration, a second confirmation after reversal, and
credit adjustment with and without an allocation. For an already reversed
parcel with a stale stored balance, run the single-parcel, audit-guarded SQL repair in
`scripts/repair-as7749418g-to-be-paid.sql` for booking code `AS7749418G`. Run it with
`bun run scripts/run-repair-as7749418g.ts`; the runner reads `DATABASE_URL` directly from `.env`.
It recalculates the balance from active principal payments and does not void or create payments.
Confirm its final SELECT shows the expected balance and the parcel list badge after refresh.
The script is idempotent and must be run against the intended database only. Notifications already sent
cannot be recalled.

For future stale To Be Paid values, staff with `CanRepairParcelFinancialState` can open
`/parcels/financial-repair`, search by exact booking or tracking code, review the current and
calculated amounts, and apply a reasoned repair. The API scopes access to the user's company and
branch, refuses currently delivered parcels, and recomputes the amount from parcel charge less all
active principal payments. Only this financial field is changed; the repair is recorded in the
parcel audit history. Extend this tool with explicit, separately previewed repair operations when
other repair cases are identified; it does not permit arbitrary status changes or SQL.

Production rollout for the pending parcel migrations: apply migrations `0073` and `0074`, run
`bun run scripts/backfill-parcel-customer-names.ts --apply` to completion, then deploy the new
server. Both migrations have short lock timeouts and leave existing parcel rows untouched.

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

### Delivered receiver receipt reprinting

On web and desktop, **Receiver Cashier → Delivered** searches office-delivered parcels at the
cashier's destination branch. Use the existing tracking, booking, telephone, or receiver-name
search, then select **Action → Reprint Receipt**. Awaiting Pickup remains the default and retains
its outstanding-principal/storage and pickup-queue eligibility rules. The Delivered view removes
those eligibility filters so completed parcels remain searchable after the queue has ended. At
branches without a pickup queue, a search term is required, as in the existing cashier workflow.
Delivered rows show the office confirmation timestamp and offer only receipt reprinting, with no
payment, edit, or handover action.

Printing requires the existing active cashier session. The receipt data endpoint requires
`CanCreateReceiverPayments` and enforces company and destination-branch scope. Parcel search
retains its existing `CanReadParcels` permission. Missing/deleted/out-of-scope parcels, parcels
that are no longer office-delivered, a missing confirmation timestamp, or missing/voided receiver
payments cannot produce a receipt. Doorstep delivery receipts are outside this workflow. Mobile
has no delivered receiver receipt reprint screen.

The duplicate includes recorded non-voided receiver principal and storage payments, the office
handover date, receiver contact details, and a **DUPLICATE** label. It does not collect money,
change delivery state, or calculate new tax. See [Parcel printing](PARCEL_PRINTING.md) for the
existing storage-tax limitation and print failure behavior.

QA: deliver receiver-paid and partially sender-paid parcels, switch to Delivered, and search by
tracking/booking/phone/name. Verify the receipt total includes paid storage, excludes sender
payments and delivery fees, and prints DUPLICATE in browser and desktop output. Test storage-only
collection on a sender-paid parcel, ended pickup queues, pickup-queue-disabled branches,
pagination, and switching back to Awaiting Pickup. Verify unrelated companies/branches, missing
payments, reversed deliveries, and closed cashier sessions cannot print. A cancelled/failed print
must leave payments and delivery state unchanged.

### Parcel search performance

All parcel list pages (Waiting for Pickup, Receiver Cashier, Super Search and the other
`GET /v1/shipments/parcels` consumers) share one list query. In October 2026 a single search at
the busiest branch took 11–26 s in production. Measured with `EXPLAIN ANALYZE`, PostgreSQL JIT
compilation accounted for 5.0 s of a 5.7 s row query and 1.9 s of a 2.4 s count query, because
the payment and storage subqueries inflate cost estimates past `jit_above_cost`. Current
behavior:

- The shared app connection (`src/db/config.ts`) starts every session with `jit=off`. No query
  in the app recovers JIT's compile time; long reports that might benefit should set `jit` per
  transaction.
- The row query and the count query run in parallel.
- The count query joins only the tables its filters reference: customers only when a search
  term is present, consignment tables only for sent-date or consignment-number filters.
  Deliveries and pickup queues are always joined because they are not unique per parcel and the
  row query joins them, so the total stays equal to the rows returned.
- When a filter needs the company's storage policy, the list loads it once and reuses it for the
  storage snapshot.
- Migration `0083_parcel_search_indexes` adds `parcels (company_id, destination_id, status)`
  and `pickup_queues (parcel_id)`, then refreshes statistics for both tables. Before it,
  branch/status lists scanned every branch's parcels in that status, and the pickup-queue join
  had only a partial (open-ticket) index.

Measured on production data (read-only, from a remote client, before the indexes): Awaiting
Pickup and Receiver Cashier searches dropped from 11–26 s to about 1.4 s round trip, with about
0.5 s of database time. Totals matched returned rows for status, cashier-collection, phone, name,
booking, consignment-number, rider-returned, pickup-queue and shelf-picker filters.

The Incoming in-transit **sent date** filter (`sentDate=YYYY-MM-DD`) matches parcels whose active
consignment was created on that UTC calendar day (`>= 00:00` and `< 00:00` next day). Until
October 2026 it failed before reaching the database with `ERR_INVALID_ARG_TYPE`: the day bounds
were `Date` values inside a raw SQL fragment, which the driver rejects. The condition now comes
from `incomingTransitSendDateCondition`, which uses typed column comparisons so the bounds are
sent as ISO strings. Invalid or non-calendar dates still return 400. QA: filter Incoming by a
day with sends and confirm results and total match; filter a day with none and confirm an empty
list; enter an invalid date and confirm the validation message.

QA: search a booking code, phone and name on Waiting for Pickup and Receiver Cashier at a busy
branch and confirm results in under 2 s with an unchanged result count; page through results
and confirm the total and page count stay consistent.

### Storage fee indicator in parcel searches

Every web and mobile parcel search result backed by the parcel list API shows a
`Storage fee · GHS X.XX` indicator when the API reports an accrued storage charge greater than
zero. This includes Super Search, status, receive, transit, pickup, waiting pickup, receiver
cashier, delivery cashier, call-center assignment, shelf-picker update, home-delivery queues,
internal-transfer search, sender payments, uncollected, returned, and mobile Super Search results.
The amount is the current accrued charge from the company ageing policy and received timestamp,
including parcels moved to the aged-warehouse status; it is informational and does not by itself
mean the amount is still outstanding after a payment or waiver. Search rows with no accrued charge
remain unchanged. The indicator is rendered from the search response, so clients do not calculate
or mutate storage fees locally.

QA: search the same parcel in each applicable web result and in mobile Super Search before and
after the grace period. Verify the amber indicator and exact GHS amount match the API response,
including a parcel with a storage payment or waiver. Verify zero-charge, created, in-transit, and
delivered rows do not show a stale indicator, and verify pagination and empty results preserve the
existing search behavior.

### Storage fee clearance reconciliation

Web and desktop provide four separate pages under the **Storage Fee Clearance** menu:

| Page                                | Route                                   | Action permission                            |
| ----------------------------------- | --------------------------------------- | -------------------------------------------- |
| Storage Fee Clearance Requests      | `/parcels/storage-clearances`           | Read, request, approve, or execute clearance |
| Create Storage Fee Clearance        | `/parcels/storage-clearances/new`       | `CanRequestParcelStorageClearance`           |
| Storage Clearance Approvals         | `/parcels/storage-clearances/approvals` | `CanApproveParcelStorageClearance`           |
| Finance Storage Clearance Execution | `/parcels/storage-clearances/execution` | `CanExecuteParcelStorageClearance`           |

The requester enters positive whole days, a required reason (3–1000 characters), and optional
evidence (a link or reference, up to 2000 characters; this feature does not upload attachments).
The form shows current unpaid days, the daily rate, requested amount, and remaining days.
Days above the current unpaid balance are accepted for human review and shown with an advisory.
A parcel without unpaid storage accrual cannot start or resubmit a request. Only one open request
is allowed per parcel, including returned requests. Company and branch scope come from the
signed-in user: agency users can work with their branch's source or destination parcels; head
office can work company-wide. Deleted parcels are excluded.

**Clear all accrued days** snapshots the current unpaid storage balance, after previous valid
storage payments and clearances. Unpaid days are rounded up from outstanding amount / daily
rate; when a payment leaves part of a day unpaid, Clear All clears the exact remaining amount.
Entered days use days × daily rate. A partial clearance reduces the outstanding balance; further
storage continues to accrue normally until the parcel stops being eligible.

Creation moves the request to Pending Approval. An approver reviews it and moves it to Approved
for Finance. The requester cannot approve or execute their own request. Finance has a separate
final execution step. Approval does not change the fee balance. Finance can return an approved
request with a required review reason; only the original requester can edit and resubmit it,
which resets approval and sends it through the flow again. Approvers can reject pending requests;
Finance can reject approved requests. Rejection requires a reason and closes the request. A new
request must be created to start again.

Approval checks that unpaid accrual still exists. Finance execution rechecks the latest balance,
rate, and requested amount. Changed Clear All days/amount, a changed rate, an amount above the
remaining balance, or no remaining accrual returns HTTP 409 without posting. Finance can return
the request for correction; execution never silently increases or reduces the approved amount.
Additional days do not block execution of an affordable partial request.

Execution locks the request and parcel and commits the waiver, accounting posting (when enabled),
executed status, and audit together. Concurrent or repeated execution cannot create a second
waiver. Missing required active accounting accounts (1300 receivable / 5180 waiver expense) or a
posting/audit failure rolls back execution and leaves the request approved. Searching, reviewing,
approving, returning, and reprinting do not deliver a parcel, collect payment, or post a waiver.
History retains actors, timestamps, reasons/notes, evidence, day/amount snapshots, and prior
approval cycles. Receipt reprints retain the documented DUPLICATE behavior.

Migration `0077_parcel_storage_clearance.sql` adds `parcel_storage_clearance_requests` and its
company/status/date, parcel/date, and unique-open-request indexes. Assign the new permissions
before users work with the pages. The former direct storage-waiver API and cashier action are
removed. Mobile has no clearance screens; cashier settlement and storage indicators continue to
use the shared backend balance. This change does not apply the migration to deployed databases.

Automated QA: `parcel-storage-clearance.workflow.spec.ts`, `.finance.spec.ts`, `.routes.spec.ts`,
`.path-access.spec.ts`, and the clearance rules unit tests cover partial/above-balance requests,
no-accrual rejection, company/branch scope, requester separation, return/resubmit/reapproval,
rejection/restart, Clear All after prior clearance, subsequent accrual, stale execution conflicts,
permissions, the removed bypass endpoint, concurrent execution, balanced posting, and rollback
on accounting failure. Manual QA: check each page, search and pagination, evidence links,
current/unpaid/requested/remaining days, returned-request editing, and desktop navigation.

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
status. **Send SMS** is enabled by default, matching the single-parcel Call Outcome form. Staff
may uncheck it to save only the outcomes. One request validates and saves all selected statuses;
only after success, the web client calls the existing parcel-status notification endpoint once
per saved parcel, with at most four requests in flight. Each main customer receives the configured
SMS for that parcel and outcome, including its booking/tracking and branch variables. Bulk outcomes
do not send email, notify second receivers, or change receiver assignments.

A failed batch retains its selection and sends no SMS. Notification failure does not undo saved
outcomes: the dialog closes, selection clears, and the list refreshes after notification attempts.
The result reports sent, failed (including unknown response failures), and skipped counts; missing
customer phone numbers are skipped. Failed/unknown notifications are not automatically retried.
The existing notification-hub module gate, provider settings, templates, permissions, dispatch
history, and audit apply. Mobile and single-parcel workflows retain their existing behavior;
desktop clients using the web page receive the same bulk SMS controls.

Call Center Assignment sets newly assigned arrived, returned, or follow-up parcels to **Awaiting
Pickup** as a provisional customer pickup choice. Assignment and reassignment clear the separate
call marker. An assigned parcel remains in the caller's web and mobile worklist while uncalled,
including when its status is Awaiting Pickup or Home Delivery Requested. The caller may record an
outcome to switch between pickup and home delivery, or choose **Mark as Called** to keep the
current status. A saved call outcome, including a bulk outcome or main-receiver change, records
the call marker; a provisional assignment does not. Address collection and rider dispatch still
leave an uncalled parcel in the caller's list for the mark-only action. Called parcels and parcels
delivered at office or home leave the list. Only the assigned caller at the destination branch may
record the call; repeated calls and changes after dispatch are rejected. QA: assign a parcel and
verify Awaiting Pickup and an uncalled badge; change pickup to home delivery and verify it leaves
the queue as called; assign another parcel and mark it called without changing pickup; complete
an uncalled delivery and verify it leaves the queue; reject a different caller or branch.
Older call-center clients submit a two-field parcel update (`status` 5 or 7 plus
`secondReceiverId`) when saving an outcome. The server routes that exact payload through the
same authorized call recording action, so it sets `callCenterCalledAt` and removes the parcel
from the active calling queue. Other parcel updates retain their normal behavior. QA: save
pickup and delivery outcomes from an older client, verify the call audit and queue removal,
then verify a status-only pickup update does not mark a call.

## Verification Scenarios

Call-center contacted pickup outcomes keep the parcel in **Awaiting Pickup** while
`callCenterCalledAt` records **Customer Contacted** separately. The parcel remains eligible for
pickup or delivery processing; only an explicit home-delivery outcome changes it to
**Home Delivery Requested**. This behavior is shared by web, mobile, bulk outcomes, and main
receiver changes. Migration `0072_contacted_parcels_awaiting_pickup` restores previously
received, unconfirmed, active parcels saved with the legacy **Customer Contacted** status to
**Awaiting Pickup** only when they have no active doorstep delivery or collected address. It leaves
deleted, unreceived, confirmed, and home-delivery parcels untouched; payment and
OTP checks still apply at handover. The Call Outcome queue lists only parcels with no
`callCenterCalledAt` value, regardless of their pickup or home-delivery status; recording the call
time removes a parcel from that queue. Verify a previously contacted, fully paid parcel can be found
by booking code in Waiting for Pickup and Shelf Picker Update, and one with an amount due can be
found in Receiver Cashier. Verify an uncalled Awaiting Pickup parcel remains on Call Outcome and
leaves it after marking called. Verify a legacy Customer Contacted parcel with an active doorstep
delivery or saved address retains its status through the migration. Verify an unpaid parcel cannot
be completed without collection.

- Sender-paid, receiver-paid, split, zero-charge, and credit creation.
- Call-center list, single assignment, and bulk assignment failures display the nested API message;
  two authenticated staff behind one public IP have independent rate-limit quotas.
- Call-center assignment lists sender and receiver contacts, payment state, received D&T, unassigned
  rows before assigned rows across pages, and newest received rows first within each group.
- Bulk call outcome success for each of the three statuses, unauthorized request, out-of-scope or
  reassigned parcel, stale status, and concurrent change with no partial updates or notifications.
- Bulk SMS checked and unchecked; each outcome uses its configured single-parcel SMS template.
  Verify one request per selected saved parcel, main customer only, a maximum of four concurrent
  sends, and disabled form controls while sending. Missing phones, disabled notification hub,
  provider rejection, and lost responses show counts without undoing or resubmitting the batch.
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
- Super Search shows blue `S`, red `R`, or both on currently delivered parcels according to
  non-voided sender/receiver principal payments. Check no-payment delivered, pre-delivery,
  returned, voided-only, delivery-fee-only, and split-payment cases; none may claim a payer that
  the active principal payment records do not support.
- Super Search shows Assigned Rider / D By (mobile: By) / Returned By for home-delivery statuses on web
  and mobile, `Not assigned` when the delivery record has no rider, and nothing for other statuses.
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

The web Call Outcome queue uses server-side pagination. The selected rows-per-page value is sent as
`pageSize` to the parcel search endpoint, and page changes send the corresponding `page` value;
`meta.totalRecords` and `meta.totalPages` drive the controls. Search resets to the first page, so
assigned calls beyond the first 20 rows remain reachable. QA: with more than 20 uncalled parcels
assigned to one call agent, select 50 rows per page and verify up to 50 rows load, then navigate to
the next page and verify the next server page is returned.

The Call Outcome queue also supports a server-side Payment type filter: All, Paid, To Be Paid, and
Partial. The filter uses the parcel charge and outstanding planned-to-be-paid amount, and applies
before pagination so totals and page navigation remain accurate. QA: verify each payment type across
multiple pages, including a split-payment parcel under Partial.
