# Parcel Tax Data Generation

## Entry point and purpose

Open **Tax Computation & Filing → Tax Data Generation** at `/accounting/tax-data`.
This implements the legacy `complete_vipex` TaxStats workflow: count by paid amount,
load records, build an export list, download Excel, and confirm selected tax data.
It uses this application's recorded payment tax structure and integer pesewa amounts.

The shared React page runs on web and desktop. No native mobile page is introduced;
the page adapts to narrow browser widths. Filters remain in a dialog with route/date controls first;
Count and Get data close the dialog and load results on the main page. There is no print view.

## Permissions and module scope

- Every endpoint requires authentication, `CanReadAccounting`, and the enabled
  `accounting` company module, matching existing accounting route gating.
- Confirmation additionally requires **`CanConfirmParcelTaxData`**, a new dedicated
  catalog permission. Assign it through role management to intended tax-data reviewers;
  read/export access does not grant confirmation and no existing role is auto-granted it.
- Company and actor always come from authentication. Head office may select all company
  source branches or one branch. Other users are forced to their authenticated source
  branch, including when another `branchId` is submitted. Both may filter a destination
  branch within the company using `destinationBranchId`. Missing context is forbidden.
- Selected-record export and confirmation recheck company/source-branch scope separately
  from the filter UI. Head office may combine authorized branches in an export list;
  branch users cannot export or confirm records outside their source branch.
- The current accounting resolver prefers explicit `company_modules` state over the
  legacy `companies.use_accounting` flag. A disabled explicit accounting module rejects
  the request. Changing only the legacy flag does not override an enabled module.

## Record and tax definitions

One row represents **one parcel**, identified by parcel ID and tracking code. Parcels
sharing a booking/invoice remain separate rows. This fixes the legacy first-parcel-only
export behavior and prevents duplicate booking totals from being added to every parcel.

The booking date is an inclusive Ghana/UTC civil day based on `parcels.created_at`.
It is not payment receipt date or filing-period posting date. Tax amounts and confirmation
reflect current records for that booking cohort.

Only parcels with positive recorded principal paid are eligible. Principal combines
sender and recipient payments in the parcel company, excluding voided payments and
all non-principal components (delivery/storage/other fees). Unpaid parcels, deleted
parcels, and other companies' parcels are excluded. Receiver balances or customer credit
ledger charges without a corresponding payment record are not treated as collected cash.

The export uses saved payment snapshots: gross principal, net, VAT, GETFund, NHIL,
COVID, and total tax. It does **not** recalculate historical payments from today's tax
profile or copy the legacy calculator's rates. Payment creation already applies the
company tax profile/components or the existing fallback engine.

**Other tax** equals recorded total tax minus VAT, GETFund, NHIL and COVID. This preserves
custom/unmapped profile components without inventing a rate or discarding tax from totals.
Recorded zero COVID values remain zero; existing historical COVID amounts remain visible.
Export/confirmation require safe integer amounts, non-negative net/tax/other-tax amounts,
and `principal paid = net + total tax`. Inconsistent snapshots return a conflict for review.

All API money fields are pesewas. UI and Excel show GHS. Tax data is an operational export,
not a submitted return, recognized ledger revenue, or a replacement for the filing workflow.

## Count, get data, and export-list workflow

1. Open **Filters**, then choose **From branch → To branch**, a booking date (default today), and
   confirmation filter (default **All records**). Head office can select all source
   branches; branch users keep their own source. Either end may use its available All option.
2. **Count** lists every positive principal-paid amount and its number of occurrences
   for the applied route/date/confirmation scope, ordered by amount. One occurrence is
   one paid parcel, not one payment record. Counts ignore the amount and occurrence cap;
   they are not a top-N sample. Unpaid zero-amount parcels are excluded.
3. Enter **Amount paid (GHS)** and **Maximum occurrences** (default 50, whole number 1–500),
   then **Get data** to retrieve that exact amount. Selecting an amount's occurrence count
   fills the amount and loads it using the current valid maximum and the applied route/date.
   For example, if GHS 100 occurs 19 times and maximum is 10, counts still show 19 but
   records contain at most 10 parcels. The server caps the entire result across pages,
   not just the page size; results use stable booking-time/parcel-ID order.
4. Add individual parcels or **Add this page to export list**. The list persists across
   filter, amount, date and page changes while the page remains mounted. It deduplicates
   by parcel ID; adding a refreshed record updates its snapshot. Maximum: 500 parcels.
   Remove individual rows or **Reset export list** without modifying database records.
5. **Export Excel** downloads a genuine `.xlsx` workbook from the server. Monetary cells
   are numeric with two decimal places; telephone numbers and formula-like text are
   stored as strings. Export headers and row values use the same column definition,
   including NHIL, COVID, Other tax, total tax, payment count and confirmation state.
6. Review **Confirm tax data**. The confirmation dialog shows selected count, principal,
   and tax totals. Confirmation updates the selected parcel flags transactionally and
   records an audit event. Successful confirmation refreshes the applied report and
   keeps the selected list available for export.

Editing filters does not request data or change the applied results until Count/Get data.
Cancel/Escape closes the dialog without loading results.
Count needs the route/date only and remains available when the detail amount/cap is invalid.
Get data requires a positive exact amount (up to two decimal places) and a valid occurrence cap;
invalid fields show validation text and disable Get data. Dates are validated on the server.
Pages contain at most 100 records and never exceed the requested total cap. API pagination is
bounded to integer pages 1–10000 and 1–100 records; `maxOccurrences` defaults to 500 when
omitted by an API caller. No silent export-list truncation occurs.

Empty cohorts and empty result pages show explicit messages. Read failures show retry
instructions; Refresh uses the applied scope. Export and confirmation failures preserve
the list and display the server error. Selection is local page state and is cleared by
unmounting; it is not persisted to local/session storage.

