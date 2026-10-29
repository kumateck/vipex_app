# Parcel Analytics

## Access and clients

Open **Insights → Parcel Analytics** at `/reports/parcels/analytics`.
The page and both API endpoints require `CanViewReportParcelsStatusSummary`.
There is no additional BI module gate or new permission to seed.
Web and desktop use the shared React page. No native mobile screen is added.

Company scope always comes from authentication. Head-office users may compare all
company branches or select one branch. Other users are forced to their authenticated
branch on the server, including when a different `branchId` is supplied. Missing company
or non-head-office branch context is forbidden. Branch users' branch options contain
only their own branch. Head office receives company-scoped options without requiring
user-administration or branch-administration permissions.

## Workflow and filters

Open **Filters** in the page header to edit filters in a dialog. The default draft period
is the last 30 calendar days, including today. Select a booking date range, choose
**Outgoing · booking branch** or **Incoming · destination branch**, and select
**Apply filters**. Applying closes the dialog and loads results on the main page. Head office can also filter branch scope, origin, and destination.
All users can filter current parcel status. Both date endpoints are inclusive Ghana/UTC
calendar days. A single day and periods up to 366 days are supported. Impossible dates,
reversed ranges, longer periods, unknown statuses, and unsupported branch bases reject.

Filters select parcels by **creation date**. Status, principal balances, and collection
age reflect current records at query time; this is not a historical end-of-period snapshot.
Draft edits do not change displayed results or exports until applied. Cancel, Escape,
and closing the dialog leave the applied report unchanged and do not request analytics;
draft selections remain available when the dialog is reopened. Applying unchanged
filters refreshes the report, including after a failed request. Empty cohorts show an
explicit empty state; failed requests show an error rather than fabricated zero totals.

Each parcel is counted once globally and once under the selected branch basis. Selecting
incoming changes attribution to destination; it does not add incoming and outgoing counts
together. Same-branch parcels are counted once. Deleted parcels and other companies' parcels
are excluded. Branch totals, status totals, and daily totals reconcile to the same cohort.

## KPI definitions

| Metric                     | Current definition                                                                                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Parcels booked             | Non-deleted parcels created in the selected range and matching all filters                                                                                             |
| Delivered / collected      | Current status `DELIVERED_BY_OFFICE` or `DELIVERED_AT_HOME`                                                                                                            |
| Completion rate            | Delivered / all filtered parcels × 100; zero for an empty cohort                                                                                                       |
| In transit                 | Current status `IN_TRANSIT`                                                                                                                                            |
| Awaiting collection        | Current status `ARRIVED_AT_DESTINATION`, `CUSTOMER_CONTACTED`, or `AWAITING_PICKUP`                                                                                    |
| Returned                   | Current status `RETURNED_TO_OFFICE`, `RETURNED_TO_SENDER`, or `RETURN_TO_SOURCE`                                                                                       |
| Uncollected 7+ days        | Awaiting-collection parcels with a receipt timestamp at least seven elapsed days ago                                                                                   |
| Parcel charges             | Sum of recorded booking charges, including any filtered cancelled/returned parcels; not cash receipts or recognized revenue                                            |
| Receiver outstanding       | Per-parcel `max(planned_tobepaid_psw − recognized delivery principal credit, 0)`                                                                                       |
| Volume vs previous period  | Percentage difference from the immediately preceding, equally long booking period, under the same branch/route/status filters; no baseline when previous count is zero |
| Average booking age        | Mean non-negative days since parcel creation, including completed parcels                                                                                              |
| Average booking to receipt | Mean creation-to-receipt hours for records where receipt is at or after creation; absent when no valid samples exist                                                   |

`planned_tobepaid_psw` already decreases when receiver cash is collected; payments are
not subtracted again. Recognized delivery principal credit follows Daily Parcel Audit's
existing rule: positive delivery-source charge transactions whose notes contain
`principal`, scoped to the parcel company. Storage/delivery fees and unrelated credit
are excluded. Amounts are returned in pesewas and displayed/exported in GHS.

Completion requires final office/home confirmation. Rider handover alone is not counted
as delivered. Cancelled and returned parcels remain in the denominator when included by
filters. Volume comparison uses **current** status in both booking cohorts, not historical
status or delivery-date activity.

## Views and drill-down

