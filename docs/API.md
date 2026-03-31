# API Documentation Index

Base URL: `/v1`

## Core

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

## Master Data

- `/users`
- `/branches`
- `/locations`
- `/warehouses`
- `/company-modules`
- `/statuses`
- `/hr/departments`
- `/hr/job-titles`
- `/hr/employees`
- `/hr/attendance`
- `/hr/leave-types`
- `/hr/leave-requests`
  - `/hr/leave-requests/:id/manager-approve`
  - `/hr/leave-requests/:id/manager-reject`
- `/customers`
  - `/customers/crm`
  - `/customers/:id/crm`
  - `/customers/:id/cards`
  - `/customers/:id/cards/:cardRecordId`
  - `/customers/:id/statement`
  - `/customers/:id/transactions`
  - `/customers/:id/payments`
  - `/customers/:id/credit/summary`
  - `/customers/:id/credit/transactions`
  - `/customers/:id/credit/open-items`
  - `/customers/:id/credit/payments`

## Operations

- `/shipments/bookings`
- `/shipments/parcels`
- `/shipments/parcel-internal-transfers`
- `/shipments/consignments`
- `/deliveries`
- `/cashiers`
- `/shifts`

## Finance

- `/payments`
- `/procurement`
  - `GET /procurement/suppliers`
  - `POST /procurement/suppliers`
  - `PATCH /procurement/suppliers/:id`
  - `GET /procurement/purchase-requests`
  - `POST /procurement/purchase-requests`
  - `POST /procurement/purchase-requests/:id/approve`
  - `POST /procurement/purchase-requests/:id/reject`
- `/fleet-transport`
  - `GET /fleet-transport/vehicles`
  - `POST /fleet-transport/vehicles`
  - `PATCH /fleet-transport/vehicles/:id`
  - `GET /fleet-transport/fuel-logs`
  - `POST /fleet-transport/fuel-logs`
  - `POST /fleet-transport/fuel-logs/:id/approve`
  - `POST /fleet-transport/fuel-logs/:id/reject`
- `/customer-wallet-credit`
  - `GET /customer-wallet-credit/accounts`
  - `GET /customer-wallet-credit/approvals`
  - `POST /customer-wallet-credit/accounts/:customerId/payments`
  - `POST /customer-wallet-credit/accounts/:customerId/block`
  - `POST /customer-wallet-credit/accounts/:customerId/unblock`
- `/reconciliation`
  - `GET /reconciliation/branch-options`
  - `GET /reconciliation/sessions`
  - `POST /reconciliation/sessions`
  - `POST /reconciliation/sessions/:id/approve`
  - `POST /reconciliation/sessions/:id/finalize`
  - `GET /reconciliation/bank-settlements`
  - `POST /reconciliation/bank-settlements`
  - `POST /reconciliation/bank-settlements/:id/approve`
  - `POST /reconciliation/bank-settlements/:id/reject`
- `/notification-hub`
  - `GET /notification-hub/providers`
  - `POST /notification-hub/providers`
  - `PATCH /notification-hub/providers/:id`
  - `POST /notification-hub/providers/:id/default`
  - `GET /notification-hub/templates`
  - `GET /notification-hub/templates/options`
  - `POST /notification-hub/templates`
  - `PATCH /notification-hub/templates/:id`
  - `GET /notification-hub/campaigns`
  - `POST /notification-hub/campaigns`
  - `POST /notification-hub/campaigns/:id/submit`
  - `POST /notification-hub/campaigns/:id/approve`
  - `POST /notification-hub/campaigns/:id/reject`
  - `POST /notification-hub/campaigns/:id/send`
  - `GET /notification-hub/campaigns/:id/dispatch-summary`
  - `GET /notification-hub/dispatches`
  - `POST /notification-hub/dispatches/:id/retry`
  - `POST /notification-hub/events/parcel-status-call`
- `/accounting`
  - `accounts`
  - `expense-categories`
  - `approval-policies`
  - `bank-accounts`
  - `tax-components`
  - `daily-cash-expected`
  - `daily-cash-confirmations`
  - `tax-profiles`
  - `expense-requests`
  - `tax-filing-periods`
  - `tax-journal-items`
  - `reports/trial-balance`
  - `reports/account-statement`
  - `reports/income-statement`
  - `reports/profit-loss`
  - `reports/balance-sheet`
  - `reports/cash-flow`
  - `reports/monthly-branch-summary`
