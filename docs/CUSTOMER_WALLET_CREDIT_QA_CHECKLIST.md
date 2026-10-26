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

1. Select a customer. Verify outstanding parcels show booking/tracking codes and amounts,
   including parcels older than 30 days. Switch customer and confirm selection/amount reset.
2. Select one GHS 50 parcel and enter 50.00. Submit; verify its allocation is 5,000 psw,
   its debt disappears, and customer balance and wallet outstanding decrease by 5,000 psw.
3. Select GHS 50 and GHS 25 parcels; 75.00 must settle both in full. Other parcels stay open.
4. Try missing selection, repeated IDs, 0, negative, 74.99, 75.01, and 75.001: no payment,
   allocation, or successful audit should be written. Test API calls as well as form controls.
5. Repeat a successful submission and send two concurrent submissions: only one payment
   may allocate the selected debt. Change a charge before submitting; an old total must fail.
6. For a historical partially paid parcel, only its full remaining balance may be paid.
7. Verify another company's parcels/customers cannot be selected or paid. Cancelled/deleted
   parcels and manual charges without parcel references must not be offered.
8. Verify a conflicting existing principal payment blocks settlement for finance review.
9. Repeat from the CRM Payments tab. History date filters must not hide old payable parcels.
10. An older payment with unallocated credit must block a new collection for finance review.
11. Simulate audit failure: payment and allocations must both roll back.

## Customer tabs and credit charge changes

1. Customers → Individual/Business: verify type filtering, search, counts, and pagination.
   Change tab on page 2: it must reset to page 1 without mixing customer types.
2. Create a parcel with zero/negative charge, including self-service agent completion and
   direct booking API requests: reject. GHS 0.01 remains valid.
3. Parcel details → Charges → Update credit charge: increase/reduce an unpaid CREDIT
   parcel with a reason. Verify parcel amount, account balance, open items, wallet total,
   and sticker credit verification agree. Original charge rows must be unchanged.
4. Reject stale expected charges, zero, fractional pesewas, amounts over GHS 100,000,
   missing/ambiguous credit records, any allocation, and any active principal payment.
5. Try an increase beyond the credit limit or for a blocked customer: reject. Reductions
   remain allowed. After debt settlement, credit-charge editing must fail.
6. Users without `CanUpdateParcels` cannot call the charge endpoint. Payment/open-parcel
   endpoints require their respective CRM/finance permissions and tenant scope.
7. Apply migration 0090 in a test database and confirm the adjustment lookup index exists.

Automated coverage: `tests/server/customer-credit-settlement.spec.ts` (dedicated local
PostgreSQL only), `tests/utils/customer-credit-settlement.spec.tsx`, and
`tests/utils/parcel-charge-policy.spec.ts`. Browser interaction/responsive checks above
remain manual when browser automation is disabled.

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
