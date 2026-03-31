# Customer Wallet / Credit Control QA Checklist

## Preconditions

1. Enable `customer_wallet_credit` in company modules.
2. Ensure user role has:
   - `CanReadCustomerWalletCredit`
   - `CanCreateCustomerWalletCreditPayments`
   - `CanApproveCustomerWalletCreditControls`
3. Ensure there are business customers with credit transactions.

## Route Separation

1. Open `/customer-wallet-credit/accounts` and confirm account list renders.
2. Open `/customer-wallet-credit/payments/new` and confirm create form renders.
3. Open `/customer-wallet-credit/approvals` and confirm approvals queue renders.
4. Confirm each page has distinct purpose (list/create/approvals).

## Accounts List

1. Search by customer name/phone/email.
2. Filter by credit status (enabled/blocked).
3. Toggle overdue-only filter.
4. Confirm pagination next/previous works.
5. Verify outstanding/balance and overdue days look correct.

## Payment Create

1. Select a customer and enter a valid amount.
2. Submit and verify success toast.
3. Confirm account list reflects updated balance/outstanding.
4. Try invalid amount (0 or negative) and verify validation blocks submit.

## Approvals

1. Confirm queue returns only actionable rows.
2. For `BLOCK_RECOMMENDED`, click `Block credit` and verify success.
3. For `UNBLOCK_RECOMMENDED`, click `Enable credit` and verify success.
4. Confirm row state updates after action.

## Module Gate

1. Disable `customer_wallet_credit` in company modules.
2. Confirm `/customer-wallet-credit/*` pages are blocked in private layout.
3. Confirm customer wallet links are hidden in sidebar.
4. Confirm `/v1/customer-wallet-credit/*` returns module-disabled error.
