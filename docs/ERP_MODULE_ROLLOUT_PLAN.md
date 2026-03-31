# ERP Module Rollout Plan

## Goal

Deliver the new ERP modules in a dependency-safe order with fast business impact and minimal rework.

## Phase 1 (High ROI, Core Controls)

1. Procurement & Vendor Management (`procurement`)
2. Customer Wallet / Credit Control (`customer_wallet_credit`)
3. Reconciliation (`reconciliation`)
4. Notification & Communication Hub (`notification_hub`)

### Phase 1 deliverables

- Procurement
  - Vendor master, supplier ledger, purchase request, approval states, PO lifecycle.
  - AP handoff into accounting journals.
- Wallet/Credit
  - Wallet balance ledger, credit limits, hold/block rules, aging views.
  - Auto-block by overdue thresholds.
- Reconciliation
  - Session reconciliation (cashier/session), branch vs HQ variance, bank settlement matching.
  - Exception queues and resolution actions.
- Notification Hub
  - Template registry (SMS/WhatsApp/Email), trigger rules, retries/failure logs.

### Dependencies

- `procurement` -> `accounting`
- `customer_wallet_credit` -> `customers`, `payments`
- `reconciliation` -> `payments`, `accounting`
- `notification_hub` -> `customers`

## Phase 2 (Operational Excellence)

1. Fleet & Transport Operations (`fleet_transport`)
2. SLA & Claims (`sla_claims`)
3. Document & Compliance (`document_compliance`)
4. Advanced Dispatch Optimization (`dispatch_optimization`)

### Phase 2 deliverables

- Fleet
  - Vehicle master, assignment, fuel logs, trip costing, maintenance scheduler.
- SLA/Claims
  - Late delivery incidents, damage/loss claims, compensation workflow.
- Document/Compliance
  - KYC/docs vault, retention policies, audit-friendly document trails.
- Dispatch Optimization
  - Route batching, rider load balancing, ETA estimation.

### Dependencies

- `fleet_transport` -> `shipments`
- `sla_claims` -> `shipments`, `customers`
- `document_compliance` -> `customers`
- `dispatch_optimization` -> `shipments`

## Phase 3 (Scale & Ecosystem)

1. BI & Executive Dashboard (`bi_executive_dashboard`)
2. API Partner / Agent Portal (`partner_agent_portal`)

### Phase 3 deliverables

- BI Dashboard
  - Cross-branch KPI models, route/service profitability, tax/settlement analytics.
  - Scheduled snapshots and drill-downs.
- Partner/Agent Portal
  - External booking/tracking/settlement APIs, agent auth scopes, webhook subscriptions.

### Dependencies

- `bi_executive_dashboard` -> `accounting`
- `partner_agent_portal` -> `shipments`, `customers`, `payments`

## Architecture alignment for this repo

- Backend modules: `src/server/features/<module>`
- Frontend modules: `src/features/<module>`
- Routes: `src/pages/(private)/...` + route generation
- Module gating: `requireModuleEnabled('<module_code>')`
- Company toggle source: `module_catalog` + `company_modules`

## Suggested implementation cadence

- Sprint A
  - `procurement` + `notification_hub` foundation schemas + APIs + base pages
- Sprint B
  - `customer_wallet_credit` + `reconciliation` ledger/reports + controls
- Sprint C
  - `fleet_transport` + `sla_claims`
- Sprint D
  - `document_compliance` + `dispatch_optimization`
- Sprint E
  - `bi_executive_dashboard` + `partner_agent_portal`

## Done in this commit

- Added these module codes to bootstrap/initial seed catalogs.
- Added dependency graph entries in company module service to enforce safe enable order.

## Current Implementation Status (2026-03-31)

### Platform/module foundation

- Added route-to-module mapping and private route module gating.
- Sidebar now hides disabled module links.
- Added module workspace overview endpoint:
  - `GET /v1/module-workspace/:moduleCode/overview`

### Phase 1 progress

- Procurement (`procurement`) is now implemented as v1:
  - Supplier list page
  - Supplier create page
  - Supplier edit/deactivate actions from list page
  - Purchase request list page
  - Purchase request create page
  - Dedicated approvals page (separate route)
  - Approve/reject backend actions
  - Separate approver permission gate

### Procurement route split (UI)

- `/procurement/suppliers` (list)
- `/procurement/suppliers/new` (create)
- `/procurement/purchase-requests` (list)
- `/procurement/purchase-requests/new` (create)
- `/procurement/purchase-requests/approvals` (approvals)

### Procurement permissions

- `CanReadProcurement`
- `CanCreateProcurementSuppliers`
- `CanUpdateProcurementSuppliers`
- `CanCreateProcurementPurchaseRequests`
- `CanApproveProcurementPurchaseRequests`

### Customer Wallet / Credit progress

