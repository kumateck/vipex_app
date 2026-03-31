# Daily Implementation 2026-03-31

## Summary

Implemented procurement v1, fleet transport v1, customer wallet/credit v1, reconciliation v1, notification hub v1, communication/customer-service phase-1 backend foundations, and IT support ticketing backend with attachment support, all with strict module gating and separated workflow pages.

## Delivered

1. Company module gating hardening

- Module list endpoint is available to authenticated company users.
- Sidebar and private route guards now enforce enabled module state for all mapped module paths.

2. Module workspace overview API

- Added `GET /v1/module-workspace/:moduleCode/overview`.
- Endpoint validates that requested module is enabled for current company.

3. Procurement v1 backend

- Added procurement schema tables:
  - `procurement_suppliers`
  - `procurement_purchase_requests`
- Added procurement APIs under `/v1/procurement`:
  - suppliers list/create/update
  - purchase request list/create
  - request approve/reject

4. Procurement v1 frontend

- Added separated pages/routes:
  - supplier list
  - supplier create
  - purchase request list
  - purchase request create
  - approvals page
- Added supplier edit + activate/deactivate actions in supplier list.

5. Procurement RBAC hardening

- Added dedicated permission keys:
  - `CanReadProcurement`
  - `CanCreateProcurementSuppliers`
  - `CanUpdateProcurementSuppliers`
  - `CanCreateProcurementPurchaseRequests`
  - `CanApproveProcurementPurchaseRequests`
- Applied backend permission guards and UI route/menu guards.

6. Seed and migration rollout prep

- Added standalone seed script to backfill all missing permissions in `PermissionCatalog` to existing `System Admin` roles:
  - `scripts/seed_permissions_system_admin.ts`
  - package command: `bun run seed:permissions:system-admin`
- Generated migration:
  - `drizzle/0001_unknown_meltdown.sql`
  - `drizzle/meta/0001_snapshot.json`
- Note: generated migration currently includes procurement tables plus communication/customer-service tables in the same migration batch.

7. Fleet & Transport v1 backend + frontend

- Added fleet schema tables:
  - `fleet_vehicles`
  - `fleet_fuel_logs`
- Added fleet APIs under `/v1/fleet-transport`:
  - vehicles list/create/update
  - fuel logs list/create
  - fuel log approve/reject
- Added separated pages/routes:
  - vehicles list
  - vehicles create
  - fuel logs list
  - fuel logs create
  - fuel approvals page
- Added fleet permissions and route/sidebar gates:
  - `CanReadFleetTransport`
  - `CanCreateFleetVehicles`
  - `CanUpdateFleetVehicles`
  - `CanCreateFleetFuelLogs`
  - `CanApproveFleetFuelLogs`
- Generated migration:
  - `drizzle/0002_dapper_mad_thinker.sql`

8. Communication + customer-service backend phase 1

- Added DB-backed implementation for:
  - `/v1/communication/threads` (list/create)
  - `/v1/communication/messages` (list/create)
  - `/v1/communication/channels` (list/create)
  - `/v1/communication/groups` (list/create)
  - `/v1/communication/presence` (list/create-upsert)
  - `/v1/communication/calls` (list/create)
  - `/v1/communication/engagement-requests` (list/create)
  - `/v1/communication/engagement-requests/:id/approve`
  - `/v1/communication/engagement-requests/:id/decline`
  - `/v1/customer-service/conversations` (list/create)
  - `/v1/customer-service/tickets` (list/create)
  - `/v1/customer-service/feedback` (list/create)
  - `/v1/customer-service/sla` (list/create)
- Added module dependency rules and seed catalog entries:
  - `communication_internal`
  - `communication_customer_service`
  - `communication_calls_livekit`
- Fixed thread participant counting query correctness in thread list repository.
- `bunx tsc --noEmit` passed after these updates.

9. Customer Wallet / Credit v1 backend + frontend

- Added module-gated APIs under `/v1/customer-wallet-credit`:
  - account list (`GET /accounts`)
  - approvals queue (`GET /approvals`)
  - payment create (`POST /accounts/:customerId/payments`)
  - credit block (`POST /accounts/:customerId/block`)
  - credit unblock (`POST /accounts/:customerId/unblock`)
- Added separated pages/routes:
  - `/customer-wallet-credit/accounts` (list)
  - `/customer-wallet-credit/payments/new` (create)
  - `/customer-wallet-credit/approvals` (approvals)
- Added wallet permissions and route/sidebar gates:
  - `CanReadCustomerWalletCredit`
  - `CanCreateCustomerWalletCreditPayments`
  - `CanApproveCustomerWalletCreditControls`
- No new tables were added for this module iteration; the implementation uses existing customer credit ledger tables.

10. Reconciliation v1 backend + frontend

- Added module-gated APIs under `/v1/reconciliation`:
  - branch options
  - session list/create/approve/finalize
  - bank settlement list/create/approve/reject
- Added separated pages/routes:
  - `/reconciliation/sessions` (list)
  - `/reconciliation/sessions/new` (create)
  - `/reconciliation/sessions/approvals` (approvals)
  - `/reconciliation/bank-settlements` (list)
  - `/reconciliation/bank-settlements/new` (create)
  - `/reconciliation/bank-settlements/approvals` (approvals)
