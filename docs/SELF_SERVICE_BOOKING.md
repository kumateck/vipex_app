# Self-Service Booking

## Purpose

Self-service booking lets a customer prepare parcel details at a branch without granting access to the staff application. A staff member later claims, completes, prices, settles, and prints the draft through the authenticated workflow.

## Entry and Session

A branch QR code or self-service link identifies the branch. The public client creates a short-lived branch-bound session through:

- `POST /v1/self-service/sessions`

Subsequent public requests send the issued value in the `x-self-service-session` header. The session is not an employee login and must not authorize staff routes.

### Session lifetime and recovery

One QR scan allows up to **10 successful bookings**, including the first booking, within the
original 15-minute server deadline. Each token can submit only one draft. On success, bookings
1–9 return a replacement one-use token for **New booking**; booking 10 returns no continuation
and asks the customer to scan again. New booking opens a completely blank form and displays
the completed count (for example, “3 of 10”). The server validates
the branch and expiry on every public API request; consuming the token uses an atomic database
delete in the draft-creation transaction, so only one concurrent submission may proceed.
Draft persistence, token consumption and continuation creation commit or roll back together.
A failed draft save leaves the token available for retry and does not advance the booking count.
Each continuation retains its original issue/expiry timestamps; starting another form never
extends the 15-minute window. The public form does not compare expiry
against the phone's wall clock or expire itself on a phone-based timer. Restored sessions are
revalidated with the server, including after refreshing the page; a device date/time set ahead
or behind cannot immediately expire a newly issued session. Expiry is reported when the server
validates the next request, rather than automatically removing the form after a local timer.

The printed QR continues to include `?scan=1`, which explicitly starts a fresh session. A direct
or older branch link without that flag starts a session if no usable token is stored. An expired,
used or missing server token shows **Start a new booking**, with a **Start new booking** button;
the customer does not need to scan again. This begins a fresh form, not a second submission of
the previous form. Successful submission stores the continuation token when available. After
booking 10 it clears the token and stores a branch-specific exhausted-scan marker, so refreshing
shows the rescan message with no new-booking/retry button. Opening the QR's `?scan=1` entry clears
that marker and starts a fresh batch. Browser storage being disabled does not block the current
page's in-memory continuation, but persistence across reloads is unavailable. These are public
static QR links: the service can bound each token chain, but cannot distinguish a camera scan
from someone reopening that same scan URL.
Creation failures retain the server message and a **Try again** action, including rate limiting
(30 session starts per forwarded IP per 15 minutes); recovery does not bypass that limit.
Draft submission abuse quotas are 50 attempts per sender telephone and 200 per forwarded IP
per 24 hours, allowing a full ten-booking batch from the same sender. Rescanning does not reset
these separate daily quotas; failures after acquiring a submission token may count toward them.

Migration `0087_self_service_sessions` creates `self_service_sessions` with a SHA-256-derived
token key, branch/timestamp/booking-number payload and indexed `expires_at`. The same table
stores expiring submission receipts under separate hashed keys, containing draft/result metadata
and a normalized request fingerprint, without raw customer contacts or continuation tokens. Raw tokens and customer details are
not stored in this table. Sessions now use PostgreSQL independently of the optional Redis cache,
so backend restarts and requests reaching another instance retain them. Expired rows are removed
by the existing five-minute background sweep; request-time expiry still applies if the sweep is
delayed. General cache/rate limiting uses `new Bun.RedisClient(REDIS_URL)` when configured, with
no silent memory fallback for an unsupported Redis runtime. Without Redis, rate-limit counters
remain process-local and reset on restart; configure shared Redis for multi-instance quotas.

Deploy order: review pending migrations, apply `0087` before the new backend, replace/drain all
old backend workers, then deploy the web client. No production migration has been applied by this change.
Older cache-only tokens are not migrated and require one new session after deployment; older
frontends may still instruct users to rescan, so deploy the web update too. A missing table or
database outage must fail session creation visibly, never switch back to process memory.