- Customer Wallet / Credit (`customer_wallet_credit`) is now implemented as v1:
  - Wallet account list page with search, pagination, and credit/overdue filters
  - Wallet payment create page
  - Dedicated approvals page (separate route)
  - Credit block/unblock backend actions from approvals queue
  - Separate approver permission gate

### Customer Wallet route split (UI)

- `/customer-wallet-credit/accounts` (list)
- `/customer-wallet-credit/payments/new` (create)
- `/customer-wallet-credit/approvals` (approvals)

### Customer Wallet permissions

- `CanReadCustomerWalletCredit`
- `CanCreateCustomerWalletCreditPayments`
- `CanApproveCustomerWalletCreditControls`

### Reconciliation progress

- Reconciliation (`reconciliation`) is now implemented as v1:
  - Session reconciliation list page
  - Session reconciliation create page
  - Session approvals page (approve/finalize)
  - Bank settlement list page
  - Bank settlement create page
  - Bank settlement approvals page (approve/reject)
  - Separate approver permission gates

### Reconciliation route split (UI)

- `/reconciliation/sessions` (list)
- `/reconciliation/sessions/new` (create)
- `/reconciliation/sessions/approvals` (approvals)
- `/reconciliation/bank-settlements` (list)
- `/reconciliation/bank-settlements/new` (create)
- `/reconciliation/bank-settlements/approvals` (approvals)

### Reconciliation permissions

- `CanReadReconciliation`
- `CanCreateReconciliationSessions`
- `CanApproveReconciliationSessions`
- `CanCreateReconciliationBankSettlements`
- `CanApproveReconciliationBankSettlements`

### Notification Hub progress

- Notification Hub (`notification_hub`) is now implemented as v1:
  - Provider list page
  - Provider create page
  - Template list page
  - Template create page
  - Campaign list page
  - Campaign create page
  - Campaign approvals page
  - Delivery logs page with retry action
  - Call-center parcel status integration with SMS/email toggles
  - Backend campaign lifecycle (draft -> submitted -> approved/rejected -> sent)
  - Default provider by channel (`sms`, `email`) with provider extensibility

### Notification Hub route split (UI)

- `/notification-hub/providers` (list)
- `/notification-hub/providers/new` (create)
- `/notification-hub/templates` (list)
- `/notification-hub/templates/new` (create)
- `/notification-hub/campaigns` (list)
- `/notification-hub/campaigns/new` (create)
- `/notification-hub/campaigns/approvals` (approvals)
- `/notification-hub/dispatches` (logs/retry)

### Notification Hub permissions

- `CanReadNotificationHub`
- `CanManageNotificationProviders`
- `CanManageNotificationTemplates`
- `CanCreateNotificationCampaigns`
- `CanApproveNotificationCampaigns`
- `CanSendNotificationCampaigns`
- `CanRetryNotificationMessages`
- `CanSendCallCenterNotifications`

### Phase 2 progress

- Fleet & Transport (`fleet_transport`) is now implemented as v1:
  - Vehicle list page
  - Vehicle create page
  - Vehicle edit/deactivate actions from list page
  - Fuel log list page
  - Fuel log create page
  - Dedicated fuel approvals page (separate route)
  - Approve/reject backend actions
  - Separate approver permission gate

### Fleet route split (UI)

- `/fleet-transport/vehicles` (list)
- `/fleet-transport/vehicles/new` (create)
- `/fleet-transport/fuel-logs` (list)
- `/fleet-transport/fuel-logs/new` (create)
- `/fleet-transport/fuel-logs/approvals` (approvals)

### Fleet permissions

- `CanReadFleetTransport`
- `CanCreateFleetVehicles`
- `CanUpdateFleetVehicles`
- `CanCreateFleetFuelLogs`
- `CanApproveFleetFuelLogs`

### Communication platform progress (cross-phase foundation)

Communication foundations are now implemented and module-gated:

- Internal communication module code:
  - `communication_internal`
- Customer-service communication module code:
  - `communication_customer_service`
- Calls module code:
  - `communication_calls_livekit`

Dependency rules:

- `communication_customer_service` -> `customers`, `communication_internal`
- `communication_calls_livekit` -> `communication_internal`

Implemented backend endpoints:

- `/v1/communication/threads` (list/create)
- `/v1/communication/messages` (list/create)
- `/v1/communication/channels` (list/create)
- `/v1/communication/groups` (list/create)
- `/v1/communication/engagement-requests` (list/create/approve/decline)
- `/v1/communication/presence` (list/upsert)
- `/v1/communication/calls` (list/create)
- `/v1/customer-service/conversations` (list/create)
- `/v1/customer-service/tickets` (list/create)
- `/v1/customer-service/feedback` (list/create)
- `/v1/customer-service/sla` (list/create)
