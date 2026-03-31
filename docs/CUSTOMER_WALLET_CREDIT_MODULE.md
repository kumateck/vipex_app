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
