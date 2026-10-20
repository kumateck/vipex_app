# Cashier Payments and Shifts

## Purpose

Cashier functions connect an account user to a business cashier type, branch, active shift, collections, and reports. An account role and a cashier assignment are related but are not the same concept.

## Identity Model

| Concept            | Meaning                                                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| Account user       | Authenticated person with roles, permissions, company, and branch scope.                           |
| Role               | Permission bundle such as Delivery Supervisor. A role name alone does not make the user a cashier. |
| Cashier assignment | Operational profile that authorizes a user to perform one or more cashier functions.               |
| Cashier type       | Sending, receiving, delivery, or full cashier capability.                                          |
| Cashier session    | Open shift in which controlled transactions are collected and reported.                            |

The server must derive cashier behavior from the cashier assignment and permission checks, not from a display role label or the mere existence of an account.

## Cashier Types

| Type              | Typical responsibility                               |
| ----------------- | ---------------------------------------------------- |
| Sending cashier   | Collect sender-side parcel payments.                 |
| Receiving cashier | Collect receiver-side payments at pickup or receipt. |
| Delivery cashier  | Collect delivery-side payments.                      |
| Full cashier      | Operate across the enabled cashier contexts.         |

The available type list is permission-controlled. A user who can view a cashier report may not necessarily have permission to read all cashier assignments.

## Session Lifecycle

1. An eligible cashier opens a session at the permitted branch and cashier type.
2. Collections are attributed to that session.
3. Current totals and transaction summaries update as payments are processed.
4. The cashier closes the session with the required reconciliation information.
5. Reopening a same-day session requires the specific reopen permission.

A user cannot open a session for an unrelated cashier or branch unless explicitly authorized. Controlled payment flows should require an active compatible session.

### Session delegates for to-be-paid creation

A sender or full cashier can list active staff at the same branch and assigned location whose role permits parcel booking, then add or remove them from the cashier's active session. The assignment is tied to that session, not to the staff member permanently. Web session controls and the mobile cashier dashboard expose the same list. A cashier cannot assign themself or staff from another company, branch, assigned location, inactive account, or role without `CanCreateBookingWithParcels`.

Assigned staff may create a **fully receiver-paid** parcel and immediately mark it processed in the owning cashier's session. No sender payment is collected. The server resolves the owner and active session from current user records; a client-supplied session, cashier ID, or stale cashier type in a token is not trusted. The booking audit records the actual creator. Removing the staff member or closing the session denies later completion requests. A new session needs a new assignment. Sender-paid, split, and zero-charge bookings cannot use this delegate path. Eligible staff must be active in the cashier's company and branch and, when the cashier has an assigned location, in that same location. A cashier without an assigned location may select staff across their branch. The server applies this scope when listing, adding, and using delegates; moving a delegate to another location suspends their completion access while they remain out of scope.

The parcel's `processedBy` user ID is the **owning cashier**, including when a delegated staff member submitted the mobile booking. `createdBy` and the booking audit retain the actual staff member who entered it. The parcel and booking `cashierSessionId` reference the owning cashier's session. Ordinary sender cashier processing also writes the cashier to `processedBy`. This field is distinct from `confirmedBy`, which represents receiver handover or delivery confirmation. Existing parcels are not backfilled because historic processors cannot always be inferred safely.

`GET /cashiers/sessions/:id/delegates` needs session-read permission and returns eligible and assigned staff to the session owner. `POST /cashiers/sessions/:id/delegates` needs session-open permission, and `DELETE /cashiers/sessions/:id/delegates/:userId` needs session-close permission. Every mutation checks that the caller is the owner of an active sender or full cashier session. Invalid or expired delegation returns `403`; a session owned by someone else returns `404`.

## Payment Workflows

### Confirmation owns the To Be Paid report

Agent charge entry, completing a self-service draft, or printing a sticker alone does not choose a
cashier. A pending booking requires sender-cashier confirmation, including zero sender payment
for fully To Be Paid parcels. First confirmation sets `processedBy` and the parcel's
`cashierSessionId` to that cashier and their active session, replacing a provisional entry link.
`createdBy` and `chargeAgentUserId` retain who entered/charged it; `confirmedBy` remains the later
receiver handover field. The parcel session is authoritative; a booking header can cover parcels
subsequently confirmed by different cashiers.

