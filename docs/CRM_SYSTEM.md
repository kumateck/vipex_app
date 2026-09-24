# CRM System (Current Implementation)

This document describes the current live CRM implementation in the application.

## Scope

The CRM system currently provides:

- Customer classification (`Individual`, `Business`)
- Business-only credit eligibility controls
- Customer credit ledger (charges and payments)
- Customer card assignment
- CRM management UI for create/update/delete and credit operations
- Credit-aware behavior during parcel booking and delivery completion

## Core Rules

- `customerType` enum is fixed as:
  - `Individual = 0`
  - `Business = 1`
- Default customer type is always `Individual`.
- Existing non-CRM customer creation/update flows remain unchanged.
- Second-receiver handovers and call outcomes use a dedicated resolve-or-create operation: an
  exact primary or secondary telephone match in the authenticated company links the active
  existing customer; otherwise a new individual customer is created. The existing record is not
  renamed or edited. Ordinary customer creation still rejects duplicate telephone numbers.
- Business creation/update is enforced through CRM endpoints only.
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

Credit payment posting now allocates automatically to oldest outstanding credit charges first (FIFO):

- One credit payment transaction is created for the amount paid.
- Allocation rows are created per satisfied charge item.
- Partial payments are distributed across multiple open charges until exhausted.
- Endpoint response includes:
  - allocated amount
  - unallocated remainder
  - allocation breakdown

## Defaults and Compatibility

- Existing operational customer creation continues defaulting to `Individual`.
- Existing parcel creation UX does not require customer-type selection.
- Business/credit controls are centralized in CRM to avoid breaking current workflows.

## Validation

Current verification commands:

- `bunx tsc --noEmit`
- `bunx --bun eslint --fix src/features/customers/api.ts src/pages/(private)/customers/page.tsx src/components/datagrid/index.tsx`