- Added reconciliation permissions and route/sidebar gates:
  - `CanReadReconciliation`
  - `CanCreateReconciliationSessions`
  - `CanApproveReconciliationSessions`
  - `CanCreateReconciliationBankSettlements`
  - `CanApproveReconciliationBankSettlements`
- Added reconciliation schema table:
  - `reconciliation_bank_settlements`
- Session reconciliation uses existing `daily_cash_confirmations` workflow for approve/finalize.

11. IT support tickets backend + attachments

- Added IT support schema tables:
  - `it_support_tickets`
  - `it_support_ticket_events`
- Added module catalog + dependency support:
  - module code: `it_support`
  - dependency: none
- Added module-gated, permission-gated APIs under `/v1/it-support/tickets`:
  - `GET /v1/it-support/tickets`
  - `POST /v1/it-support/tickets`
  - `PATCH /v1/it-support/tickets/:id`
- Added attachment support for IT tickets by linking uploads with:
  - `modelType=it-support-ticket`
  - `modelId=<ticketId>`
- Expanded upload parser to accept base64 file uploads for ticket evidence (images + common office files), with a 10MB limit.
- Added new permissions:
  - `CanReadItSupportTickets`
  - `CanCreateItSupportTickets`
  - `CanUpdateItSupportTickets`
- Added sidebar route mapping:
  - `/it-support/tickets`

12. Notification Hub v1 backend + frontend

- Added notification hub schema tables:
  - `notification_providers`
  - `notification_templates`
  - `notification_campaigns`
  - `notification_dispatches`
- Added module-gated APIs under `/v1/notification-hub`:
  - providers list/create/update/default
  - templates list/options/create/update
  - campaigns list/create/submit/approve/reject/send
  - dispatch logs list/retry
  - campaign dispatch summary
  - call-center parcel status event send
- Added separated pages/routes:
  - `/notification-hub/providers` (list)
  - `/notification-hub/providers/new` (create)
  - `/notification-hub/templates` (list)
  - `/notification-hub/templates/new` (create)
  - `/notification-hub/campaigns` (list)
  - `/notification-hub/campaigns/new` (create)
  - `/notification-hub/campaigns/approvals` (approvals)
  - `/notification-hub/dispatches` (logs/retry)
- Added call-center integration in parcel status flow:
  - call outcome dialog now supports SMS/email toggles
  - sends notifications via notification hub event endpoint
  - logs delivery records for retry
- Added notification permissions and route/sidebar gates:
  - `CanReadNotificationHub`
  - `CanManageNotificationProviders`
  - `CanManageNotificationTemplates`
  - `CanCreateNotificationCampaigns`
  - `CanApproveNotificationCampaigns`
  - `CanSendNotificationCampaigns`
  - `CanRetryNotificationMessages`
  - `CanSendCallCenterNotifications`

## Documentation updates completed

- `docs/COMPANY_MODULES.md`
- `docs/API.md`
- `docs/ROUTE_PERMISSION_MATRIX.md`
- `docs/ERP_MODULE_ROLLOUT_PLAN.md`
- `docs/ARCHITECTURE.md`
- `docs/PROCUREMENT_MODULE.md` (new)
- `docs/FLEET_TRANSPORT_MODULE.md` (new)
- `docs/FLEET_TRANSPORT_QA_CHECKLIST.md` (new)
- `docs/CUSTOMER_WALLET_CREDIT_MODULE.md` (new)
- `docs/CUSTOMER_WALLET_CREDIT_QA_CHECKLIST.md` (new)
- `docs/RECONCILIATION_MODULE.md` (new)
- `docs/RECONCILIATION_QA_CHECKLIST.md` (new)
- `docs/NOTIFICATION_HUB_MODULE.md` (new)
- `docs/NOTIFICATION_HUB_QA_CHECKLIST.md` (new)
- `docs/COMMUNICATION_SUITE_SPEC.md` (updated)
- `docs/COMMUNICATION_IMPLEMENTATION_CHECKLIST.md` (updated)
- `docs/COMPANY_MODULES.md` (updated for `it_support`)
- `docs/API.md` (updated for IT support endpoints)
- `docs/ROUTE_PERMISSION_MATRIX.md` (updated for IT support route)

## Validation

- `bun run routes:generate` passed
- `bunx tsc --noEmit` passed
- `bun run migrate` failed locally due database connectivity:
  - `ECONNREFUSED ::1:5432`
  - `ECONNREFUSED 127.0.0.1:5432`

## Pending to finish on environment with DB access

1. Ensure `DATABASE_URL` points to running Postgres.
2. Run `bun run migrate`.
3. Run `bun run seed:init` (or `bun run seed:bootstrap` for fresh DB).
4. Run `bun run seed:permissions:system-admin`.
5. Execute procurement QA checklist in `docs/PROCUREMENT_QA_CHECKLIST.md`.
6. Execute reconciliation QA checklist in `docs/RECONCILIATION_QA_CHECKLIST.md`.
