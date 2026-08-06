# Fleet Analytics Phase 3

Last updated: 2026-04-09

## Delivered in this phase

### 1) Maintenance & Reliability depth

- Extended reliability trends output with:
  - `byVehicleClass` (model-based class grouping)
  - `forecast` (3-month projection baseline from recent monthly trend)

Endpoint:

- `GET /v1/fleet-transport/maintenance/reliability/trends`

UI:

- `/fleet-transport/maintenance/reliability/trends`

### 2) Fuel fraud/anomaly signals

- Added rule-based risk scoring over trip fuel analytics:
  - high variance vs expected usage
  - high cost per km threshold
  - rapid refuel pattern (short interval between trip windows per vehicle)
- Risk levels: `none`, `low`, `medium`, `high`
- Added tuning support:
  - branch filter
  - fuel-type filter
  - configurable high-cost/km threshold
  - configurable rapid-refuel window

Endpoint:

- `GET /v1/fleet-transport/fuel-analytics/fraud-signals`

UI:

- `/fleet-transport/fuel-analytics/fraud-signals`

### 3) Unit economics cuts

- Added dedicated unit economics endpoint derived from decision-support aggregates:
  - profitability by route
  - profitability by branch
  - profitability by customer
  - monthly trend cuts
  - benchmark slices:
    - top route cost/km
    - top branch cost/parcel
    - lowest margin customers

Endpoint:

- `GET /v1/fleet-transport/decision-support/unit-economics`

UI:

- `/fleet-transport/decision-support/unit-economics`

### 4) Compliance KPI trend depth

- Added KPI trend endpoint for:
  - incident aging buckets
  - monthly incident trend (open/critical/resolution-48h rates)
  - monthly policy acknowledgment trend (ack/pending/revoked rates)

Endpoint:

- `GET /v1/fleet-transport/compliance/kpis/trends`

UI:

- `/fleet-transport/compliance/kpis`

### 5) Analytics snapshot scheduler hook

- Added orchestration endpoint to generate a daily analytics snapshot summary and audit record.

Endpoint:

- `POST /v1/fleet-transport/analytics/snapshots/run-daily`

Typical payload:

- `windowDays`
- `horizonDays`
- `defaultExpectedKmPerLiter`
- `expectedOveruseThresholdPct`

Job script integration:

- Script: [`scripts/run_fleet_analytics_snapshot.ts`](/Users/gigisiri/Business/Employment/vipex/vipex_app/scripts/run_fleet_analytics_snapshot.ts)
- Package command: `bun run jobs:fleet:analytics-snapshot`
- Required env:
  - `API_BASE_URL`
  - auth resolution order:
    1. `FLEET_JOB_BEARER_TOKEN` (or `API_BEARER_TOKEN`)
    2. `FLEET_JOB_USER_ID` (auto-generates token)
    3. auto-discover first DB user with `CanReadFleetTransport` and enabled `fleet_transport` company module
- Optional env:
  - `FLEET_ANALYTICS_WINDOW_DAYS`
  - `FLEET_ANALYTICS_HORIZON_DAYS`
  - `FLEET_ANALYTICS_OVERUSE_THRESHOLD_PCT`
  - `FLEET_ANALYTICS_DEFAULT_KM_PER_LITER`
  - `FLEET_SNAPSHOT_DISABLE_LOCAL_FALLBACK=true` (disable in-process fallback)

Runtime note:

- If `API_BASE_URL` is unreachable, the script falls back to in-process app execution automatically.

## Validation updates

- Route smoke coverage extended for:
  - compliance KPI trends
  - fuel fraud signals
  - unit economics
- UI smoke imports extended for new independent pages.
