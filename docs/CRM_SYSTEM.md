# CRM System (Current Implementation)

This document describes the current repository CRM implementation. Exempt customer types require migration `0092` and updated clients before use in deployed environments; this change does not establish production rollout.

## Scope

The CRM system currently provides:

- Customer classification (`Individual`, `Business`, `Family`, `Friends`, `Director`, `Staff`)
- Business-only credit eligibility controls
- Customer credit ledger (charges and payments)
- Customer card assignment
- CRM management UI for create/update/delete and credit operations
- Credit-aware behavior during parcel booking and delivery completion

## Core Rules

- `customerType` enum is fixed as:
  - `Individual = 0`
  - `Business = 1`
  - `Family = 2`, `Friends = 3`, `Director = 4`, `Staff = 5`
- Default customer type is always `Individual`.
- Existing non-CRM customer creation/update flows remain unchanged.
- Customer Management name edits through standard or CRM customer PATCH endpoints preserve
  recorded parcel names. A deliberate name correction from a parcel's Edit action updates
  that parcel's main-receiver name and the linked customer together; other parcel history is
  preserved. Phone-only parcel edits do not overwrite a later profile rename. Contact phone
  changes remain shared across parcels. See
  [parcel receiver corrections](PARCEL_OPERATIONS.md#correcting-a-receiver-from-a-parcel) for
  permissions, failure behavior, rollout requirements, and regression scenarios.
- Second-receiver handovers and call outcomes use a dedicated resolve-or-create operation: an
  exact primary or secondary telephone match in the authenticated company links the active
  existing customer; otherwise a new individual customer is created. The existing record is not
  renamed or edited. Ordinary customer creation still rejects duplicate telephone numbers.
- Business and exempt classification creation/promotion is enforced through CRM endpoints only.
- Credit booking is allowed only for credit-eligible customers.
- Credit settings persist on customer records and are not session-bound.

## Source Files

Database and schema:

- `src/db/schemas/enums.ts`
- `src/db/schemas/customers.ts`
- `src/db/schemas/relations.ts`
- `drizzle/0002_customer_crm_credit.sql`

Backend (customers):

- `src/server/features/customers/repository.ts`
- `src/server/features/customers/service.ts`
- `src/server/features/customers/controller.ts`
- `src/server/features/customers/routes.ts`

Backend (credit integration):

- `src/server/features/shipments/booking-with-parcels.service.ts`
- `src/server/features/shipments/booking-with-parcels.repository.ts`
- `src/server/features/deliveries/service.ts`

Frontend:

- `src/features/customers/api.ts`
- `src/pages/(private)/customers/page.tsx`
- `src/features/operations/parcel/components/parcel-create-form.tsx`
- `src/features/operations/parcel/components/parcel-create/parcel-card.tsx`
- `src/features/operations/parcel/components/parcel-create/parcel-form.types.ts`
- `src/features/operations/parcel/pages/parcel-delivery-cashier-page.tsx`

## Data Model

### Customer fields

`customers` table includes:

- `customer_type` (`smallint`, default `0`)
- `credit_eligible` (`boolean`, default `false`)
- `credit_limit_psw` (`bigint`, default `0`)
- `payment_terms_days` (`integer`, default `0`)

### Credit ledger table

`customer_credit_transactions` stores immutable ledger entries:

- `company_id`
- `customer_id`
- `source_type`
- `transaction_type`
- `reference_id`
- `signed_amount_psw`
  - Positive values increase receivable (charge)
  - Negative values reduce receivable (payment)
- `notes`
- `created_by`
- `created_at`

Balance is derived by summing `signed_amount_psw` for a customer within company scope.

## Enum Additions

Added enums:

- `PaymentMethod.CREDIT = 4`
- `CustomerType`
- `CustomerCreditSourceType`
- `CustomerCreditTransactionType`

## API Surface (Customers)

All routes are under `/v1/customers`.

Standard customer routes:

- `GET /`
- `GET /lookup/by-telephone/:telephone`
- `GET /:id`
- `POST /`
- `PATCH /:id`
- `DELETE /:id`

CRM-only create/update routes:

- `POST /crm`
- `PATCH /:id/crm`

Cards:

- `GET /cards/options`
- `GET /:id/cards`
- `POST /:id/cards`

Credit:

- `GET /:id/statement`
- `GET /:id/transactions`
- `GET /:id/payments`
- `GET /:id/credit/summary`
- `GET /:id/credit/transactions`
- `GET /:id/credit/open-items`
- `POST /:id/credit/payments`

## Context Enforcement

Backend route design enforces context:

- Standard endpoints (`POST /`, `PATCH /:id`) force `sourceContext = 'default'`.
- CRM endpoints (`POST /crm`, `PATCH /:id/crm`) force `sourceContext = 'crm'`.

Service layer rejects business create/update outside CRM context.

This keeps legacy flows compatible while restricting business onboarding to CRM.

## CRM UI

Route:

- `/customers` (paginated list, page size `30`)
- `/customers/:id` (customer detail with tabs)
- `/customers/new` and `/customers/edit/:id` (single shared form behavior)

Current UI capabilities:

- Paginated customer list with footer pagination controls
- Dedicated profile/details page per customer
- Create and update customer profile via dedicated upsert routes
- Set type (`Individual`/`Business`)
- Toggle credit eligibility
- Set credit limit and payment terms
- Soft delete customer (confirmation dialog)
- Add card info to customer
- View credit balance and transaction feed
- Record customer credit payments
- Generate customer statement by ad-hoc period (`from` / `to`)
- View unified statement timeline (parcel sending, parcel receiving, payment records, credit ledger)
- Export statement as CSV
- Print statement layout (browser print dialog can save as PDF)
- Show running credit balance per statement row
- Tab-based detail sections:
  - `Transactions`: sending parcels + statuses
  - `Payments`: parcel/credit payments + debt pay action
  - `Statements`: unified ledger
  - `Credits`: credit summary + credit ledger + open credit items
- Each tab sends `customerId` and date range (`dateFrom`, `dateTo`) to backend.

Frontend API alignment:

- CRM page uses:
  - `POST /customers/crm`
  - `PATCH /customers/:id/crm`
- Non-CRM operational pages continue using:
  - `POST /customers`
  - `PATCH /customers/:id`

## Parcel Booking Credit Behavior

When creating bookings with parcels:

- If parcel payment method is `CREDIT`:
  - Sender must be credit eligible.
  - Credit limit is validated before booking finalization.
  - Sender payment amount is treated as `0` for that parcel.
  - Charge is posted to customer credit ledger after creation.

If validation fails, booking request is rejected with explicit credit error.

## Delivery Credit Behavior

During delivery completion/finalization:

- If payment method is `CREDIT`, the flow posts a customer credit charge transaction.
- This avoids immediate cash payment record creation for that item.
- Receiver customer is used for the credit account in delivery credit posting flow.

## Customer Statement

Statement endpoint:

- `GET /v1/customers/:id/statement?dateFrom=<iso>&dateTo=<iso>&limit=<n>`

What it returns for the selected period:

- Parcel sent events
- Parcel received events
- Payment records linked to customer parcels
- Credit ledger records (charges and payments)

Summary includes:

- Parcel counts (sent/received)
- Aggregate sent charge and receiving-to-pay totals
- Total payments made by customer
- Credit charges and credit payments
- Opening and closing credit balance within the selected range

Statement UX additions:

- CSV export contains all rendered rows and running balance values.
- Print view formats statement for hard copy and PDF save.
- Running balance is calculated from opening balance plus in-range credit movements:
  - `debit` rows increase balance
  - `credit` rows reduce balance
  - `info` rows do not change credit balance

Notes:

- Date range is optional but supports ad-hoc ISO datetime filtering.
- Results are merged into a single descending timeline for CRM review.
- Limit is clamped server-side (max 1000).

## Debt Payment Allocation

On a customer's Payments tab, select parcels by booking code and enter the exact
sum of their outstanding balances. The server requires `parcelIds` on
`POST /:id/credit/payments`; it no longer distributes an arbitrary amount by FIFO.
Partial settlement, excess amounts, duplicate parcel IDs, and unallocated payment
balances are rejected. An older partial allocation may be cleared by paying the
parcel's full remaining balance. The settlement list includes all outstanding dates.

`GET /:id/credit/parcels` requires `CanReadCustomers` and returns outstanding amounts
grouped by parcel with booking/tracking codes. Posting requires
`CanUpdateCustomers`. Both endpoints enforce the authenticated company. Repayment,
allocations, and audit share one transaction, and concurrent submissions cannot
allocate the same outstanding amount twice. Unknown/mismatched customers return
404; already settled or unavailable parcels return 409; amount mismatch returns 400.

Accounts staff can also use Finance → Customer Wallet & Credit Control → Create
Payment with that module's dedicated permissions. See
[CUSTOMER_WALLET_CREDIT_MODULE.md](CUSTOMER_WALLET_CREDIT_MODULE.md) for the API
contract, failures, permissions, and zero-charge correction approval workflow.

The Customers list has Individual, Business, Family, Friends, Director and Staff tabs. The `customerType` filter
(0 through 5) is applied on the server before pagination and counting. Search and tab
changes reset pagination. Existing records keep their recorded customer type.

Credit ledger entries remain immutable. Legacy zero charges can be proposed as CREDIT through
Parcel Details and take effect only after independent approval. Dedicated role grants
`CanUpdateParcelCharge` and `CanApproveParcelCharge` control the two steps. There are no person
selectors; the sender owns the debt and the system records requester and approver. Positive
charges cannot be edited through this flow. See the wallet module document for restrictions.
Ordinary new parcel charges and legacy correction requests reject zero (minimum GHS 0.01). Family, Friends, Director and Staff bookings are explicitly exempt from all charges; see [Customer charge exemptions](CUSTOMER_CHARGE_EXEMPTIONS.md) for qualification, staff, snapshot and client rules.

The transaction API includes `paymentStatus`, `paidPrincipalPsw`, and `creditPaidPsw`. The list
shows Paid/To Be Paid/Partial based on active principal payments, or Credit until the sender's
parcel principal debt is fully allocated. CREDIT parcels ignore phantom cash records for this
label. Explicitly exempt parcels show Exempt. Unclassified zero charges are never shown as Paid;
zero cash shows Charge missing, and zero CREDIT also has a Charge missing warning. Sender and
receiver views use the same parcel-scoped calculation.

## Defaults and Compatibility

- Existing operational customer creation continues defaulting to `Individual`.
- Booking officers select existing customers; their saved types determine the exemption. Staff parcels additionally require the receiving employee.
- Business/credit controls are centralized in CRM to avoid breaking current workflows.

## Validation

Current verification commands:

- `bunx tsc --noEmit`
- `bunx --bun eslint --fix src/features/customers/api.ts src/pages/(private)/customers/page.tsx src/components/datagrid/index.tsx`
