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

The payment service supports:

- General payment creation.
- Sender collection and parcel processing as one controlled operation.
- Receiver collection and delivery or pickup completion as one controlled operation.
- Sender, receiver, split, credit, and outstanding settlement patterns.
- Cash, supported mobile money providers, and other configured methods.
- Receiver OTP request and verification where required.

Atomic collection operations must not leave a successful payment with a failed parcel transition, or a completed parcel with no required payment.

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

## Printing

Sender payment and parcel creation can initiate sticker and A5 printing. Sticker quantity follows the unlimited positive-whole-number rule in [Parcel Printing](PARCEL_PRINTING.md). The payment transaction must not be rolled back merely because printing fails.

For mobile receiver-paid creation, **Complete & print sticker** asks the server to complete the booking in an active authorized cashier session, then opens the phone's native print dialog with a 90 × 92 mm to-be-paid sticker. The app offers a retry button if the print dialog fails after booking creation. The phone needs an installed print service that can reach its paired printer; mobile printer selection does not use desktop printer routing. Leaving the box unticked queues the booking for Sender Cashier Payments as before.

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
