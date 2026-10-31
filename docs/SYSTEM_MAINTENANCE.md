# System Maintenance Scripts

## Scope and access

**Technology → Maintenance Scripts** opens `/settings/maintenance` on web and desktop. Only the
normalized **System Admin** role sees the navigation item or page. There is no mobile-native
screen. The server checks the current active user and current, non-deleted System Admin role in
the database for every catalog, history, preview and execution request. Permissions on another
role do not grant access, and stale token role claims cannot bypass a revoked role or disabled
user. Each operation is restricted to the authenticated user's company; no company, database URL,
actor identity, command, executable path or SQL can be supplied through the UI.

This administrative tool has no additional company module gate. It does not grant ordinary
parcel/payment permissions. It uses the backend's configured application database connection.
No schema migration is required.

## Available scripts

The catalog contains **ten operations**, covering all currently identified booking-code
find/repair scripts plus the parcel financial-state repair already available in Operations.

| Operation ID                       | Script shown in the UI                  | Parameters                                         | Behavior                                                                                                     |
| ---------------------------------- | --------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `trace-credit-parcel`              | Trace parcel payments                   | Booking/tracking code                              | Read parcel state, payments, credit, tax and recent audit.                                                   |
| `repair-credit-print-payment`      | Repair credit payment from printing     | Booking code                                       | Void one erroneous sender cash principal payment, exclude unfiled tax and retain credit.                     |
| `scan-credit-conflicts`            | Find credit and cash conflicts          | Optional booking/tracking code                     | Inspect one parcel or scan up to 200 company candidates with a total count.                                  |
| `check-parcel-booking-search`      | Check parcel booking search             | Booking/tracking code                              | Run actual source/destination branch search queries and report counts, target match and timings.             |
| `inspect-cleared-delivery-fee`     | Find cleared delivery fees              | Booking/tracking code                              | Read returned doorstep deliveries, cleared fees, approved fee values, fee payments and return evidence.      |
| `backfill-parcel-customer-names`   | Repair missing parcel customer names    | Booking/tracking code                              | Fill NULL name snapshots from company-scoped customer records; retain existing names.                        |
| `restore-reversed-parcel-balance`  | Restore balance after delivery reversal | Booking/tracking code                              | Restore receiver balance after recorded delivery reversal, retaining every payment.                          |
| `fix-reversed-booking-to-be-paid`  | Repair reversed recipient payments      | Booking/tracking code                              | Void supported reversed/refunded recipient cash principal, exclude unfiled tax and restore receiver balance. |
| `repair-parcel-financial-state`    | Repair parcel To Be Paid balance        | Booking/tracking code                              | Recalculate receiver balance from charge minus all active principal; retain charge and payments.             |
| `repair-parcel-receiving-workflow` | Repair parcel receiving workflow        | Booking/tracking code, optional pickup location ID | Fill a missing destination pickup location and/or restore a proven called-pickup status regression.          |

Source coverage is recorded in the catalog and checked by `maintenance-catalog.spec.ts`:

- Existing credit trace/repair: `scripts/trace-credit-parcel.ts`, `scripts/repair-credit-print-payment.ts`.
- Booking search: `scripts/check-parcel-booking-search.ts`.
- Delivery-fee inspection: `scripts/delivery-fee-repair/inspect.ts`, adapted from a bulk report to one code.
- Customer-name backfill: `scripts/backfill-parcel-customer-names.ts`, adapted from bulk to one parcel.
- Reversal balance restoration: `scripts/run-repair-as7749418g.ts` and its SQL file,
  generalized from the historical fixed code to the supplied company-scoped code.
- Recipient-payment repair: `scripts/fix-reversed-booking-to-be-paid.ts`.
- Operations financial repair: `src/server/features/shipments/parcel-financial-repair.service.ts`.
- Receiving workflow repair: `src/server/features/maintenance/receiving-workflow/repair.ts`,
  generalized from the missing-location and called-pickup-regression repairs investigated on 2026-10-31.

CLI credit trace/repair wrappers share their implementation with the runtime tool. Other
operations use transaction-bound adapters with the additional restrictions below; they do not
execute the original CLI/SQL as a subprocess. Schema diagnostics, global backfills, migrations,
seeds, resets and build/deployment tools are excluded because they are not booking-code
operations. Adding an eligible script requires an adapter; the source-coverage test detects
unregistered booking-code scripts rather than silently hiding them.

### Repair validation

All new code-based adapters resolve a single active parcel in the authenticated company.
Matching is case-insensitive and accepts booking/tracking code. Multiple matches are blocked;
use a unique tracking code. Foreign/missing parcels return 404 without exposing foreign data.

