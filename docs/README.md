# Vipex Documentation Hub

Last audited: 2026-08-27

This directory is the canonical documentation set for the current Vipex application. Daily implementation logs and Git history remain useful historical evidence, but current behavior must be described in the module documents linked here.

## Start Here

- [Application overview](APPLICATION_OVERVIEW.md)
- [Feature catalog](FEATURE_CATALOG.md)
- [Architecture](ARCHITECTURE.md)
- [API surface](API.md)
- [Developer onboarding](ONBOARDING.md)
- [Documentation coverage](DOCUMENTATION_COVERAGE.md)
- [Route and permission matrix](ROUTE_PERMISSION_MATRIX.md)

## Operations and Parcels

- [Parcel operations](PARCEL_OPERATIONS.md)
- [Parcel printing](PARCEL_PRINTING.md)
- [Cashier, payments, and shifts](CASHIER_PAYMENTS_AND_SHIFTS.md)
- [Parcel internal transfers](PARCEL_INTERNAL_TRANSFERS.md)
- [Self-service booking](SELF_SERVICE_BOOKING.md)
- [Reconciliation](RECONCILIATION_MODULE.md)
- [Operational reconciliation QA](RECONCILIATION_QA_CHECKLIST.md)

## Finance and Commercial

- [Accounting](ACCOUNTING_MODULE.md)
- [Customer and CRM](CRM_SYSTEM.md)
- [Customer wallet and credit](CUSTOMER_WALLET_CREDIT_MODULE.md)
- [Customer wallet and credit QA](CUSTOMER_WALLET_CREDIT_QA_CHECKLIST.md)
- [Reporting](REPORTING_MODULE.md)
- [Notification hub](NOTIFICATION_HUB_MODULE.md)

## People and Supply Chain

- [HR and payroll](HR_PAYROLL_FOUNDATION.md)
- [Inventory implementation](INVENTORY_IMPLEMENTATION.md)
- [Inventory API examples](INVENTORY_API_EXAMPLES.md)
- [Inventory rollout runbook](INVENTORY_ROLLOUT_RUNBOOK.md)
- [Procurement](PROCUREMENT_MODULE.md)
- [Procurement orchestration](PROCUREMENT_ORCHESTRATION_IMPLEMENTATION.md)
- [Fleet transport](FLEET_TRANSPORT_MODULE.md)
- [Fleet program status](FLEET_PROGRAM_STATUS.md)

## Platform, Access, and Intelligence

- [Platform and access control](PLATFORM_AND_ACCESS.md)
- [Company modules](COMPANY_MODULES.md)
- [AI, help, and management insights](AI_HELP_AND_INSIGHTS.md)
- [Communication suite](COMMUNICATION_SUITE_SPEC.md)
- [Notification hub QA](NOTIFICATION_HUB_QA_CHECKLIST.md)
- [Observability](OBSERVABILITY_DISCORD_LOKI.md)
- [Sidebar system](SIDEBAR_SYSTEM.md)

## Client Applications and Delivery

- [Client applications](CLIENT_APPLICATIONS.md)
- [Mobile implementation](MOBILE_APP_IMPLEMENTATION.md)
- [Mobile permission parity and feature roadmap](MOBILE_PERMISSION_PARITY_AND_ROADMAP.md)
- [Mobile frontline workflows](MOBILE_FRONTLINE_WORKFLOWS.md)
- [Mobile QA](MOBILE_QA_SMOKE_CHECKLIST.md)
- [Electron shell](ELECTRON_SHELL_IMPLEMENTATION.md)
- [Private app update pipeline](PRIVATE_APP_UPDATE_PIPELINE.md)
- [Mobile branding assets](MOBILE_BRANDING_ASSETS.md)

## UI and Engineering Standards

- [Appearance system](APPEARANCE_SYSTEM.md)
- [Appearance parity plan](APPEARANCE_STYLE_PARITY_PLAN.md)
- [Create/edit architecture](create-edit-architecture.md)
- [Creatable combobox](CREATABLE_COMBOBOX.md)

## Specialized Design, Rollout, and QA References

- [Dashboard V1 specification](DASHBOARD_V1_SPEC.md)
- [Dashboard V1 backlog](DASHBOARD_V1_BACKLOG.md)
- [ERP backend endpoints V1](ERP_BACKEND_ENDPOINTS_V1.md)
- [ERP module rollout plan](ERP_MODULE_ROLLOUT_PLAN.md)
- [Communication implementation checklist](COMMUNICATION_IMPLEMENTATION_CHECKLIST.md)
- [Mobile communication refactor notes](mobile/communication-whatsapp-refactor-notes-2026-04-11.md)
- [Inventory lot and FEFO engine](INVENTORY_LOT_FEFO_ENGINE.md)
- [Inventory reservation and allocation engine](INVENTORY_RESERVATION_ALLOCATION_ENGINE.md)
- [Inventory staging checklist](INVENTORY_STAGING_EXECUTION_CHECKLIST.md)
- [Procurement QA checklist](PROCUREMENT_QA_CHECKLIST.md)
- [Procurement QA run, 2026-03-31](PROCUREMENT_QA_RUN_2026-03-31.md)
- [Fleet maintenance phase 2](FLEET_MAINTENANCE_PHASE2.md)
- [Fleet analytics phase 3](FLEET_ANALYTICS_PHASE3.md)
- [Fleet automation orchestration](FLEET_AUTOMATION_ORCHESTRATION.md)
- [Fleet dispatch operations workflow](FLEET_DISPATCH_OPERATIONS_WORKFLOW.md)
- [Fleet transport QA checklist](FLEET_TRANSPORT_QA_CHECKLIST.md)
- [Fleet hardening UAT checklist](FLEET_HARDENING_UAT_CHECKLIST.md)
- [Notification Hub QA run, 2026-03-31](NOTIFICATION_HUB_QA_RUN_2026-03-31.md)

## Historical Implementation Records

These describe work completed on a date, but they are not the current source of truth:

- [2026-03-27](DAILY_IMPLEMENTATION_2026-03-27.md)
- [2026-03-28](DAILY_IMPLEMENTATION_2026-03-28.md)
- [2026-03-29](DAILY_IMPLEMENTATION_2026-03-29.md)
- [2026-03-31](DAILY_IMPLEMENTATION_2026-03-31.md)
- [June–August 2026 recovery changelog](CHANGELOG_2026-06_TO_2026-08.md)

## Documentation Maintenance Rule

Every feature change must update its canonical document in the same change. Also update, when applicable:

- `API.md` for endpoints
- `ROUTE_PERMISSION_MATRIX.md` for route access
- `COMPANY_MODULES.md` for module gates
- the relevant QA checklist for scenarios and regressions
- this index for new documents

Documents must distinguish implemented behavior from planned behavior and known mismatches.