With two active cashiers at one location, an agent's parcel confirmed by cashier B appears only
under B's session. The server locks the parcel so simultaneous confirmations have one owner;
repeating confirmation cannot transfer an already processed parcel to another cashier/session.
First confirmation adds `PARCEL_SENDER_PROCESSED` audit metadata with current/prior session IDs.
Paid/split confirmation still records actual collections; zero-payment confirmation creates no
payment and does not add To Be Paid balances to collected sales.

The authorized mobile **Complete & print sticker** delegate path confirms immediately for its
resolved owning cashier session. A changed authorized session is rejected before creation.
Agent web/mobile entry without immediate completion and self-service retain cashier confirmation.
Printing/reprinting does not change ownership or duplicate report rows.

Daily report ownership comes from the recorded parcel session, not its creator. Date/location
filters use session opening date and the owning cashier location, including earlier parcel entry
dates. Sessions with only To Be Paid records remain visible and selectable. Pending, deleted,
unlinked, and contradictory processor/session rows are excluded. Active-session totals also stop
guessing ownership from branch/time. The daily table retains current outstanding-balance amounts.

Existing correctly linked records appear under their cashier after deployment without a backfill.
Historical missing/contradictory links require evidence-based, audited repair; this change does
not guess between cashiers or rewrite past financial records. A non-null `processedBy` that
disagrees with the session owner is excluded pending repair; a null historical processor with
a valid session remains supported. Migration `0088_parcel_cashier_session_index.sql` indexes
the existing parcel session field for report joins and summaries; it performs no data backfill.
Apply it with the normal vetted migration workflow. No permission or client request change is required.

QA: same-location cashiers; agent/self-service entry before and after confirmation; mobile
delegates; paid/split/receiver-paid amounts; pending rows; earlier entry dates; location filters;
zero-collection sessions; simultaneous confirmation/retries; closed sessions; company/branch/
deletion scope; ambiguous old links. Automated coverage is
`tests/server/cashier-session-attribution.spec.ts`, using a dedicated empty local database with
real column definitions/defaults but without production triggers/FKs.

The payment service supports:

- General payment creation.
- Sender collection and parcel processing as one controlled operation.
- Receiver collection and delivery or pickup completion as one controlled operation.
- Sender, receiver, split, credit, and outstanding settlement patterns.
- Cash, supported mobile money providers, and other configured methods.
- Receiver OTP request and verification where required.

Atomic collection operations must not leave a successful payment with a failed parcel transition, or a completed parcel with no required payment.