- Balance repairs reject CREDIT parcels, delivered/cancelled/disposed states, invalid charges
  and inconsistent/overpaid principal totals. The reversal-specific action additionally needs
  status 5 or 10, recorded delivery reversal evidence and unpaid principal remaining.
- Recipient-payment repair requires recorded reversal evidence, status 5 or 10, cash principal
  collected before that reversal, and explicit confirmation that collections were reversed or
  refunded. Electronic/MoMo collections, recipient fees, inconsistent totals, filed/reviewed tax,
  posted journals and saved cash confirmations block it for Accounts review. Sender payments
  remain active. Only matching unfiled tax is excluded; actor and before-state are audited.
- Name backfill fills NULL snapshots only. It never replaces non-empty historical names.
  Missing/blank source customer names or a cross-company customer reference block it.
  The optional second-receiver snapshot is cleared when no second receiver is linked. Existing
  blank snapshots also require customer-data review rather than bypassing the name trigger.
- Inspections never change financial or operational data. Booking-search queries run on the
  same read-only transaction as the maintenance operation. Delivery-fee inspection does not
  infer or restore a fee automatically from incomplete evidence.

No changes are applied when the preview is blocked or reports an already-correct state.

### Receiving workflow repair

Select **Repair parcel receiving workflow** and enter the booking or tracking code. This covers
two independent cases and can apply both changes in one transaction:

- A parcel with no pickup location gets the destination branch's sole active, receiving-enabled
  location. If several or no eligible locations exist, the preview is blocked and lists
  `availableLocations` in record details. Enter the correct optional **Pickup location ID** and
  preview again. The server validates the supplied ID against the parcel's company and destination;
  an existing pickup location is never replaced. Circle is not hardcoded.
- An **Arrived at Destination** parcel with a saved call marker is restored to **Awaiting Pickup**
  only when its most recent `PARCEL_UPDATED` status audit records **Awaiting Pickup → Arrived at
  Destination** at or after that call. Missing evidence, another latest status transition, or a
  regression before the call blocks the repair. An uncalled arrived parcel keeps its status.

