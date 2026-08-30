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
- Delivery fees are not included in the taxable principal where the product rules exclude them.
- Corrections preserve the original cashier session attribution and an audit trail.
- Client-calculated totals are for display; the server is authoritative.

## Mobile Money

Sender payment supports manual and automated MTN MoMo paths where configured. Automated collection must preserve provider references and an unambiguous pending, successful, failed, or timed-out result. A timeout must not be treated as failure if the provider status is still unknown; reconciliation must be possible.

## Printing

Sender payment and parcel creation can initiate sticker and A5 printing. Sticker quantity follows the unlimited positive-whole-number rule in [Parcel Printing](PARCEL_PRINTING.md). The payment transaction must not be rolled back merely because printing fails.

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