## Revalidation and confirmation semantics

The client submits only `{ parcelId, version }` for each selected record. A SHA-256
version covers export metadata, saved principal/tax amounts, and contributing payment
IDs. It excludes the confirmation flag so a repeated confirmation can be idempotent.
The server never trusts amounts or company scope supplied by the client.

Changed payments, voids, corrected customer/parcel export metadata, unavailable/deleted
parcels, or unauthorized branch selections reject the operation. Changed records return
409; unavailable scope returns 403. Reload and add refreshed records again. All selection
rows are checked before mutation. A mixed valid/invalid selection has no partial success.

Confirm locks selected parcel rows in stable ID order, marks only previously unconfirmed
rows, and writes one `CONFIRM_PARCEL_TAX_DATA` audit event with IDs, submitted versions,
actor and totals in the same transaction. Retrying an already confirmed unchanged list
returns `alreadyConfirmed` without another audit event. Audit failure rolls back flags.

Confirmation uses the existing `parcels.tax_report_confirmation` flag. Bookings have no
such field in this app; no booking-header tax flag is introduced. Confirmation does not
change payments, tax journal statuses, filing periods, or accounting entries.

The flag is parcel-level rather than a persisted payment-batch snapshot. A later payment
or void does not automatically clear a previously confirmed parcel flag. Use Confirmed
or All records to review/re-export updated records; confirmation is not a guarantee that
future payments have been reviewed. No new schema or data migration is required.

## API

All paths below are relative to `/v1/accounting`:

| Method and path          | Request                                                                                           | Response                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `GET /tax-data/options`  | Authenticated scope                                                                               | `{fromBranches,toBranches}` of `{id,name}`                   |
| `GET /tax-data/counts`   | `date`, `confirmation`, optional `branchId`, `destinationBranchId`, `amountPsw`, `maxOccurrences` | `filters`, `generatedAt`, paid-amount `groups`, tax `totals` |
| `GET /tax-data/records`  | Same filters plus optional `page`, `limit`                                                        | `filters`, `rows`, `page`, `limit`, `hasMore`                |
| `POST /tax-data/export`  | `{rows:[{parcelId,version}]}`                                                                     | XLSX attachment with `Cache-Control: no-store`               |
| `POST /tax-data/confirm` | Same bounded selection                                                                            | `{confirmed,alreadyConfirmed,rows}`                          |

`confirmation` accepts `all`, `confirmed`, `unconfirmed`. `amountPsw` is a positive safe
integer and affects records only; count distributions remain complete. `destinationBranchId`
filters the destination in addition to the authenticated/selected source. `maxOccurrences` is
a whole number 1–500 and caps records across pages; it does not limit counts. The UI requires
an exact paid amount for Get data; the API retains optional `amountPsw` for all-amount callers.
Options expose company destinations to branch staff while restricting their source options. Selection size
is 1–500 distinct IDs, with a 64-character hex version per row. Missing authentication
is 401; missing grants/module/scope is 403; invalid queries/selections are rejected;
stale or unbalanced selected records return 409.

## Validation and QA

Pure tests cover branch/date/pagination/money validation, historical snapshot preservation,
custom tax representation, version sensitivity, balancing, list deduplication/capacity,
and Excel structure/header alignment, XML escaping, leading-zero phones and formula safety.

```sh
bun test src/server/features/accounting/tax-data/scope.test.ts src/server/features/accounting/tax-data/rows.test.ts src/server/features/accounting/tax-data/workbook.test.ts src/features/accounting/tax-data/utils/tax-data.test.ts
```

PostgreSQL/API integration tests: `tests/server/parcel-tax-data.spec.ts`, enabled with
`PARCEL_TAX_DATA_TEST=1` and `TEST_DATABASE_URL=postgres://localhost/vipex_tax_data_test`.
The fixture requires this dedicated empty local database, creates isolated schema tables,
and drops its tables afterward. It never targets normal application databases.

Manual scenarios:

1. Head office: Count across all routes, then choose Accra → Kumasi and verify both
   route ends narrow counts/data. Verify a different destination returns its own cohort.
2. Branch staff: request another branch in counts, records, export and confirmation;
   verify source-branch enforcement, including mixed valid/foreign IDs.
3. Verify multiple parcels in one invoice remain separate, and sender/recipient principal
   payments combine while voided, deleted, unpaid and delivery-fee-only rows are excluded.
4. Change current tax profile after a recorded payment; verify export still matches its
   saved receipt amounts, including custom Other tax and historical COVID values.
5. Add the same page twice and mix dates/pages; verify no duplicate parcel and the 500-row limit.
6. Change/void a selected payment after loading; verify export/confirm rejects the stale
   version and leaves confirmation flags unchanged for the whole batch.
7. Export and open Excel: compare every header/value, numeric GHS formats, leading-zero
   phone strings and all tax columns. Export alone must not confirm parcels.
8. Confirm with the dedicated grant, retry unchanged data, and verify one audit event,
   selected flags only, unchanged tax-journal/filing status, and no duplicate audit event.
9. Remove the confirmation grant or disable accounting: verify server denial, not just
   button hiding. Verify read-only users can count/load/export but cannot confirm.
10. Verify filter-dialog Cancel/Escape, loading/error/empty states, keyboard navigation, narrow
    layouts, and horizontal table scrolling. Editing a field alone must not request data.
    Refresh and re-add stale rows before retrying.
11. Choose an amount with 19 occurrences and maximum 10: Count must still show 19;
    Get data and pagination must expose at most 10. Test caps 1, 101, 500 and invalid
    0/fractional/501 values; a cap above availability returns only available records.
12. Leave amount blank/invalid or cap invalid: Get data is disabled; Count still works.