Delivery cashier completion uses the configured doorstep fee saved on the delivery record.
Rider returns and reassignment preserve this fee, so it remains visible when the rider hands
the parcel to the customer and the cashier finalizes it. The outstanding fee is the configured
fee minus non-voided delivery fee payments, floored at zero. Rider-recorded collections remain
pending cashier reconciliation and do not count as posted payments. Moving a returned parcel
to office pickup excludes the doorstep fee from the required settlement. Web and Electron
desktop share the cashier dialog; web and mobile riders use the same preserved fee.
Use **Edit Delivery Fee** in the Delivery Cashier table or finalization dialog to restore or
correct the confirmed charge. The same dialog is available on Rider Returns. Enter the new
fee and reason; the fee and outstanding-payment defaults refresh after saving. This does not
record a collection or change delivery status. The server blocks stale edits, fees below
posted payments or rider collections, pending change requests, and completed deliveries.
Fees erased by the old return behavior are restored manually using confirmed amounts;
this workflow does not reconstruct historical amounts. See [Rider returns and reprocessing](PARCEL_OPERATIONS.md#rider-returns-and-reprocessing)
for recovery constraints and QA scenarios.

## Amount and Tax Rules

- The server validates the expected charge and allowed settlement.
- Principal transport or parcel charges are taxable according to configured rules.
- When no active company tax profile/components exist, taxable principal payments use the
  default Ghana tax calculator instead of silently producing a zero-tax receipt. An active
  company tax profile remains authoritative when configured.
- Delivery fees are not included in the taxable principal where the product rules exclude them.
- Corrections preserve the original cashier session attribution and an audit trail.
- Client-calculated totals are for display; the server is authoritative.

## Mobile Money

Sender payment supports manual and automated MTN MoMo paths where configured. Automated collection must preserve provider references and an unambiguous pending, successful, failed, or timed-out result. A timeout must not be treated as failure if the provider status is still unknown; reconciliation must be possible.

## Sender payment list refresh

The web Sender Cashier Payments page polls for new or changed parcels every 15 minutes. Users
can also use the **Refresh** button to request an immediate update. During an initial load,
scheduled poll, or manual refresh, the page keeps the current rows visible and shows a
`Refreshing payments...` indicator plus a spinning refresh button; the button is disabled until
the request finishes. This applies to the web page only; mobile and desktop clients retain their
existing refresh behavior.

## Printing

Sender payment and parcel creation can initiate sticker and A5 printing. Sticker quantity follows the unlimited positive-whole-number rule in [Parcel Printing](PARCEL_PRINTING.md). The payment transaction must not be rolled back merely because printing fails.

For mobile receiver-paid creation, **Complete & print sticker** asks the server to complete the booking in an active authorized cashier session, then opens the phone's native print dialog with a 90 × 92 mm to-be-paid sticker. The app offers a retry button if the print dialog fails after booking creation. The phone needs an installed print service that can reach its paired printer; mobile printer selection does not use desktop printer routing. Leaving the box unticked queues the booking for Sender Cashier Payments as before.

The mobile to-be-paid sticker uses the same 90 × 92 mm portrait layout as the desktop thermal sticker:
brand and QR header, payment status and amount, receiver panel, destination/location row, and sender
and parcel detail rows. Its data is rendered from the same booking fields and uses the same payment-due
notice and fallback `-` values.

QA: assign a same-branch, same-location staff member, create and print a receiver-paid parcel on mobile, and confirm the parcel is processed and attributed to the owner session. For a cashier with a location, check another-location and no-location staff are absent from the picker and rejected by a direct add request; moving an existing delegate to another location must block completion. For a cashier without a location, check eligible staff across that branch remain available. Check unassigned, revoked, inactive, wrong-branch, and closed-session staff get `403`; check paid and split parcels cannot use immediate completion. Close the print dialog or simulate a printer error, then retry without creating a second booking. Verify a later session has no inherited delegates.

## Daily Cashier Sales Report

The report at `/reports/cashier/shifts` summarizes sessions, amounts to be paid, gross sales, sender, receiver, and delivery sales, payment methods, transactions, and outstanding amounts.

Filters include session open date, branch, location, cashier type, and cashier. Branch users are scoped to their branch; broader consolidated access requires the relevant permission.

After **Load report** succeeds, the web report shows a **Loaded Report Breakdown** control with
`All cashier modules`, `Sender only`, `Receiver only`, and `Delivery cashier only`. This filter is
applied to the already-loaded result and does not make another API request. It recalculates the
visible session count, transaction and monetary totals, payment-mode totals, responsibility totals,
payment rows, and printed report. Selecting a new pre-load scope and loading again resets the
breakdown to all modules.

Full Cashier report scope includes sender, receiver, and delivery collections. A Full Cashier
transaction is classified as Sender or Receiver by its payer; transactions recorded through the
Delivery Cashier module remain Delivery. Outstanding To Be Paid rows belong to the Sender module,
so Receiver-only and Delivery-only views do not show them. A module with no matching transactions
shows an empty result with zero recalculated totals. This behavior applies to the web and desktop
report; mobile does not expose this report page. Permissions and server branch/cashier scope are
unchanged by the post-load filter.

The **Payments** view and its printed report show **Sales by Route**, grouped by each paid
parcel's existing source and destination branch IDs (displaying branch names). For example, a
receiving Accra cashier sees Kumasi → Accra and Sunyani → Accra separately; an Accra sender
cashier sees Accra → Kumasi and Accra → Sunyani separately. Each row shows payment count,
sender/receiver/delivery gross amounts, cash versus non-cash amounts, and the route total.
The transaction list and printout also show the route for audit tracing. Only non-voided payment
transactions already included in the selected cashier/date/session scope contribute; outstanding
To Be Paid parcels are not sales. Non-cash includes mobile money and credit, so the Cash column
is the physical-cash portion. The post-load module filter recalculates the route rows from its
visible transactions; the total across routes must equal the filtered Gross Sales. Missing branch
names fall back to the branch ID, without merging distinct branches with the same name. Empty
payment results show no route rows. Existing `CanViewReportCashierShifts` and cashier/branch
scoping apply to both cashier self-view and authorized accounts-officer selection.

QA: for one Accra receiver cashier, collect payments on parcels from Kumasi and Sunyani and
verify distinct route totals and matching payment rows. Repeat with sender-paid parcels sent
from Accra to both branches. Include Full Cashier, Delivery Cashier, split, cash, mobile-money,
credit, and voided payments; verify the gross and cash/non-cash totals, module-filter behavior,
and printed route summary. Verify unpaid To Be Paid rows, unauthorized cashier/branch selection,
and missing branch display names do not distort the breakdown.

### Delivery Cashier Received Summary

The shift-session sales report shows a **Delivery cashier collections** section with two
separate totals: **Delivery fees received** and **To Be Paid received**. The former sums posted
Delivery Cashier `DELIVERY_FEE` payments; the latter sums posted Delivery Cashier `PRINCIPAL`
payments (the gross principal actually collected, including its tax). A full or receiver cashier's
principal collections are not counted as Delivery Cashier collections. `OTHER` components are
not reclassified as fees or principal. Rider-recorded amounts awaiting cashier reconciliation
are excluded until payments are posted. Existing report scope and voided-payment exclusion apply.

The web/desktop summary replaces the combined Delivery Sales card with these two received
totals; the Payments printout includes the same component summary while retaining a clearly
labelled Delivery total in its responsibility summary. The mobile Cashier Sales Report reached
from the active shift shows the same two received totals. **Outstanding To Be Paid** is the
existing unpaid sending-parcel balance and is labelled explicitly to distinguish it from
principal already received. Overall gross, payment-method and route totals are unchanged.

The summary is calculated from the report's payment rows, so web's loaded module filter updates
it without another request; a Delivery-only empty result shows zero for both components. Mixed
or Full Cashier report scopes show the section when actual Delivery Cashier transactions are
present. A receiving-only result does not show a delivery breakdown. No new permissions,
endpoint fields, database schema, or collections are introduced. Older posted payments work
using their existing `cashierType`, `component`, and `grossAmountPsw` fields.

QA: in one delivery shift, collect GHS 30 To Be Paid and GHS 60 delivery fees. Confirm received
principal is GHS 30 and received fees GHS 60 on web, mobile and the Payments printout, while gross
remains GHS 90. Include several parcels, split payment methods and partial principal collections;
only amounts received contribute. Add unrelated receiver/sender payments and an outstanding
balance and confirm they do not enter either delivery subtotal. Void a payment, reload and confirm
it is excluded. Switch all/sender/receiver/delivery loaded modules, test an empty delivery scope,
and compare the printed summary. Existing permission and branch/date/session restrictions apply.
Automated checks cover component classification, mixed scopes, zero results, module filtering
and matching print totals in `delivery-cashier-collections.test.ts` and
`daily-cashier-sales-collections.test.tsx`.

### Known Access and Selection Defect

The current web page can be opened with the cashier-shift report permission, while reading the cashier directory is guarded by an accounting-read permission. When a Delivery Supervisor such as `vipexdelivery5@gmail.com` can view the report but cannot read selectable cashier assignments, the UI falls back to the signed-in account and displays it as the cashier. This makes the Cashier Type and Cashier controls appear locked or incorrectly selected even though the role itself is not a cashier.

Required correction:

- Do not infer that the signed-in user is a cashier solely because they can view the report.
- Load cashier types and assignments using a report-appropriate, branch-scoped permission or endpoint.
- Permit authorized supervisors to select the cashier type and cashier within their allowed scope.
- Use self-scoping only when the user has an actual cashier assignment or an explicit self-only report policy.
- Keep server-side report authorization and branch filtering authoritative.

## Failure and Audit Rules

- Failed payments must not advance parcel state.
- Duplicate submissions must not create duplicate collections.
- Every collection records actor, cashier, session, branch, method, amount, payer, parcel or booking, provider reference where applicable, and time.
- Session corrections require a reason and immutable before/after history.
- Permission failures must be explicit; the UI must not disguise missing directory access as a valid self-selected cashier.

## Verification Scenarios

- Each cashier type opens, operates, closes, and—when permitted—reopens a session.
- Delivery Supervisor with report access but no cashier assignment can select allowed cashiers and is not labelled a cashier.
- Branch-scoped supervisor cannot query another branch.
- Sender, receiver, split, credit, cash, and MoMo collections.
- Payment succeeds and print fails without losing the transaction.
- Payment fails without changing parcel status.
- Original-session correction and audit history.
- Report totals match session transactions and method breakdowns.
- A loaded Full Cashier report can switch between Sender-only, Receiver-only, Delivery-only, and
  all-module results without another request; summaries, To Be Paid visibility, tables, and print
  output follow the selected module, and a new load resets to all modules.
