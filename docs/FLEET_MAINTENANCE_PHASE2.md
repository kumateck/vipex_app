# Fleet Maintenance & Reliability Phase 2

This document captures the Phase 2 implementation for maintenance/reliability with procurement centralization.

## Scope Implemented

1. Parts movement history screens
2. Reorder/procurement linkage hardening and traceability
3. MTBF/MTTR trend analytics
4. Downtime reason taxonomy + RCA workflow (including reopen/escalate)
5. Maintenance KPI dashboard

Notes:

- Telematics is intentionally out of scope (no vehicle tracking-device dependency).
- Procurement remains centralized in the procurement module; fleet creates/links demands and traceability, then downstream PR/PO/GR flows continue in procurement.

## Backend Endpoints

### Downtime RCA workflow

- `GET /v1/fleet-transport/maintenance/downtime/workflows`
- `PATCH /v1/fleet-transport/maintenance/downtime/:id/workflow`
- `POST /v1/fleet-transport/maintenance/downtime/:id/reopen`

RCA workflow fields:

- `reasonCategory`
- `lifecycleStatus` (`0..5`)
- `rootCause`
- `correctiveAction`
- `escalationLevel`
- `reopenedCount`
- `lastReopenedAt`

### Reliability and KPI analytics

- `GET /v1/fleet-transport/maintenance/reliability/trends?windowDays=90`
- `GET /v1/fleet-transport/maintenance/kpis?windowDays=30&slaHours=48`

### Parts movement history by work order

- `GET /v1/fleet-transport/maintenance/work-orders/:id/part-movements?limit=200`

### Procurement traceability and reorder run

- `GET /v1/fleet-transport/maintenance/procurement/traceability?branchId=&limit=100`
- `POST /v1/fleet-transport/maintenance/procurement/reorder/run`

Job body:

- `dueWithinDays`
- `lowStockLimit`
- `replenishMultiplier`

## Frontend Pages (Independent)

All pages are standalone and not merged with create pages/data-table pages.

- `/fleet-transport/maintenance/downtime/workflows`
- `/fleet-transport/maintenance/downtime/workflows/:id/edit`
- `/fleet-transport/maintenance/reliability/trends`
- `/fleet-transport/maintenance/kpis`
- `/fleet-transport/maintenance/work-orders/part-movements`
- `/fleet-transport/maintenance/procurement/traceability`
- `/fleet-transport/maintenance/procurement/reorder`

Navigation links were added from:

- Fleet maintenance hub page
- Fleet home page
- Existing work-order/downtime pages
- Existing procurement-linkage maintenance page

## Data and Process Behavior

### RCA lifecycle behavior

- RCA data is parsed/stored in downtime event notes with a structured RCA payload.
- Reopen action:
  - reopens downtime (`endedAt = null`)
  - increments `reopenedCount`
  - increases `escalationLevel`
  - sets lifecycle to escalated/reopened.

### Traceability behavior

For each maintenance part, traceability correlates:

- part stock state
- latest demand
- latest PO
- receipts
- issued movement totals

Computed indicators include:

- `approvalGatePassed`
- `blockedReason`
- `receiptGapQty`

### KPI dashboard behavior

KPIs include:

- backlog aging buckets
- preventive compliance %
- SLA breach %
- mean time to schedule/repair
- average downtime
- top downtime reason categories

### Reliability trends behavior

Trends include:

- monthly MTBF/MTTR and downtime
- by-vehicle reliability breakdown
- by-branch reliability breakdown

## Test Coverage Updated

- `tests/server/fleet-transport-maintenance.routes.smoke.spec.ts`
  - Added smoke checks for new phase-2 routes.
- `tests/fleet-transport-ui.smoke.spec.ts`
  - Added import smoke coverage for new maintenance phase-2 pages.

## Operational Guidance

- Use fleet maintenance pages for fleet-specific trigger/visibility.
- Use procurement module pages for centralized procurement execution (demands approvals, PR/PO/GR lifecycle).
- Keep reorder automation thresholds conservative in production, then tune by branch after 1-2 operating cycles.
