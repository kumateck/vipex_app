# Reconciliation QA Checklist

## Preconditions

1. Enable `reconciliation` in company modules.
2. Ensure user role has:
   - `CanReadReconciliation`
   - `CanCreateReconciliationSessions`
   - `CanApproveReconciliationSessions`
   - `CanCreateReconciliationBankSettlements`
   - `CanApproveReconciliationBankSettlements`
3. Ensure at least one branch exists.

## Route Separation

1. Open `/reconciliation/sessions` and confirm session list renders.
2. Open `/reconciliation/sessions/new` and confirm create form renders.
3. Open `/reconciliation/sessions/approvals` and confirm approvals page renders.
4. Open `/reconciliation/bank-settlements` and confirm settlement list renders.
5. Open `/reconciliation/bank-settlements/new` and confirm settlement create form renders.
6. Open `/reconciliation/bank-settlements/approvals` and confirm settlement approvals page renders.

## Session Reconciliation

1. Create a new session reconciliation entry.
2. Confirm it appears in session list with `Draft` status.
3. In approvals, click `Approve` and confirm status becomes `Confirmed`.
4. In approvals, click `Finalize` and confirm status becomes `Posted`.

## Bank Settlements

1. Create a new settlement record with expected and banked amounts.
2. Confirm variance is visible in list.
3. In settlement approvals, click `Approve` and confirm status updates.
4. Create another settlement and reject with reason; confirm rejection is saved.

## Module Gate

1. Disable `reconciliation` in company modules.
2. Confirm `/reconciliation/*` pages are blocked in private layout.
3. Confirm reconciliation links are hidden in sidebar.
4. Confirm `/v1/reconciliation/*` endpoints return module-disabled error.

## Parcel reconciliation booking-code search

This is the separate **Parcels → Reconciliation Cases** workflow, using the shared parcel search.

1. After deploying/restarting the backend, open Create Reconciliation Case and search a known
   booking code as an officer in its source branch, then its destination branch. Verify the
   expected booking/tracking codes and amounts; repeat the search for a linked duplicate.
2. Verify a missing booking produces an empty result, and company/branch filters remain applied.
3. Confirm there is no generic "Something went wrong" response or PostgreSQL `53100` log under
   concurrent searches. New app connections must have `max_parallel_workers_per_gather=0`.
4. Use the read-only diagnostic described in [Parcel search performance](PARCEL_OPERATIONS.md#parcel-search-performance)
   to compare a failing production code with serial execution. No schema/data repair is required
   for the shared-memory failure reproduced on 2026-10-19.