- **Status breakdown:** all 21 actual parcel statuses, parcel count, share, charges,
  receiver outstanding, average booking age, and uncollected 7+ day count.
- **Branch comparison:** count, completion, charges, receiver balance, collection flags,
  and a horizontally scrollable column for every status. Attribution follows branch basis.
- **Trends & aging:** zero-filled daily booking counts and awaiting-collection buckets
  of 0–3, 4–7, 8–14, and 15+ completed days since receipt. Missing receipt timestamps are
  excluded from aging, while those parcels still appear in awaiting-collection totals.
- Select a status count, branch total, or branch/status count to open matching parcels.
  The inline list has booking/tracking codes, status, branches, booking date, charges,
  and receiver balance, with 50-row pagination. Changing drill-down resets pagination.
- CSV exports applied status, branch, daily, and aging aggregates with filter metadata.
  CSV cells escape quotes and neutralize formula-leading text. Export does not include
  all parcel detail pages. Charts load on demand.

A seven-day collection flag is a reporting threshold, not a configurable SLA breach.
Average time in the current status, loss/damage rates, service-type filters, and dispatch-to-
receipt transit time are not implemented: parcel `updated_at` is not a reliable status-entry
timestamp, and booking-to-receipt time must not be presented as dispatch transit time.
No print view is implemented. No schema migration, background snapshot job, or parcel workflow mutation is introduced.

## API contract

- `GET /v1/reports/parcel-analytics`
- `GET /v1/reports/parcel-analytics/details`

Required query: `from=YYYY-MM-DD`, `to=YYYY-MM-DD`, and `basis=source|destination`.
Optional: `branchId`, `sourceId`, `destinationId`, numeric `status` (0–20).
Details additionally accepts integer `page` (default 1, maximum 10000).

Summary returns `filters`, `generatedAt`, `totals`, `previousParcels`, `volumeGrowthPct`,
`statuses`, `branches`, `branchOptions`, `trend`, and `aging`. Status rows contain metric
fields plus `status` and `share`; branch rows include `branchId`, `branchName`, and numeric
status counts. No unbounded parcel detail list or customer names/phones is returned.
Details returns `{ rows, page, hasMore }`, fetching at most 51 records to determine next-page
availability. Both endpoints use the same server scope and cohort predicate. Missing auth
is unauthorized; missing permission/scope is forbidden; invalid query/date/page is rejected.

## Validation and QA

Automated tests cover aggregation reconciliation, final delivery statuses, empty/zero
states, weighted averages, branch override attempts, missing scope, leap days and inclusive
date boundaries, CSV safety, PostgreSQL tenant/deletion filtering, principal credit handling,
route/status drill-down consistency, and pagination validation.

Run pure tests with:

```sh
bun test src/server/features/reporting/parcel-analytics/aggregation.test.ts src/server/features/reporting/parcel-analytics/scope.test.ts src/features/reporting/parcel-analytics/utils/export.test.ts
```

The opt-in integration suite is `tests/server/parcel-analytics.spec.ts`, enabled with
`PARCEL_ANALYTICS_TEST=1` and `TEST_DATABASE_URL` pointing to the dedicated empty local
`vipex_parcel_analytics_test` PostgreSQL database. The isolated fixture refuses other
hosts/database names or a populated database and removes its tables after the run.

Manual scenarios:

1. Head office: load all branches; reconcile KPI, branch, status, and daily counts.
2. Switch outgoing/incoming and verify the same parcel moves to its destination attribution.
3. Branch staff: submit another `branchId` directly; verify only the authenticated branch's
   outgoing/incoming parcels and branch options are returned. Repeat on details.
4. Filter status `0`, a route, and a single date; verify drill-down matches count and amounts.
5. Try impossible/reversed/367-day ranges, missing scope, and missing permission.
6. Open Filters; verify no inline filters remain on the main page. Change draft filters,
   cancel or press Escape, and verify the report and CSV remain unchanged with no analytics
   request. Reopen and apply: verify the dialog closes, loading appears on the page, and
   the returned report uses the new filters. Retry a failed request using unchanged filters.
7. Check empty results, missing receipt times, credited receiver balances, cancelled parcels,
   and final delivery versus rider handover.
8. Inspect status/branch tables and chart tab on narrow and wide screens; use keyboard controls.
