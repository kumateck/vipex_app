# Fleet Automation Orchestration

## Overview

This document describes the fleet automation layer that now orchestrates:

1. Lifecycle automation rules.
2. Compliance escalation workflows.
3. Maintenance-to-procurement automation triggers.
4. Unified operational action queue and KPIs.
5. Validation strategy and tests.

Primary implementation files:

- `src/server/features/fleet-transport/service.ts`
- `src/server/features/fleet-transport/repository.ts`
- `src/server/features/fleet-transport/controller.ts`
- `src/server/features/fleet-transport/routes.ts`
- `src/features/fleet-transport/api/fleet-transport.api.ts`

---

## 1) Lifecycle Automation Rules

### Existing rule retained

`runFleetVehicleLifecycleAutomationJobSvc` keeps the existing transition:

- `ACTIVE -> IN_MAINTENANCE` when compliance artifacts expire.
- `ACTIVE -> RETIRED` when lease has ended for leased vehicles.

### New recovery rule

The same job now includes a recovery path:

- `IN_MAINTENANCE -> ACTIVE` when all conditions are true:
  - insurance is valid or absent
  - roadworthy is valid or absent
  - no expired vehicle document
  - no open downtime event
  - no open/in-progress maintenance work order

Repository selectors used:

- `listFleetVehiclesForLifecycleAutomationRepo`
- `listFleetVehiclesForLifecycleRecoveryRepo` (new)

Audit actions:

- `FLEET_VEHICLE_LIFECYCLE_AUTO_TRANSITIONED`
- `FLEET_VEHICLE_LIFECYCLE_AUTO_RECOVERED` (new)

Endpoint:

- `POST /v1/fleet-transport/vehicles/lifecycle/run-daily-automation`

---

## 2) Compliance Escalation Workflow

### New escalation job

`runFleetComplianceEscalationJobSvc` introduces tiered escalation for:

- unresolved incidents
- overdue compliance alerts

Escalation tiers:

- Tier 1: first threshold breach
- Tier 2: 2x threshold
- Tier 3: 3x threshold (or 30+ days overdue for compliance items)

Configurable inputs:

- `incidentEscalateAfterDays` (default 3)
- `incidentCriticalEscalateAfterDays` (default 1)
- `complianceEscalateAfterDays` (default 0)
- `incidentLimit`
- `recipientLimit`

Dispatch behavior:

- creates in-app dispatches
- attempts email dispatches
- stores source metadata as `fleet_compliance_escalation_job`

Repository selectors used:

- `listOpenFleetComplianceIncidentsForEscalationRepo` (new)
- `listFleetComplianceDashboardSvc` (expired filter)
- `listFleetComplianceAlertRecipientUsersRepo`

Audit action:

- `FLEET_COMPLIANCE_ESCALATION_JOB_TRIGGERED` (new)

Endpoint:

- `POST /v1/fleet-transport/compliance/escalations/run-daily`

---

## 3) Maintenance and Procurement Automation

### New maintenance job

`runFleetMaintenanceAutomationJobSvc` performs:

1. Auto-work-order creation:

- scans due active maintenance plans (`next_due_at <= due window`)
- prevents duplicates using open work order check by `planId`
- creates auto work order: `Auto PM: <plan title>`

2. Plan rescheduling:

- for `DAYS/WEEKS/MONTHS` intervals, advances `next_due_at` by interval

3. Auto-demand creation to procurement:

- scans low-stock candidates
- applies branch/global procurement fleet policy for urgency and multiplier
- prevents duplicates with deterministic dedupe key
- creates demand in `procurement_demands`

New repository helper:

- `findOpenWorkOrderByPlanRepo`

Procurement integration:

- `findProcurementFleetPolicyByBranchRepo`
- `findOpenProcurementDemandByDedupeKeyRepo`
- `createProcurementDemandRepo`

Audit action:

- `FLEET_MAINTENANCE_AUTOMATION_JOB_TRIGGERED` (new)

Endpoint:

- `POST /v1/fleet-transport/maintenance/automation/run-daily`

---

## 4) Unified Ops Queue and KPI Surface

### New queue endpoint

`getFleetOpsQueueSvc` aggregates cross-domain operational backlog:

- compliance alerts (expired + due soon)
- open incidents
- open/in-progress work orders
- active downtime
- low-stock candidates
- policy re-acknowledgment targets

Returns:

- `summary` KPIs
- `queues` arrays for each action stream

Endpoint:

- `GET /v1/fleet-transport/ops-queue`

### Unified orchestrator endpoint

`runFleetAutomationOrchestrationJobSvc` runs in parallel:

- lifecycle automation
- maintenance/procurement automation
- compliance escalation

Audit action:

- `FLEET_AUTOMATION_ORCHESTRATION_TRIGGERED` (new)

Endpoint:

- `POST /v1/fleet-transport/automation/run-daily`

---

## 5) Testing and Validation

### Added/updated tests

- New integration:
  - `tests/server/fleet-transport-automation-orchestration.spec.ts`
- Updated smoke:
  - `tests/server/fleet-transport-maintenance.routes.smoke.spec.ts`
  - `tests/server/fleet-transport-vehicles-registry.routes.smoke.spec.ts`
- Updated UI smoke exports:
  - `tests/fleet-transport-ui.smoke.spec.ts`

### Recommended execution

Run in your normal environment:

```bash
bun test \
  tests/server/fleet-transport-automation-orchestration.spec.ts \
  tests/server/fleet-transport-maintenance.routes.smoke.spec.ts \
  tests/server/fleet-transport-vehicles-registry.routes.smoke.spec.ts \
  tests/fleet-transport-ui.smoke.spec.ts
```

If you run full fleet/procurement regression, include:

```bash
bun test tests/server/fleet-transport-*.spec.ts tests/server/procurement-*.spec.ts
```

---

## Operational Notes

- Jobs are designed to be idempotent by:
  - checking for existing open work order per plan
  - checking existing open procurement demand by dedupe key
- All mutation jobs record audit logs for traceability.
- Escalation dispatches are persisted as notification dispatch records with source metadata.