- `/payroll`
  - `/payroll/groups`
  - `/payroll/earning-types`
  - `/payroll/deduction-types`
  - `/payroll/compensation`
  - `/payroll/cycles`
  - `/payroll/cycles/:id/overtime`
  - `/payroll/cycles/:id/overtime/:entryId/approve`
  - `/payroll/cycles/:id/overtime/:entryId/reject`
  - `/payroll/cycles/:id/adjustments`
  - `/payroll/cycles/:id/adjustments/:entryId/approve`
  - `/payroll/cycles/:id/adjustments/:entryId/reject`
  - `/payroll/cycles/:id/bank-export`
  - `/payroll/cycles/:id/payslips`
  - `/payroll/payslips/:id`
  - `/payroll/cycles/:id/journalize`
  - `/payroll/cycles/:id/reverse`
  - `/payroll/cycles/:id/reopen`

## Platform

- `/company-modules`
  - `GET /company-modules`
  - `PUT /company-modules/:moduleCode`
- `/module-workspace`
  - `GET /module-workspace/:moduleCode/overview`
- `/uploads`
  - `GET /uploads?modelType=...&modelId=...`
  - `POST /uploads`
  - `DELETE /uploads/:id`
  - `GET /uploads/object/:key`

## Communication

- `/communication`
  - `GET /communication/threads`
  - `POST /communication/threads`
  - `GET /communication/messages`
  - `POST /communication/messages`
  - `GET /communication/channels`
  - `POST /communication/channels`
  - `GET /communication/groups`
  - `POST /communication/groups`
  - `GET /communication/engagement-requests`
  - `POST /communication/engagement-requests`
  - `POST /communication/engagement-requests/:id/approve`
  - `POST /communication/engagement-requests/:id/decline`
  - `GET /communication/presence`
  - `POST /communication/presence`
  - `GET /communication/calls`
  - `POST /communication/calls`

## Customer Service Communication

- `/customer-service`
  - `GET /customer-service/conversations`
  - `POST /customer-service/conversations`
  - `GET /customer-service/tickets`
  - `POST /customer-service/tickets`
  - `GET /customer-service/feedback`
  - `POST /customer-service/feedback`
  - `GET /customer-service/sla`
  - `POST /customer-service/sla`

## IT Support

- `/it-support`
  - `GET /it-support/tickets`
  - `POST /it-support/tickets`
  - `PATCH /it-support/tickets/:id`

Notes:

- Accounting availability is controlled through the `accounting` company module.
- Procurement availability is controlled through the `procurement` company module.
- The accounting UI is surfaced at `/settings/company` for users with `CanManageCompanyModules`.
- Accounting setup master data is surfaced at `/accounting/setup`.
- The setup page currently manages chart of accounts, expense categories, approval policies, company bank accounts, tax profiles, and tax components.
- Ledger accounts can now be deleted through `DELETE /accounting/accounts/:id?companyId=...`, but only when they have no associated transactions or setup references.
- The setup page now shows per-record audit history inline by consuming `GET /audit/entities/:entityType/:entityId`.
- Accounting API access is also role-gated with `CanReadAccounting`, `CanManageAccountingSetup`, `CanManageTaxFiling`, and `CanPostAccountingEntries`.
- Procurement API access is role-gated with:
  - `CanReadProcurement`
  - `CanCreateProcurementSuppliers`
  - `CanUpdateProcurementSuppliers`
  - `CanCreateProcurementPurchaseRequests`
  - `CanApproveProcurementPurchaseRequests`
- Fleet API access is role-gated with:
  - `CanReadFleetTransport`
  - `CanCreateFleetVehicles`
  - `CanUpdateFleetVehicles`
  - `CanCreateFleetFuelLogs`
  - `CanApproveFleetFuelLogs`
- Customer wallet API access is role-gated with:
  - `CanReadCustomerWalletCredit`
  - `CanCreateCustomerWalletCreditPayments`
  - `CanApproveCustomerWalletCreditControls`
- Reconciliation API access is role-gated with:
  - `CanReadReconciliation`
  - `CanCreateReconciliationSessions`
  - `CanApproveReconciliationSessions`
  - `CanCreateReconciliationBankSettlements`
  - `CanApproveReconciliationBankSettlements`
- Notification hub API access is role-gated with:
  - `CanReadNotificationHub`
  - `CanManageNotificationProviders`
  - `CanManageNotificationTemplates`
  - `CanCreateNotificationCampaigns`
  - `CanApproveNotificationCampaigns`
  - `CanSendNotificationCampaigns`
  - `CanRetryNotificationMessages`
  - `CanSendCallCenterNotifications` (or `CanReadCallCenterParcelStatus` for call-center send endpoint)