Production troubleshooting: PostgreSQL `42P01` for `self_service_sessions` during the expiry
sweep means the table was unavailable to that connection at the logged time. Check fresh logs
and inspect `current_database()`, `current_schema()` and
`to_regclass('public.self_service_sessions')` using the **running container's** `DATABASE_URL`.
Use a read-only diagnostic connection and never print the connection URL. Compare the actual
runtime database with the migration target; a migration recorded in a different database does
not repair this connection. If the table is already present, confirm a fresh scan/sweep before
reapplying migrations. If absent, review pending migrations and apply the vetted runner to the
correct database; do not hand-create a partial table or silently fall back to process memory.
`discord-alert-failed` with HTTP 404 is a separate failed alert-delivery response, not evidence
that the session table is still missing or that the parcel-search request failed for this reason.
QA: verify a missing-table failure, migration to the intended runtime database, a new successful
QR session and a successful expiry sweep; compare log timestamps when reviewing older failures.

When the web application runs through Vite on `localhost`, the printable QR code replaces the
loopback hostname with the development machine's detected LAN IPv4 address while preserving the web
port. This lets a phone on the same network open the local self-service page. Set
`VITE_DEV_HOST_IP` when automatic interface selection picks the wrong address. Production and
already network-addressed origins remain unchanged.

## Public Capabilities

| Endpoint area   | Capability                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| Branch          | Read the branch identity needed for the booking screen.                                                       |
| Customer lookup | Find an exact phone match and return only the limited customer identity required by the form.                 |
| Destinations    | List allowed branch and location destinations.                                                                |
| Draft creation  | Submit sender, receiver, destination, contents, value, call-sender preference, and explicit terms acceptance. |

Public responses must minimize personal data. Phone lookup must not expose a customer directory or fuzzy-search results.

For a destination branch, the public form automatically selects its first active receiving
location and does not let the customer change it (the location-options API orders locations by
name, then ID). The server defaults an omitted location to that first location and rejects a
different location even if a client is modified. Branches with no receiving locations cannot
complete the required destination step. This keeps customer self-service location choice to one
predictable pickup point.

## Draft Data

A draft can contain:

- Sender identity and contact details.
- Receiver identity and contact details.
- Destination branch or location.
- Parcel description, quantity, value, and other supported booking details.
- The `callSender` operational instruction (**CS — Call Sender before deliver to Receiver**).
  Customers do not choose CS on the public form. New public drafts are always stored with
  `callSender = false`; the completing officer sets CS on the **Self-Service Bookings** completion
  form. A `callSender` value sent by an older cached public client is accepted but ignored. CS keeps
  the receiver's name and telephone on the booking and sticker. It instructs staff to call the
  sender before handover; it does not replace the receiver contact or block receiving.
- The accepted terms version and server-recorded acceptance time.
- Branch and session attribution.
- Creation and expiry timestamps.

The draft is not a parcel, tracking number, payment, or completed booking until an authorized agent completes it.

## Terms and Conditions Consent

The review stage shows a required, unticked consent checkbox. The full courier-service terms remain
inside a scrollable dialog and open only when the customer taps **Terms & Conditions**. The customer
must explicitly tick the checkbox before **Confirm Parcel** can submit the draft.

The server rejects omitted, false, or outdated consent even if browser validation is bypassed. Every
accepted draft records terms version `2026-08-29` and a server-generated acceptance timestamp. The
terms cover mandatory inspection, prohibited items, declared-value liability, storage charges,
courier charges and fragile handling, sender-only claims, force majeure, data protection, sender
declaration, and identification requirements for collection by receivers or third parties.

## Agent Workflow

Authenticated agents use permission-controlled routes to:

1. List available self-service drafts.
2. Open a draft and inspect its submitted details.
3. Claim it to reserve the draft in the staff queue.
4. Confirm or add operational details and calculate the charge.
   The completing officer can change the draft's pickup location to any active receiving location
   at the destination branch while entering the charge. The web form shows the location selector
   with destination details; mobile shows it beside the charge. Changing the destination branch
   clears the old selection and auto-selects a sole receiving location. With several options,
   staff must select a valid location. Pickup location is required on web, desktop and mobile
   completion; loading, failed/empty location lists, and stale/invalid choices block completion.
   The web Complete Booking button and submit handler both enforce this requirement. Failed
   location lookups offer **Retry pickup locations**. Completion requests always send the
   selected location ID, never an empty or NULL fallback.
   Select **Agent who charged the parcel** from active staff at the source branch. This is an
   explicit required selection on web, desktop, and mobile; it may differ from the completing
   officer. The resulting parcel stores `chargeAgentUserId`, separate from `createdBy` and
   `processedBy`. The public draft form does not select a staff agent.
   The officer ticks the CS checkbox (web) or switch (mobile) while entering the charge when the
   sender asked to be called before handover; it starts unticked for new drafts. Drafts submitted
   before customer CS was removed may still start ticked. Omitted CS on older completion clients
   retains the draft value; an explicit `false` clears it.
5. Choose payment responsibility: sender, receiver, or split.
6. Choose settlement such as pay now or approved credit, including supported partial settlement.
7. Complete the draft into the normal parcel workflow.
8. Print the resulting documents or recover through reprint if printing fails.