Only Arrived at Destination and Awaiting Pickup parcels are supported. Deleted/confirmed parcels,
completed delivery or rider handover evidence, and non-returned home-delivery records block repair.
The admin must confirm the previewed location and that the parcel is still awaiting collection.
Caller assignment, call marker, receipt timestamp, payments, and shelf-picker assignments are
preserved. A missing stored receipt timestamp remains a known limitation; this operation does not
infer one from the audit fallback displayed by parcel search. New arrival and booking paths now
prevent these inconsistencies; see [arrival consistency](PARCEL_OPERATIONS.md#pickup-location-and-arrival-consistency).

Filling the correct location restores eligibility for that location's Call Center Assignment
search when the parcel is uncalled. It does not assign a caller. Restoring Awaiting Pickup restores
Shelf Picker Update search eligibility while retaining the called marker, so the parcel remains
excluded from the default uncalled assignment/calling queues. In Transit still excludes arrived
and awaiting-pickup parcels. Repeated previews of repaired records report no supported changes.

Execution uses the existing company/admin-bound preview, confirmation, fingerprint, serializable
transaction and preview-consumption rules. Changes to the parcel, caller/call marker, eligible
locations, delivery evidence or latest status audit invalidate the preview. The parcel is locked
and `PARCEL_RECEIVING_WORKFLOW_REPAIRED` records the admin, before/after state, exact changes and
supporting evidence atomically with the repair. Audit failure rolls everything back. The console
is available on web and desktop; repaired data is shared with mobile, which has no maintenance UI.

## Workflow

1. Select a script. Enter its parameters, if any.
2. Choose **Run inspection**, or **Preview repair** for an operation that changes records.
3. Review the result and expand **View record details** for the saved records.
4. For repairs, tick the operation-specific confirmation shown with the preview, then choose
   **Execute repair**. Credit-print repairs still require explicit confirmation that no cash was received.
5. Review the execution result and reprint the corrected parcel documents.

For credit-print repair, the booking code is sufficient. The backend discovers the company-scoped parcel,
matching cash payment, amount and sender credit charge. The logged-in System Admin supplies audit
identity automatically. The original credit charge and operational parcel status are preserved.
The repair retains the safeguards described in [Parcel Printing](PARCEL_PRINTING.md#credit-printing-and-historical-repair).

Changing the script or a parameter clears the preview and confirmation. History results can be
viewed but cannot authorize a repair. The server requires a successful, ready preview of the same
operation and parameters, created by the same admin in the same company within the last ten
minutes. Execution rechecks the records and compares the plan fingerprint. A changed plan requires
a fresh preview. A successful execution consumes its preview atomically; it cannot be reused.

## Execution, audit and failures

Runs execute synchronously on the server. Inspections use read-only repeatable-read transactions;
they still create maintenance audit records. Repairs use serializable transactions and preserve
the existing parcel/payment/tax audit writes. A company-level transaction lock prevents two
maintenance repairs from executing concurrently. Statements time out after 15 seconds and lock
acquisition after 3 seconds.

Every accepted run creates an `audit_logs` entry with `entity_type = maintenance_run`, its script,
parameters, mode, initiating admin, timestamps, status and result or error. A repair's business
changes, success audit and preview consumption commit together. A success-audit failure rolls
back the repair. Failed attempts retain a failed run entry without partial financial changes.
Forbidden/invalid requests do not start runs. No new run-history table or background worker is used.

**Recent runs** shows the latest 20 runs in the current company, with the initiating admin and a
result viewer. The history cache is separated by company and user and discarded when unused.
Use **Refresh** to reload it. A process interruption can leave a run marked **Running / interrupted**;
inspect its records/history before retrying. Closing a browser does not undo an accepted server
operation. There is no offline execution or automated retry of repairs.

Missing parcels, multiple matches, extra active principal payments, an unsupported payment
method, missing or allocated credit, filed/reviewed tax, posted journals and saved daily cash
confirmations block repair. These cases require Accounts review. Unknown scripts, unsupported
parameters and shell-like code values are rejected. Network errors are shown inline; parameters
are retained, and a failed repair requires a new preview. Database errors use a generic message
without connection credentials or SQL text.

## Adding another maintenance operation

Add a reviewed descriptor (including source file paths and repair confirmation text) to
`src/shared/maintenance/catalog.ts` or `booking-catalog.ts`, its literal ID to shared types, and a
handler to the server registry. The route schema derives its supported IDs from the catalog. Define its allowed parameters in
validation and its company scope in the handler. Reuse a service from the matching CLI script
rather than executing the CLI through a shell. Mutations must support a read-only preview,
stable plan fingerprint, server-derived actor, transactional audit, idempotency and rollback.
Add authorization, isolation and behavior tests, and update this catalog and API documentation.

## QA

- Confirm System Admin access with no additional permissions; deny ordinary roles even with
  broad company-management permissions. Disable the admin or revoke/delete/move the role and
  retry with an old token. All endpoints must deny access.
- Trace a valid booking/tracking code; handle missing records and same-code parcels in another
  company. Scan conflicts and confirm other companies' records are absent.
- Preview a credit repair, confirm no cash was received and execute. Verify the payment is
  voided, tax is excluded, original credit and transit state remain, and the actual admin is audited.
- Reject a missing, expired, consumed, different-admin or changed-parameter preview. Change the
  payment/tax/credit plan after preview and confirm execution is blocked.
- Fail the success audit and verify payment/tax changes and preview consumption roll back.
- Check script switching, parameter changes, history viewing, repeated clicks, loading, empty,
  error and retry states, keyboard focus, narrow screens and dark appearance.

Automated coverage: `maintenance-console.spec.ts` (unit and server suites), CLI repair/options
tests, `maintenance-catalog.spec.ts`, and existing payment/printing tests. The additional booking
operation suite uses `MAINTENANCE_BOOKING_TEST=1` and the empty local database
`vipex_maintenance_booking_test`; it covers repairs, evidence/tenant validation, name triggers,
read-only inspections and audit rollback. Existing server integration tests require
`MAINTENANCE_CONSOLE_TEST=1` and `TEST_DATABASE_URL` pointing to the empty local database
`vipex_maintenance_test`. The fixture refuses other database names and remote hosts. Never run
write tests against the configured production `DATABASE_URL`.

Additional QA: confirm all ten entries and their booking-code inputs are visible on narrow and
wide screens; select each repair and check its confirmation text matches the operation. Enter
another booking code after preview and verify execution is unavailable until previewed again.
Inspect a cleared delivery fee without changing it. Test financial repairs with sender/recipient
payments, a fully paid parcel, CREDIT, reversed delivery, filed tax and a missing customer name.
Browser interaction remains a manual check when local browser automation is disabled.

Receiving QA: preview a missing-location arrived parcel without modifying it; execute and verify
its location-scoped assignment search. Preview a called pickup regression, execute, and verify
Shelf Picker Update while preserving caller/call history. Test both repairs together; multiple,
foreign, source-branch, deleted and non-receiving locations; missing/old/superseded regression
evidence; delivered/deleted/progressed parcels; stale previews; repeat runs; and audit rollback.
Automated cases live in `receiving-workflow/plan.test.ts` and the receiving cases in the isolated
`maintenance-booking-operations.spec.ts` suite. Catalog/render tests verify the new operation,
optional location input and confirmation through the existing maintenance page.
