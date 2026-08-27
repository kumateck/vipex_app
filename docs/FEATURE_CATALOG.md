# Vipex Feature Catalog

Last audited: 2026-08-27

This catalog maps the current application by business capability. Sidebar visibility varies by role permission and enabled company modules.

## Workspace

| Capability             | Main UI                | Notes                                                                          |
| ---------------------- | ---------------------- | ------------------------------------------------------------------------------ |
| Role-aware dashboards  | `/dashboard`           | General, admin, accountant, auditor, cashier, CEO, HR, IT, and secretary views |
| Parcel super search    | `/parcels`             | Search and inspect parcel state and related details                            |
| AI insights chat       | `/ai-chat`             | Permission-gated, tool-assisted management queries                             |
| Internal communication | `/communication/*`     | Team chat, calls, events, presence, and push integration                       |
| Appearance             | `/settings/appearance` | Theme and visual preferences                                                   |
| Help Center            | `/help`                | Curated guides plus optional LLM assistant                                     |

## Parcel and Delivery Operations

| Capability                   | Main UI                                             | Notes                                                                                                       |
| ---------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Parcel creation              | `/parcels/create`                                   | Multi-parcel booking, customer lookup, payer choice, charge validation, optional immediate payment/printing |
| Sender payment               | `/parcels/sender-payments`                          | Sender due collection, cash/mobile money/credit rules, receipt and sticker printing                         |
| Customer self-service drafts | Public branch QR and `/parcels/self-service`        | Short-lived customer draft, agent claim/complete/cancel, expiry sweep                                       |
| Reconciliation cases         | `/parcels/reconciliation-cases`                     | Controlled amount/status/link corrections with approval and execution                                       |
| Consignments                 | `/parcels/processed`                                | Select processed parcels, generate consignments, edit, reprint, dispatch                                    |
| Incoming receiving           | `/parcels/in-transit/incoming`                      | Receive consignment, completeness checks, OTP where required, discrepancies                                 |
| Scan to receive              | `/parcels/receive`                                  | QR/manual parcel arrival confirmation                                                                       |
| Call center                  | `/parcels/status`, `/parcels/home-delivery/address` | Outcomes, sender-contact flag, address collection                                                           |
| Internal custody             | `/parcels/internal-transfers/*`                     | Branch/location/warehouse custody transfers and acknowledgement                                             |
| Pickup and collection        | `/parcels/pickup-queue*`, `/parcels/waiting-pickup` | Daily queues, sender/receiver boards, pickup OTP and handover                                               |
| Receiver cashier             | `/parcels/receiver-cashier`                         | To-be-paid collection and receiver handover                                                                 |
| Aged parcels                 | `/parcels/uncollected`                              | Ageing and disposition follow-up                                                                            |
| Last-mile dispatch           | `/parcels/home-delivery/*`                          | Address, dispatch, rider assignment, returns, change requests                                               |
| Delivery cashier             | `/parcels/delivery-cashier`                         | Delivery collection finalization                                                                            |
| Rider workforce              | `/parcels/rider/*`                                  | Current assignments and history                                                                             |

See [Parcel operations](PARCEL_OPERATIONS.md) and [Parcel printing](PARCEL_PRINTING.md).

## Finance

- Accounting daily cash, expenses, journals, setup, tax, and reports under `/accounting/*`.
- Cashier sessions under `/cashier/sessions/*`.
- Customer wallet and credit controls under `/customer-wallet-credit/*`.
- Operational and bank reconciliation under `/reconciliation/*`.
- Payment records distinguish sender, receiver, and delivery collection, payment method, component, and cashier session.

See [Accounting](ACCOUNTING_MODULE.md) and [Cashier, payments, and shifts](CASHIER_PAYMENTS_AND_SHIFTS.md).

## Commercial and Communication

- Customer master and CRM under `/customers`.
- Notification provider/template/campaign orchestration under `/notification-hub/*`.
- SMS settings under `/settings/sms`, including MTN and mNotify configuration/balance support.
- Internal chat/calls/events under `/communication/*`, with WebSocket updates.
- Customer-service tickets, conversations, feedback, and SLA APIs under `/v1/customer-service/*`.
- Partner portal route at `/partner-agent-portal` when its company module is enabled.

## Human Capital

- employee, department, and job-title administration
- attendance records
- leave requests, types, history, date/week selection, and swap approvals
- compensation, payroll groups, cycles, inputs, overtime, adjustments, payslips, bank export, journalization, reversal, and reopening

See [HR and payroll](HR_PAYROLL_FOUNDATION.md).

## Procurement and Inventory

- supplier and purchase-request workflows
- fleet/inventory demand intake and consolidation
- demand/request approvals, supplier quotes, purchase orders, and goods receipts
- products, categories, inventory locations, stock levels, lots, expiry, and traceability
- stock movements, adjustments, consumption, counts, transfers, and requests
- reservations and allocation policies
- maintenance, approvals, valuation, replenishment, tasks, audit journal, and KPIs

See [Procurement](PROCUREMENT_MODULE.md) and [Inventory](INVENTORY_IMPLEMENTATION.md).

## Fleet Transport

- vehicle registry and children
- trips and route plans
- fuel logs, approvals, analytics, and fraud signals
- driver compliance, rosters, incidents, policy acknowledgements, and escalation
- maintenance, work orders, parts, downtime RCA, reliability, and procurement traceability
- dispatch board, route assignments, load matching, check-in/out, live status, exceptions, and performance
- decision support, executive scorecard, and unit economics
- granular action permissions and anomaly briefs

See [Fleet transport](FLEET_TRANSPORT_MODULE.md) and [Fleet program status](FLEET_PROGRAM_STATUS.md).

## Reports and Intelligence

The report center contains financial, branch, payroll, workforce, attendance, expense/cash, customer, parcel, consignment, cashier, inventory, and audit reports. Newer capabilities include daily cashier transaction details and sticker-print usage reporting.

AI-supported surfaces include:

- help assistant
- AI insights chat
- executive insights
- fleet anomaly brief
- operations exceptions brief
- management daily brief

See [Reporting](REPORTING_MODULE.md) and [AI, help, and management insights](AI_HELP_AND_INSIGHTS.md).

## Technology and Configuration

- user lifecycle: active/inactive/invited users and resend invite
- System Admin-only password management
- roles, permissions, privilege-escalation prevention, and audit reports
- company profile and module management
- branch settings, including pickup and receiver OTP requirements
- locations, warehouses, customer cards, parcel ageing, printer routing, and app updates
- IT support tickets and event history
- shared uploads for signatures, profiles, cards, evidence, and other model-linked files

See [Platform and access control](PLATFORM_AND_ACCESS.md) and [Client applications](CLIENT_APPLICATIONS.md).

## API Module Roots

All business APIs are mounted under `/v1`. Current roots include:

`auth`, `users`, `branches`, `locations`, `warehouses`, `customers`, `cards`, `uploads`, `cashiers`, `shipments`, `payments`, `deliveries`, `pickup-queues`, `accounting`, `inventory`, `shifts`, `company-modules`, `module-workspace`, `procurement`, `fleet-transport`, `customer-wallet-credit`, `reconciliation`, `notification-hub`, `momo`, `self-service`, `desktop-updates`, `mobile-updates`, `communication`, `customer-service`, `help-assistant`, `executive-insights`, `fleet-anomaly-brief`, `operations-exceptions-brief`, `management-daily-brief`, `ai-chat`, `it-support`, `reports`, `audit`, `hr`, `payroll`, `rbac`, and `geolocation`.