- When `accounting` is disabled, `/accounting/*` UI routes are hidden and `/v1/accounting/*` API routes are blocked.
- When `procurement` is disabled, `/procurement/*` UI routes are hidden/blocked and `/v1/procurement/*` API routes are blocked.
- When `fleet_transport` is disabled, `/fleet-transport/*` UI routes are hidden/blocked and `/v1/fleet-transport/*` API routes are blocked.
- When `customer_wallet_credit` is disabled, `/customer-wallet-credit/*` UI routes are hidden/blocked and `/v1/customer-wallet-credit/*` API routes are blocked.
- When `reconciliation` is disabled, `/reconciliation/*` UI routes are hidden/blocked and `/v1/reconciliation/*` API routes are blocked.
- When `notification_hub` is disabled, `/notification-hub/*` UI routes are hidden/blocked and `/v1/notification-hub/*` API routes are blocked.
- Communication internal API access is module-gated by:
  - `communication_internal`
- Communication calls API access is module-gated by:
  - `communication_calls_livekit`
- Customer service communication API access is module-gated by:
  - `communication_customer_service`
- IT support API access is module-gated by:
  - `it_support`
- IT support API access is permission-gated by:
  - `CanReadItSupportTickets`
  - `CanCreateItSupportTickets`
  - `CanUpdateItSupportTickets`

Parcel internal transfer notes:

- `GET /warehouses`
- `GET /warehouses/options`
- `POST /warehouses`
- `PATCH /warehouses/:id`
- `DELETE /warehouses/:id`
- `GET /shipments/parcel-internal-transfers`
- `GET /shipments/parcel-internal-transfers/:id`
- `POST /shipments/parcel-internal-transfers`
- `POST /shipments/parcel-internal-transfers/:id/acknowledge`
- `POST /shipments/parcel-internal-transfers/:id/cancel`
- these APIs move internal custody only and do not change parcel shipment status

Upload notes:

- file uploads are backed by MinIO when configured
- uploads are recorded against `modelType` and `modelId`
- rider signature capture uses the upload API before delivery confirmation is saved
- employee profile photos use the same upload API with `modelType=employee-profile-image`
- customer card images use the same upload API with `modelType=customer-card-front-image` and `customer-card-back-image`
- IT support ticket attachments use `modelType=it-support-ticket` and `modelId=<ticketId>`
- uploaded objects are served back through the app proxy route

Reference:

- `docs/COMPANY_MODULES.md`
- `docs/PROCUREMENT_MODULE.md`
- `docs/FLEET_TRANSPORT_MODULE.md`
- `docs/CUSTOMER_WALLET_CREDIT_MODULE.md`
- `docs/RECONCILIATION_MODULE.md`
- `docs/NOTIFICATION_HUB_MODULE.md`
- `docs/PARCEL_INTERNAL_TRANSFERS.md`
- `docs/REPORTING_MODULE.md`

## Inventory

- `/inventory/categories`
- `/inventory/products`
- `/inventory/locations`
- `/inventory/stock-levels`
- `/inventory/stock-movements`
- `/inventory/stock-adjustments`
- `/inventory/stock-transfers`

## Governance

- `/audit`
- `/rbac`
- `/reports`
  - `GET /reports/employees`
  - `GET /reports/attendance`
  - `GET /reports/leave-requests`
  - `GET /reports/payroll-register`
  - `GET /reports/payroll-overtime`
  - `GET /reports/payroll-adjustments`
  - `GET /reports/payroll-journal-reconciliation`
  - `GET /reports/cashier-performance`
  - `GET /reports/daily-cash-confirmations`
  - `GET /reports/expense-by-category`
  - `GET /reports/shift-revenue`
  - `GET /reports/branch-profitability`
  - `GET /reports/credit-exposure`
  - `GET /reports/customer-credit-aging-detail`
  - `GET /reports/tobepaid-outstanding`
  - `GET /reports/tobepaid-collections-reconciliation`
  - `GET /reports/parcel-status-summary`
  - `GET /reports/delivery-performance`

## Geolocation (PostGIS)

- `GET /geolocation/distance`
- `GET /geolocation/branches/nearby`

## Interactive docs

- Swagger UI: `/docs`
- OpenAPI JSON: `/docs/json`
