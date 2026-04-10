# Fleet Hardening + UAT Checklist

Last updated: 2026-04-09

This checklist covers hardening and UAT for Fleet & Transport major modules.

## 1) Migration Hardening

1. Run full migration chain on a clean test database.
   - Example: `bun run scripts/migrate.ts` (or your standard migration command)
2. Verify required tables/columns for:
   - fleet registry depth (vehicle profile fields + documents)
   - compliance (incidents, policy acknowledgments, alert dispatches)
   - maintenance reliability (plans/work orders/downtime/parts)
   - dispatch operations (events/status/load matching)
   - procurement integration (demands/conversions/linkage)
3. Re-run migrations to ensure idempotent behavior where intended.
4. Run targeted backend/UI smoke first, then full suite.
   - Example targeted set:
     - `tests/server/fleet-transport-vehicles-registry.routes.smoke.spec.ts`
     - `tests/fleet-transport-ui.smoke.spec.ts`
   - Then full server + UI suites in CI-like order.

## 2) API Validation

1. Smoke-route checks
   - `/v1/fleet-transport/compliance/kpis/trends`
   - `/v1/fleet-transport/fuel-analytics/fraud-signals`
   - `/v1/fleet-transport/decision-support/unit-economics`
2. Auth/RBAC checks
   - unauthenticated returns `401`
   - insufficient permission returns `403`
3. Data contract checks
   - numeric fields and percentages are present and finite
   - datetime fields are ISO strings

## 3) UI Validation (Independent Pages)

1. Compliance KPI page
   - `/fleet-transport/compliance/kpis`
2. Fuel fraud signals page
   - `/fleet-transport/fuel-analytics/fraud-signals`
3. Unit economics page
   - `/fleet-transport/decision-support/unit-economics`
4. Verify each page loads independently and does not depend on dialogs/modals for core flow.

## 4) Operational Hardening

1. Daily hooks
   - compliance alert job
   - compliance escalation job
   - maintenance automation job
   - analytics snapshot job
2. Scheduler integration point
   - Configure cron/worker to run:
     - `bun run jobs:fleet:analytics-snapshot`
   - Ensure env is set:
     - `API_BASE_URL`
     - `FLEET_JOB_BEARER_TOKEN` (or `API_BEARER_TOKEN`)
3. Optional threshold env tuning:
   - `FLEET_ANALYTICS_OVERUSE_THRESHOLD_PCT`
   - `FLEET_ANALYTICS_DEFAULT_KM_PER_LITER`
   - plus route-level query overrides for branch/fuel-type/high-cost/rapid-refuel windows
4. Verify alert dispatch persistence (in-app + email dispatch records).
5. Verify audit logs for major lifecycle and risk actions.

## 5) Performance Sanity

1. Use realistic query windows (`30/60/90/180` days) and verify response time.
2. Confirm no obvious waterfalls in frontend request flow for the new pages.
3. Confirm list endpoints respect `limit` bounds.
4. Validate fraud-threshold tuning controls:
   - branch-scoped filter
   - fuel-type filter
   - high-cost-per-km threshold
   - rapid-refuel window

## 6) UAT Sign-Off Matrix

1. Fleet Operations lead
   - dispatch board/route/load/check flow
2. Maintenance lead
   - work order + downtime + reliability trends
3. Compliance lead
   - dashboard + KPI trends + incident lifecycle + policy acknowledgment
4. Finance/Decision lead
   - fuel analytics + fraud signals + unit economics views

Each owner must sign off:

- data correctness
- filter behavior
- export/report expectations
- permission visibility
