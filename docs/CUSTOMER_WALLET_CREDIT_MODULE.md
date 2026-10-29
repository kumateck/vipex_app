# Customer Wallet / Credit Control Module

## Scope

Customer Wallet / Credit Control v1 is implemented as a company-enabled module (`customer_wallet_credit`) with separated screens for:

- list pages
- create pages
- approvals pages

This separation is enforced in UI routes and backend permissions.

## Module Gate

- Module code: `customer_wallet_credit`
- Backend guard: `requireModuleEnabled('customer_wallet_credit')`
- Route mapping for frontend module gate:
  - `src/shared/company-modules/route-modules.ts`

If `customer_wallet_credit` is disabled for a company:

- `/customer-wallet-credit/*` routes are blocked in private layout
- customer wallet sidebar entries are hidden
- `/v1/customer-wallet-credit/*` endpoints are blocked

## Backend Endpoints

Base: `/v1/customer-wallet-credit`

### Accounts

- `GET /accounts`
- `POST /accounts/:customerId/payments`
- `POST /accounts/:customerId/block`
- `POST /accounts/:customerId/unblock`

### Approvals

- `GET /approvals`

Backend files:

- `src/server/features/customer-wallet-credit/routes.ts`
- `src/server/features/customer-wallet-credit/controller.ts`
- `src/server/features/customer-wallet-credit/service.ts`
- `src/server/features/customer-wallet-credit/repository.ts`

## Data Model

No new tables were added for v1.

Module APIs build on existing credit ledger tables:

- `customers`
- `customer_credit_transactions`
- `customer_credit_allocations`

## UI Routes (Separated)

- `/customer-wallet-credit` (home launcher)
- `/customer-wallet-credit/accounts` (account list)
- `/customer-wallet-credit/payments/new` (payment create)
- `/customer-wallet-credit/approvals` (approval queue)

Frontend files:

- `src/features/customer-wallet-credit/api/customer-wallet-credit.api.ts`
- `src/features/customer-wallet-credit/pages/customer-wallet-credit-home-page.tsx`
- `src/features/customer-wallet-credit/pages/customer-wallet-accounts-list-page.tsx`
- `src/features/customer-wallet-credit/pages/customer-wallet-payment-create-page.tsx`
- `src/features/customer-wallet-credit/pages/customer-wallet-approvals-page.tsx`

## Permissions

Customer wallet actions are role-gated with dedicated keys:

- `CanReadCustomerWalletCredit`
- `CanCreateCustomerWalletCreditPayments`
- `CanApproveCustomerWalletCreditControls`

Mapped routes are listed in:

- `docs/ROUTE_PERMISSION_MATRIX.md`

## Approval Rules (v1)

- `BLOCK_RECOMMENDED`: customer has credit enabled and overdue debt beyond payment terms.
- `UNBLOCK_RECOMMENDED`: customer is credit blocked and has no overdue debt signal.
- `NONE`: no approval action required.

Approvals page supports direct block/unblock action using module endpoints.

## Paying customer debt by parcel

Accounts staff use **Finance → Customer Wallet & Credit Control → Create Payment**
(`/customer-wallet-credit/payments/new`). Select a business customer, tick the parcels
by booking code, then enter the exact combined outstanding amount in GHS. The form
shows all outstanding parcels, including older debts outside the payment-history date range.
The customer CRM profile's Payments tab uses the same settlement rules.

- Select 1–200 distinct parcels. The payment clears every remaining charge for that
  customer on each selected parcel, including parcel and delivery credit charges.
- Amounts must be positive with at most two decimal places. Partial payments,
  overpayments, and unallocated balances are rejected. A previously partially paid
  parcel can be selected only to pay its entire remaining balance.
- `GET /accounts/:customerId/open-parcels` returns booking/tracking codes and integer
  `chargeAmountPsw`, `allocatedAmountPsw`, and `outstandingAmountPsw`, grouped by parcel.
  It requires `CanCreateCustomerWalletCreditPayments` and the enabled module.
- `POST /accounts/:customerId/payments` requires `parcelIds`, `amountCedis`, optional
  `referenceId` (255 characters), and optional `notes` (1,000 characters). Response:
  `id`, `allocatedAmountPsw`, `unallocatedAmountPsw: 0`, and charge-level `allocations`.
- Missing selection, invalid amounts, and total mismatches return 400. Foreign
  customers return 404; unavailable/settled parcels or conflicting principal-payment
  records return 409. Refresh the selection after a conflict; investigate existing
  principal payments before attempting credit settlement.
- Earlier payments with unallocated credit block a new collection (409). Finance
  must reconcile that existing credit before taking more money from the customer.
- Payment, allocations, and audit are committed together. Account/parcel/charge
  locks prevent duplicate allocation and serialize settlements with credit-charge edits.
  Retrying an already settled parcel returns a conflict without another payment.
- Original credit booking method and credit ledger charges are retained. These
  repayments are customer-ledger payments; they do not insert a second cashier sale
  or change previously issued credit receipts into cashier-payment receipts.
- Manual ledger charges without a linked parcel require finance review and are not
  selectable in the parcel settlement form. Cancelled/deleted parcels are excluded.

This workflow is implemented in the shared web UI (also used by desktop). No native
mobile settlement screen is introduced. API clients must send parcel IDs explicitly;
legacy amount-only requests are rejected. Existing ledger history is not migrated.

