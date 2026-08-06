# Inventory Staging Execution Checklist

Date: April 9, 2026

## 1) Migrations

Run in staging database:

1. `0036_procurement_grn_lot_capture.sql`
2. `0037_inventory_stock_count_reconciliation.sql`
3. `0038_inventory_acknowledgement_reorder_engine.sql`

## 2) UAT Scenarios

### Scenario A: GRN -> reservation auto-retry

1. Create stock request and approve it.
2. Allocate reservation so it remains short/partial.
3. Post procurement goods receipt for same product/location with lot metadata.
4. Verify reservation allocation has been retried automatically.

### Scenario B: Daily automation

1. Call `POST /v1/inventory/automation/run-daily` with `sendEmailAlerts=false`.
2. Verify expiry sweep results are returned.
3. Call with `sendEmailAlerts=true` and recipients.
4. Verify response notification status (`sent` true/false with reason).

### Scenario C: Stock count reconciliation

1. Create session at a location.
2. Edit counted quantity for one line with variance reason.
3. Submit session.
4. Approve session with `applyAdjustments=true`.
5. Verify stock levels match counted values and adjustment movements exist.

### Scenario D: Request/transfer acknowledgement

1. Fulfill a request line partially.
2. Call request-line acknowledgement endpoint for partial quantity.
3. Verify pending acknowledgement reduces correctly.
4. Fulfill and acknowledge a stock transfer receipt with damaged/missing quantities.
5. Verify variance adjustments reduce destination stock.

### Scenario E: Reorder suggestions

1. Set product min stock and force low stock at one location.
2. Call `GET /v1/inventory/reorder-suggestions`.
3. Verify reorder quantity and suggested source list are returned.

## 3) RBAC Verification

Ensure roles can access:

1. `/inventory/stock-count-sessions`
2. `/inventory/stock-count-sessions/new`
3. `/inventory/stock-count-sessions/view/:id`
4. `/inventory/monitoring`
5. `POST /inventory/automation/run-daily` access path in ops workflows

## 4) Daily Trigger

Schedule one daily call to:

- `POST /v1/inventory/automation/run-daily`

Recommended payload:

```json
{
  "companyId": "cmp_xxx",
  "actorUserId": "usr_ops_xxx",
  "daysAhead": 30,
  "sendEmailAlerts": true,
  "recipientEmails": ["ops.manager@example.com"]
}
```

## 5) Pilot Monitoring (1 week)

Track daily:

1. FEFO compliance rate.
2. Reservation short count + short quantity.
3. Near-expiry and expired lot counts.
4. Submitted stock-count sessions older than 24 hours.

## 6) Exit Criteria for Full Rollout

1. No critical API failures in automation/counting flows.
2. FEFO compliance stable above target.
3. Stock-count approval SLA consistently met.
4. Reservation short trend improving.

## Major Modules 1-6 Staging Checklist

- [ ] Create approval policy and verify visible in `/inventory/approval-policies`.
- [ ] Submit approval request and decide from `/inventory/approval-requests`.
- [ ] Run valuation recompute and posting sync from `/inventory/valuation`.
- [ ] Generate proposal from `/inventory/replenishment-proposals/new` and decide status.
- [ ] Create task from `/inventory/tasks/new`, scan in `/inventory/tasks/view/:id`, then complete.
- [ ] Post correction from `/inventory/audit/corrections/new` and verify journal entry in `/inventory/audit/journal`.
- [ ] Open `/inventory/reports/enterprise-kpis` and verify metrics load.
