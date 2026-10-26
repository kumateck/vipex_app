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

## Updating an unpaid credit charge

Open parcel details → Charges → **Update credit charge**. `CanUpdateParcels` is
required on the action and `PATCH /v1/parcels/:id/credit-charge` endpoint. Submit
`chargeCedis`, `expectedChargePsw` from the displayed parcel, and a 3–500 character
reason. The charge must be GHS 0.01–100,000 with at most two decimal places.

The parcel must be active, fully CREDIT, and have one unambiguous sender credit
charge matching its current parcel amount. Any principal payment or allocation
blocks the change, including legacy partial allocations. A stale expected amount,
missing/inconsistent ledger, or an increase beyond approved available credit returns 409. Blocked customers can have charges reduced but cannot increase them.

The change atomically updates the parcel, appends an immutable ADJUSTMENT referencing
its original CHARGE transaction, and records before/after amounts and reason in audit.
Open credit items, wallet outstanding totals, and sticker verification include these
adjustments. Direct parcel edits and original-session cash reconciliation cannot
change credit charges; use this dedicated action.

Migration `0090_credit_adjustment_reference_index.sql` adds a partial lookup index
for adjustments. Apply it using the normal vetted migration process. No balance or
historical allocation data is rewritten by this migration.
