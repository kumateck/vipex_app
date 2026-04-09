# Inventory Rollout Runbook

Date: April 9, 2026

## Objective

Safely roll out the new inventory stack across branches with controlled monitoring:

- lot/FEFO engine
- reservation auto-retry after replenishment
- expiry automation + alerts
- stock count reconciliation sessions

## Pre-Deployment Checklist

1. Apply migrations through `0037_inventory_stock_count_reconciliation.sql`.
2. Confirm permissions for inventory managers:
   - lots, reservations, requests, stock count sessions, monitoring.
3. Verify SMTP configuration if email alerts are enabled.
4. Seed at least one MAIN_STORE and BRANCH_STORE per branch hierarchy.

## Phased Rollout

1. Pilot branch (1 branch, 3-5 days).
2. Wave 1 (up to 25% of branches).
3. Wave 2 (remaining branches).

## Daily Operations

1. Run `POST /inventory/automation/run-daily` once per day.
2. Review `/inventory/monitoring` for:
   - reservation short count
   - near-expiry and expired lots
   - FEFO compliance rate
   - stock count session backlog
3. Review `/inventory/reorder-suggestions` for min-level gaps and suggested source locations.
4. Run stock count sessions for high-risk locations weekly.

## Target KPIs

1. Reservation short count trend down week-over-week.
2. FEFO compliance rate >= 95%.
3. Near-expiry at-risk quantity trend down week-over-week.
4. Submitted stock-count sessions approved within 24 hours.

## Escalation Rules

1. FEFO compliance below 90% for 2 days -> trigger branch audit.
2. Expired lot count increases for 3 consecutive days -> procurement and warehouse review.
3. Short reservations above threshold -> immediate replenishment review and policy tuning.

## Backout Plan

1. Disable daily automation email alerts (`sendEmailAlerts: false`) while keeping sweep active.
2. Continue manual stock movements and request fulfillment flows (no data loss).
3. Restrict stock count approvals temporarily if variance reasons are poor quality.

## Phase: Major Modules 1-6

Enable and validate in this order:

1. Approval policies and approval request queue.
2. Valuation summary and snapshot recomputation.
3. Replenishment proposal generation and approval flow.
4. Task execution flow (create -> start -> scan -> complete).
5. Audit journal visibility and correction posting controls.
6. Enterprise KPI dashboard refresh cadence.

Operational checks:

- Confirm role access for new inventory permission keys.
- Confirm event journal entries are created for approvals, tasks, valuation recompute, and corrections.
- Confirm KPI endpoint latency is acceptable for default 30-day window.
