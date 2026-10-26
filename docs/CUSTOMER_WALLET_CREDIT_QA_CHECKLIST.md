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

## Customer tabs, payment labels and zero-charge correction approvals

1. Customers → Individual/Business: verify type filtering, search, counts, pagination reset.
2. Customer Transactions: show Paid/To Be Paid/Partial/Credit using recorded principal
   payments and credit allocations. Void a cash payment and confirm it no longer counts.
   CREDIT with a phantom cash row must still show Credit until fully settled in credit ledger.
3. Zero cash charge must show Charge missing, never Paid. Zero CREDIT shows Credit plus
   Charge missing. Pending requests do not change either label.
4. New zero/negative parcel charges are rejected, including self-service completion and APIs.
5. Grant CanUpdateParcelCharge only: Request charge correction appears on zero charge in
   Parcel Details → Payments → Charges. Positive charges have no correction button. Enter
   a positive amount, reason and explicitly confirm CREDIT. No person/staff selectors.
6. Submit and verify 202/PENDING_APPROVAL: parcel amount/method and customer ledger unchanged.
   A second pending request must fail. The parcel sender must have approved available credit.
7. Grant CanApproveParcelCharge to another active user. Open Parcel Charge Approvals; verify
   booking, customer, proposed CREDIT amount, requester and reason. Approve and apply: parcel,
   credit charge and audit change together. Confirm the request is no longer pending.
8. Even with both grants, self-review must fail. General parcel-update/reconciliation permissions
   alone must not allow requests or approvals. Revoke a role grant and retry with an old session.
9. Reject with a reason: parcel finances unchanged, rejection audited, new proposal permitted.
10. Change charge, sender, method, credit eligibility/limit or add a payment before approval:
    approval must fail. Existing credit entries, conflicting reconciliation, deleted/delivered/
    returned/cancelled/disposed parcels and electronic methods must also be blocked.
11. Send concurrent requests/reviews and repeat approval: only one pending request and one
    debt charge. Simulate audit failure and confirm parcel, ledger and request status roll back.
12. Verify foreign company requests/parcels are inaccessible. Inspect request history for actual
    requester/reviewer attribution; none may be supplied by the request body.
13. Apply migration 0091 in a test database and validate pending uniqueness, positive charge,
    review-state and independent-review constraints. Deploy the migration before the code.
14. Parcel Details → History must show requested/approved/rejected events, old/new amount and
    method, reason, actual requester/approver and timestamps after completion. Approval page
    retains review notes and history; pending/rejected events must not imply a financial update.
15. Manually verify narrow/wide layouts, dialog keyboard focus and loading/error/retry states
    when browser automation is unavailable.

Automated coverage: `parcel-charge-approvals.spec.ts` uses CHARGE_APPROVAL_TEST=1 and the empty
local `vipex_charge_approval_test` database; exercises the actual migration, installed name
trigger, request/approval API, locks, audit rollback and payment labels. Debt settlement retains
`customer-credit-settlement.spec.ts` on its dedicated local database. UI/money checks include
`parcel-payment-status.spec.ts`, `customer-credit-settlement.spec.tsx` and
`parcel-charge-policy.spec.ts`. Never run write tests on production DATABASE_URL.

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