## Correcting a legacy zero charge to CREDIT

This workflow replaces the previous direct edit of an unpaid positive credit charge. **Only
an existing zero parcel charge** can be corrected. Positive charges cannot be edited here.
New parcel creation still rejects zero charges.

1. A staff member with **CanUpdateParcelCharge** opens Parcel Details → Payments → Charges
   → **Request charge correction**. The button appears only for a zero charge.
2. Enter the proposed GHS charge, a reason (3–500 characters), and tick **Record this charge
   as CREDIT owed by the parcel sender**. The sender's credit account is shown automatically;
   there is no person or staff selector. The sender must already be credit eligible.
3. Submit for approval. The request is pending; the parcel charge, payment method, customer
   balance, receipts and stickers remain unchanged.
4. A different staff member with **CanApproveParcelCharge** opens **Parcel Charge Approvals**
   (`/parcels/charge-approvals`) from Parcel Management. Review the proposed amount, CREDIT
   status, customer, requester and reason. Choose **Approve and apply**, or reject with a reason.
5. Approval atomically sets the positive charge and method CREDIT, keeps the receiver amount
   at zero, posts the sender's credit CHARGE and records the approver/requester audit. No third
   execution permission or extra apply step is required. Rejection leaves financial records unchanged.

The two permissions are separate role grants. `CanUpdateParcels` and reconciliation approval
permissions do not grant either action. Assign the new permissions to the intended roles; no
new grants are automatically assigned by the migration. The backend rechecks live active staff
and non-deleted role grants, including for native sessions with older permission snapshots.
A requester with both grants still cannot approve their own request.

`PATCH /v1/shipments/parcels/:id/credit-charge` now accepts `{ chargeCedis, expectedChargePsw: 0,
method: 4, reason }` and returns HTTP **202** `{ id, status: "PENDING_APPROVAL" }`.
`GET /v1/shipments/parcels/charge-corrections` accepts page, search and parcelId, returning
`{ data, hasNextPage }` with 20 records per page. Staff with either dedicated permission can
read company-scoped requests. `POST /v1/shipments/parcels/charge-corrections/:id/review` requires the
approval grant and accepts `{ approve: boolean, note?: string }`; rejection needs a 3–500
character note. The approval page itself requires the approval grant.

The server locks the request, sender account and parcel, then rechecks all conditions. A changed
sender/method, nonzero charge/receiver balance, principal payment, existing parcel credit entry,
open reconciliation case, deleted parcel/customer, delivered/returned/cancelled/disposed state,
electronic payment method, blocked credit account or insufficient credit blocks the correction
(409). Existing credit ledger entries, including zero entries, require Accounts review rather
than replacement. An inactive requester also blocks approval. Only one pending request per parcel
is allowed; duplicate or concurrent approvals cannot create duplicate debt. Audit failure rolls
back approval, parcel changes and credit posting. Missing/foreign requests return 404; invalid
inputs return 400; missing permissions return 403.

Migration `0091_parcel_charge_correction_approvals.sql` adds the request table with a unique
pending-request index and review/amount constraints. It does not correct production parcels or
change existing balances. Deploy the migration before the updated frontend/backend.
The shared web interface is also used by desktop; no new native mobile screen is added. Native
API clients must adopt the pending-request contract. Legacy direct positive-charge edits fail.

## Change history and reasons

**Parcel Details → History** keeps the request, approval/application, and rejection as separate
entries after the correction is complete. Each entry records the actual event time and staff
identity. It shows the original and proposed/applied charge, old/new payment method, reason,
request reference, and approval or rejection note. Approved entries also identify the requester.
The credit account name is captured in the request/approval audit metadata for later review.
Pending/rejected entries clearly state that no financial change took effect.

**Parcel Charge Approvals** retains reviewed requests, reasons, requester and reviewer names,
request/review timestamps and notes. Search by booking/tracking code and paginate older records.
The audit is written in the same transaction as each successful request or decision; it cannot
report an approved change if the parcel/debt update rolls back. There is no user-facing edit or
delete endpoint for request reasons or audit history. Parcel History uses existing parcel-read
permissions; request/review permissions remain separate from viewing permitted parcel history.

## Customer parcel payment labels

Customer profile → Transactions shows **Paid**, **To Be Paid**, **Partial**, or **Credit**.
Cash/electronic parcels use only active, non-credit principal payments; voided payments and
fee payments do not count. CREDIT parcels remain Credit until sender principal debt has been
fully allocated from actual credit payments, then show Paid. A phantom cash principal row does
not label a CREDIT parcel as Paid. Credit receipts retain their original booking classification.

A zero cash charge shows **Charge missing** instead of Paid. A zero CREDIT charge shows Credit
and a Charge missing warning. Pending corrections do not change the displayed status until approval.
The transaction API returns `paymentStatus`, `paidPrincipalPsw` and `creditPaidPsw` for both sender
and receiver views. Status is determined from that parcel's records, not customer-wide totals.

Existing historical ledger ADJUSTMENT entries remain supported by open-item and sticker queries;
this zero-charge workflow posts a new CHARGE only when no parcel credit entry exists. Migration
0090 remains an adjustment lookup index and does not authorize direct charge editing.