Charge entry and self-service completion preserve the agent as creator and queue the parcel for
sender-cashier confirmation; sticker printing does not confirm the financial transaction. When
one of two cashiers at the same location confirms a paid, split, or fully To Be Paid parcel,
that cashier's active session owns its report entry, including agent-created bookings. Creator
and charge agent remain separate. No new completion input or client-side session selection is
required. QA: complete on web/mobile, verify the pending parcel is absent from cashier reports,
then confirm as the second cashier and verify only their session includes it. See
[cashier ownership](CASHIER_PAYMENTS_AND_SHIFTS.md#confirmation-owns-the-to-be-paid-report).

Reading drafts uses `CanReadSelfServiceBookings`. Claiming, completing, or cancelling uses `CanCompleteSelfServiceBookings`.

Location QA: selecting a public destination branch automatically selects its first receiving
location (name, then ID), with no customer location choice; a crafted request with another
receiving location is rejected.
Verify branches with no receiving locations cannot submit. On web and mobile, complete a draft
and change its pickup location to another receiving location; confirm the resulting parcel keeps
the staff-selected location. Sending-only locations must never appear or pass validation.

Printing a branch entry QR code uses `CanPrintSelfServiceQrCode`. This permission is listed under
**Branch Network Management** and can be assigned to a Branch Manager without granting branch edit
access. The role also needs `CanReadBranches` to open the branch list and load the selected branch.
For backward compatibility, `CanUpdateBranches` continues to allow printing.

The mobile agent workflow is available from both the navigation drawer and Operations Hub. It supports
listing, inspecting, claiming, and completing drafts with pay-now settlement. Opening an available
draft claims it before the completion form is shown. It supports sender, receiver, and split payment
responsibility. Credit completion remains desktop-only until mobile exposes the same customer credit
eligibility and cashier-session context. See
[Mobile Frontline Workflows](MOBILE_FRONTLINE_WORKFLOWS.md).
Both web and mobile completion forms expose the editable CS choice, prefilled from the stored draft
value (false for drafts created after customer CS was removed).

The web/desktop completion page uses the shared viewport scroll wrapper, so every field and the
**Complete Booking** button remain reachable on short screens. On all clients, **Parcel details**
starts blank and requires the completing officer's own description. The customer's **Contents**
remains separate in the summary and draft editor; editing contents does not replace operational
parcel details already entered. Opening another mobile draft starts a fresh completion form.

`GET /v1/self-service/charge-agent-options` requires `CanCompleteSelfServiceBookings` and returns
only `{ id, fullname }` for active users in the authenticated company and source branch. It does
not require `CanReadUsers`. Completion accepts optional `chargeAgentUserId` for older-client
compatibility: omitted/null values remain unassigned. Supplied IDs must be active and in that
company/branch; invalid selections reject the booking transaction and leave the draft uncompleted.
Current clients require a selection, offer retry after lookup failure, and block completion when
there are no available agents. See [Parcel Operations](PARCEL_OPERATIONS.md#agent-who-charged-the-parcel)
for migration `0080`, deploy order, historical NULL attribution, and production validation.

## Staff Search and Customer Corrections

On web and desktop, **Self-Service Bookings** uses the shared client-mode DataTable with
search, sorting, pagination, horizontal table scrolling and a viewport-height scroll wrapper.
The existing branch-scoped draft list is still loaded as an array; this change does not add
server pagination. Search includes sender/receiver names, both phone numbers, content and
status. Loading, request failure and empty results are distinct states.

The Booking Details editor replaces the former customer-only dialog and hook; the obsolete
customer-only frontend implementation has been removed. The compatibility customer-update API
remains available for older clients.

**View / Edit** opens the **Booking Details** dialog with the submitted sender/receiver names,
primary phone, backup phone, parcel contents and declared value without claiming the draft.
Readers can inspect the dialog; `CanCompleteSelfServiceBookings` enables correction and the
existing Complete action. The completion page also has **Edit Booking Details**, opening the
same dialog. Contents must not be blank and the declared value must be a non-negative number
(commas allowed) before **Save Changes** is enabled. Web saves through
`PATCH /v1/self-service/drafts/:id` without `destinationBranchId`, so the draft destination is
kept; the destination is still chosen on the completion form. Saved corrections refresh the draft
summary, queue and customer caches, and completion uses the corrected contents and value.
Editing preserves an in-progress charge, charge-agent selection, payment responsibility and
destination on the completion form.
The public customer form remains unchanged.

On mobile, **Self-Service Bookings** has a search field above the draft cards. It filters the
already-loaded branch list on the device (no server search) by sender or receiver name
(case-insensitive) and by any sender/receiver primary or backup phone, ignoring spaces and
dashes, so `024 811` finds `0248111128`. A search with no match shows "No self-service bookings
match your search"; an empty branch queue keeps the original empty message.

After opening (and therefore claiming) a draft, a mobile completing agent can tap **Edit booking
details** to correct everything the customer entered: sender and receiver name, phone and backup
phone, destination branch, pickup location, parcel contents and declared value. Destination
options exclude the source branch and head office; changing the branch clears the location. The
form validates names, ten-digit phones, a destination branch and receiving pickup location, non-blank contents and a
non-negative value before enabling **Save booking details**. Saving refreshes the completion
summary and queue; charge, charge agent, CS and payment choices already entered on the
completion form are kept. The CS switch remains on the completion form.

`PATCH /v1/self-service/drafts/:id/customers` accepts `sender` and `receiver` objects
(`fullname`, `phone`, optional/null `phone2`) plus the currently displayed `expectedUpdatedAt`.
Names are trimmed and must contain 1–255 characters. Phone separators are removed and
primary/filled backup numbers must contain exactly ten digits. Blank backup numbers become
NULL. Corrections are restricted to unexpired Pending/Claimed drafts in the authenticated
company and branch; another officer's claim, a stale timestamp, or a completed/cancelled
draft is rejected. The same main number must have consistent sender/receiver details.

An unchanged contact retains its customer link. A changed primary number is resolved against
active customers in the same company; a new number detaches the previous customer and is
resolved/created during normal completion. Existing matching customer profile corrections
also require `CanUpdateCustomers` and update that customer's name/phone information. Numbers
matching different customers are rejected. Draft and saved-profile changes, including audit
records, commit or roll back together. There is no payment or parcel creation during editing.

`PATCH /v1/self-service/drafts/:id` is the full draft correction used by mobile and web. It takes the same
`sender`, `receiver` and `expectedUpdatedAt` fields with the same contact rules, plus required
optional `destinationBranchId`, optional/null `destinationLocationId`, `parcelContent` (trimmed, 1–255
characters) and `parcelValueCedis` (number or numeric string, commas allowed, not negative,
stored as pesewas). The destination is re-validated like a public submission: same company, not
the draft's source branch, not head office, and any location must be a receiving location of
that branch. When `destinationBranchId` is omitted (web), the draft destination is kept and not
re-validated. Contacts, destination, parcel fields and the audit record (previous values for all
edited fields) commit together. Completion then uses the corrected draft contents and value.
Historical parcel name snapshots retain their existing behavior.

QA: search large queues and both phone fields; scroll and paginate; inspect without completion
permission; correct new and saved contacts; verify customer-update permission denial rolls back
all changes; change a primary number without rewriting the old profile; test invalid phones,
foreign/expired/completed drafts, another officer's claim, conflicting phone ownership and
stale edits. Save contacts after entering pricing and verify those fields stay filled. Complete
and confirm the corrected contacts are attached to the new parcel.
Coverage: `draft-customer.rules.test.ts`, `self-service-draft-customer.service.spec.ts`.
The existing completion-orchestration concurrency limitation below remains unchanged.

## Draft States

| State     | Meaning                                                      |
| --------- | ------------------------------------------------------------ |
| Available | Submitted and ready for an agent to claim.                   |
| Claimed   | Reserved to an authenticated agent.                          |
| Completed | Converted into the authoritative booking and parcel records. |
| Cancelled | Intentionally closed without conversion.                     |
| Expired   | No longer valid because the allowed time elapsed.            |

Claim and completion operations must be concurrency-safe. A second agent must receive an explicit conflict rather than create a duplicate booking.

Implementation limitation: the claim transition is conditional, but completion currently accepts
pending or claimed drafts without checking the claim owner. It commits the booking before marking
the draft completed. Concurrency-safe completion above is a requirement, not a current guarantee;
charge-agent attribution does not resolve that existing limitation.

## Security and Abuse Controls

- Bind the temporary session to one company and branch.
- Apply short expiration and rate limits to session and draft creation.
- Validate all customer and parcel input on the server.
- Treat public prices, statuses, and identifiers as untrusted.
- Do not expose internal notes, permissions, other branches' drafts, or full customer records.
- Record claim, completion, cancellation, actor, branch, and timestamps for audit.

## Payment and Printing

Completion uses the shared booking service with `requireActiveCashierSession: false`, no sender
payment, and initial `CREATED` status. Pay-now bookings are queued for sender cashier completion;
credit remains subject to sender eligibility and limit validation. This current behavior supersedes
the previous documentation's claim that self-service completion immediately requires a cashier session.

Sticker copies must follow [Parcel Printing](PARCEL_PRINTING.md): the user enters any positive whole number with no application-defined maximum. A print failure after successful completion must not create a second parcel when retried.

After successful completion, web/desktop and mobile keep a **Booking completed** panel with the
saved booking/tracking codes, sticker-copy input, **Print Sticker**, and a return-to-drafts action.
Printing is manual, after the officer chooses the quantity. Web/desktop reuse the existing sticker
module and cashier-session print gates and desktop printer routing; mobile uses the phone's native
print dialog. This action prints a sticker only and creates no invoice or payment. The label uses
the corrected contacts, chosen destination, officer-entered parcel details and final CS choice.
Printing first verifies the current saved payment state. A full receiver-pay booking can print
**TO BE PAID** with its balance. A split booking can print only after its sender contribution is
recorded, or after full settlement. Sender pay-now completion is blocked until payment is recorded;
approved credit requires a posted credit ledger entry. Only **PAID**, **TO BE PAID**, and **CREDIT**
print. Unknown, missing, `PENDING` and `UNPAID` states never print. Verification/network failures
leave the saved booking unchanged and permit retry; no print job or usage log is created. Every
retry fetches fresh payment data, so recording payment then retrying in the completed panel uses
the current state rather than the completion snapshot. Mobile also requires the `sticker_print`
company module. See [Parcel Printing](PARCEL_PRINTING.md#verified-sticker-payment-status).

Failed/cancelled printing leaves the completed panel available for another print attempt without
calling completion again. Mobile blocks invalid/unsafe copy counts and printing until destination
names load, offers retry for failed destination loading, and exposes **Retry Print Log** when the
print succeeded but usage logging failed. That log retry does not print again. The completion panel
is held in the current screen's memory; after leaving it, use the existing parcel reprint workflow.

## Failure and Recovery

- Expired or invalid public sessions require a fresh branch session, available through **Start new booking**;
  an exhausted ten-booking batch instead requires reopening the branch QR scan entry.
- Invalid customer input keeps the draft form editable and does not leak account data.
- A lost claim should become available according to the configured recovery policy or be released by an authorized agent.
- Failed completion leaves the draft recoverable and does not create partial authoritative records.
- Successful completion with failed printing offers reprint from the created parcel.

## Verification Scenarios

- Scan a current QR and open an older/direct branch link without `scan=1`; both must start a
  booking in a fresh browser. Refresh with a valid stored token and retain the same session.
- Set the device date/time ahead/behind by a day; fresh and restored sessions must remain usable
  until the server rejects them. Wait 15 server minutes or submit once, reopen that consumed token,
  and use Start new booking without scanning; verify a new token and blank form.
- Test blocked/corrupt sessionStorage, retry after session creation failure/429, cached 410
  followed by a successful restart, a branch-link change, and repeated taps while starting.
- Issue through one backend instance and validate through another or after restart. Concurrent
  submission accepts one token consumer; identical retry requests return the saved draft/result
  without another insert or count increment. Another branch cannot consume it. Verify expired rows
  are swept and Redis TTL/single-use operations work when configured. Coverage:
  `self-service-session.service.spec.ts`, `self-service-session-store.spec.ts`,
  `self-service-session-storage.test.ts`, `self-service-session-screen.test.tsx`, and optional
  `redis-cache.integration.spec.ts` with `REDIS_TEST_URL` pointing to disposable Redis.

- On a short web/desktop viewport, scroll from the summary through destination, pricing, CS,
  parcel details and Complete Booking; verify the final button remains reachable after resizing.
- On mobile, contents such as "Books" must appear in the summary while Parcel details is blank.
  Blank/whitespace details block completion; enter "1 sealed carton", edit customer contents, and
  verify the officer's details survive. Open a second draft and confirm the details reset to blank.
- Complete once on each client; print 1, 2 and 25 copies and verify the same saved tracking code,
  destination, backup phones, operational details and CS mark on every copy. Verify sender pay-now,
  receiver, split and credit states. Block unpaid sender and unsettled split completion; record the
  sender payment and retry without re-completing the draft. Only PAID, TO BE PAID with the current
  receiver amount, and ledger-approved CREDIT may print. Legacy PENDING, missing state and failed
  verification must open no print dialog or desktop job and create no usage log.
- Cancel/fail the print and retry: the same booking remains, no second completion request is sent.
  On mobile, fail destination lookup and retry, then fail usage logging and retry only that log.
  Check disabled web sticker module and cashier-without-session print gates.

- Web/desktop/mobile officers must select the agent alongside the authoritative charge; verify
  the parcel stores that agent while `createdBy`/draft `completedBy` still identify the submitting officer.
- Invalid, inactive, wrong-company, and wrong-branch agents reject completion without creating a
  booking/parcel/payment; the draft stays available for correction. Verify failed lookup, retry,
  no available staff, and older requests with no agent producing NULL attribution.

- Valid QR/session creation and wrong-branch or expired-session rejection.
- Localhost print preview contains the development host LAN address, while production QR URLs keep
  the public HTTPS origin.
- Exact phone lookup with minimal response and rate limiting.
- New and existing sender/receiver combinations.
- Concurrent claim by two agents.
- Sender, receiver, split, pay-now, credit, and partial settlement.
- The public form shows no CS option (parcel step and review step); a public submission that
  still sends `callSender: true` stores the draft with `callSender = false`.
- Web/mobile officers tick or leave CS during pricing; completed parcel and portrait/landscape
  sticker reflect the officer's choice while showing receiver contacts.
- Older completion requests without `callSender` retain the draft choice; explicit `false`
  clears a previously selected choice. A failed completion does not alter the draft.
- Web Booking Details dialog: edit contents and declared value from View / Edit and from the
  completion page; blank contents or invalid value disables save; read-only users see disabled
  fields; the completed parcel uses the corrected contents and value.
- Mobile search by sender/receiver name and primary/backup phone (with spaces), no-match and
  empty-queue messages.
- Mobile full draft edit: contacts, destination branch/location, contents and value; branch change
  clears location; invalid phone/value blocks save; stale draft, another officer's claim, source
  or head-office destination and foreign location are rejected; completed parcel uses the
  corrected details while the officer's CS choice is kept.
- Cancellation, expiry, and claim recovery.
- Successful completion followed by print failure and reprint.
- Mobile read-only access, claim permission denial, pay-now sender/receiver/split completion, and credit-option absence.
- Branch and company isolation for public and staff routes.
- A role with `CanReadBranches` plus `CanPrintSelfServiceQrCode` can print the branch QR code but
  cannot edit the branch; existing roles with `CanUpdateBranches` retain print access.
- Terms dialog readability on mobile, unticked-by-default consent, blocked submission without
  consent, and server rejection of missing, false, or outdated terms versions.

### Ten-booking continuation QA

- Submit ten drafts using one scan and the same sender telephone. After submissions 1–9,
  **New booking** opens a blank sender step, retaining only the branch and server-authorized
  count. Each draft has distinct sender/receiver/content values and no prior form data leaks.
- After the tenth, confirm **New booking** is absent, the count is 10 of 10 and rescan guidance
  is shown. Refresh and confirm no new token is issued. Scan the branch QR again and confirm
  a new batch starts at 1; an expired continuation recovers without pretending submission failed.
- Duplicate/concurrent requests using a consumed token create only one draft and one continuation
  and return that original successful response. Different details with the same consumed token
  return 409 instead of creating another draft. Submission receipts last until the draft deadline
  (one hour); expired/unknown tokens still return 410. A client submission guard blocks double taps.
  Try a database failure while saving and confirm the token remains usable and count unchanged.
  Restart or switch backend instance between bookings and verify the count/deadline persist.
- Refresh between bookings and retain the next token/count; changing the phone's clock must not
  reset the count or extend the original deadline. The 15-minute deadline can end a batch before 10.
- Backend response adds `bookingsCompleted` and nullable `nextSession` (branch, token, original
  timestamps, next `bookingNumber`). Existing stored payloads without a count start at 1.
  Deploy the backend before the web update; no migration beyond the pending `0087` is required.
  Automated coverage: `self-service-booking-continuation.spec.ts`,
  `self-service-session.service.spec.ts` and `self-service-success-screen.test.tsx`.

Idempotency is scoped to the submitted token: retries and network-loss recovery reuse the original
draft ID and continuation, including across backend restarts. Draft insertion, receipt storage,
continuation creation and token consumption share one database transaction. The request fingerprint
normalizes names/phones/value and excludes changing request IP and server timestamps. Repeat
submissions do not increment the booking count or daily counters. Using **New booking** intentionally
starts another blank parcel form with its next token; the service does not merge separate intended
parcels merely because they have the same sender or contents.

## Exempt Customer Completion

Family, Friends, Director and Staff customers qualify new parcels for full charge exemption when either the sender or receiver has that type. Transport, delivery, storage and every other charge remain zero. Only Staff parcels require an active destination-branch HR employee as Receiving staff. Updated web/desktop and mobile booking and self-service completion support the selection; stickers show EXEMPT and the preserved staff name while keeping the office contact number. Historical unclassified zero charges remain distinct. See [Customer charge exemptions](CUSTOMER_CHARGE_EXEMPTIONS.md) for current rules, permissions, failure cases, migration rollout and QA.
