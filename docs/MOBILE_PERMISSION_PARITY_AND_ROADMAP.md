# Mobile Permission Parity and Feature Roadmap

Last audited: 2026-08-27

## Objective

Mobile uses the same role permission keys and server authorization as the web and desktop applications. A feature must not become available on mobile merely because the user is authenticated, has a similarly named role, or can access an adjacent workflow.

The server remains authoritative. Mobile guards provide correct navigation, prevent avoidable requests, and explain denied access, but they never replace endpoint permission, module, company, branch, location, or assignment checks.

## Guarding Standard

Every mobile capability requires all applicable layers:

1. Hide navigation and shortcuts when the user lacks access.
2. Guard the destination screen against direct or stale navigation.
3. Guard each mutation independently from its read screen.
4. Avoid loading restricted data in background hooks.
5. Use the exact desktop permission key; do not substitute a broader permission.
6. Apply the same company-module gate as desktop.
7. Preserve company, branch, location, cashier, rider, and employee scope.
8. Keep server authorization and tests even when the UI is guarded.

Role-name matching is forbidden for authorization and dashboard identity. Operational dashboards use the authenticated `userType` and actual domain assignment; permissions decide capabilities within that context.

The Rider Dashboard and Rider tab presentation require `userType = RIDER`. Rider read permissions may expose specifically authorized rider tools to supervisors or support staff, but they must never convert a Staff account—including an IT Officer—into Rider dashboard presentation. A missing or invalid `userType` falls back to the standard dashboard.

## Current Mobile Permission Matrix

| Mobile capability              | Screen permission                                                                          | Additional action permission                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Dashboard                      | `CanReadDashboard`                                                                         | Capability-specific actions remain separate.                                                                        |
| Create parcel                  | `CanCreateBookingWithParcels`                                                              | Sender collection later requires sender-payment and cashier-session rules.                                          |
| Parcel search and details      | `CanReadParcels`                                                                           | Future edits require their own update permission.                                                                   |
| Queue entry screen             | Any of `CanCreatePickupQueue`, `CanReadSenderPickupQueue`, or `CanReadReceiverPickupQueue` | Search: `CanReadParcels`; issue: `CanCreatePickupQueue`; each board uses its matching read permission.              |
| Scan to receive                | `CanReadParcelScan`                                                                        | Confirm/update: `CanUpdateParcels`.                                                                                 |
| Incoming consignment receiving | `CanReadParcelIncoming`                                                                    | Scan/receive mutation: `CanUpdateParcels`.                                                                          |
| Rider current/assigned work    | `CanReadRiderCurrentParcels`                                                               | Complete, return, handover, and change request: `CanCompleteDoorstepDelivery`.                                      |
| Rider history                  | `CanReadRiderHistory`                                                                      | Read-only.                                                                                                          |
| Cashier session summary        | `CanReadCashierSessions`                                                                   | Types: `CanReadCashierSessionTypes`; open: `CanOpenCashierSessions`; close: `CanCloseCashierSessions`.              |
| Cashier Sales report           | `CanViewReportCashierShifts`                                                               | No accounting-read fallback.                                                                                        |
| Change own password            | `CanChangePassword`                                                                        | Current password and server validation still apply.                                                                 |
| Profile                        | Authenticated self access                                                                  | Profile mutations use their API authorization.                                                                      |
| Self-service bookings          | `CanReadSelfServiceBookings`                                                               | Claim/complete: `CanCompleteSelfServiceBookings`; mobile currently uses pay-now settlement.                         |
| Call-center follow-up          | `CanReadCallCenterParcelStatus` or `CanMarkDoorstepCalled`                                 | Record call: `CanReadCallCenterParcelStatus`; address/fee: `CanMarkDoorstepCalled`.                                 |
| Receiving discrepancies        | `CanReadParcelIncoming`                                                                    | Create/list use the same current server permission; evidence upload is authenticated and linked to the discrepancy. |
| Delivery-change review         | `CanMarkDoorstepCalled`                                                                    | Approve/reject also requires server branch match and pending state.                                                 |
| Customer directory             | `CanReadCustomers`                                                                         | Limited contact edit: `CanUpdateCustomers`.                                                                         |

The mobile access-control tests compare every mobile permission key with the desktop permission catalog to detect spelling or catalog drift.

## Current Module-Gate Gap

Internal Communication and LiveKit Calls are gated on desktop and server by `communication_internal` and `communication_calls_livekit`. The current mobile login session contains permission keys but not enabled company-module codes. The server blocks disabled modules, but mobile cannot yet hide the Chat tab or voice controls proactively.

Required parity work:

- Return enabled module codes in authenticated bootstrap data or expose a lightweight authenticated module-capabilities endpoint.
- Store refreshed module capabilities with the mobile session.
- Hide Chat when `communication_internal` is disabled.
- Hide voice controls when `communication_calls_livekit` is disabled.
- Clear or refresh cached capabilities when the company configuration or session changes.
- Add module-disabled tests on the mobile client and server.

## Desktop Capabilities to Build on Mobile

The five frontline workflows above were implemented on 2026-08-27. Their current behavior and remaining limitations are maintained in [Mobile Frontline Workflows](MOBILE_FRONTLINE_WORKFLOWS.md).

### Priority 1: Frontline and Field Operations

These benefit most from camera, mobility, quick actions, signatures, OTPs, and work away from a desk.

| Desktop capability            | Mobile experience                                                                                | Primary permission family                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Sender Cashier Payments       | Find created parcel, collect sender payment, choose method, print/reprint.                       | `CanCreateSenderPayments`, cashier session permissions.         |
| Receiver Cashier              | Lookup/scan parcel, collect receiver payment, verify OTP, complete handover.                     | `CanCreateReceiverPayments`, `CanCompleteOfficePickup`.         |
| Sticker printing everywhere   | Shared unrestricted positive-whole-number copies and supported native/Bluetooth printer routing. | Existing workflow print/reprint permissions.                    |
| Pickup queue boards           | Full sender/receiver boards, ticket share, call action, and completion.                          | Queue read/create and office-pickup permissions.                |
| Outgoing consignment dispatch | Scan parcels into a consignment, review manifest, dispatch.                                      | `CanReadParcelOutgoing`, consignment create/update permissions. |
| Receiving discrepancies       | Record missing, extra, damaged, or unresolved items with evidence.                               | `CanReadParcelIncoming`, parcel update permissions.             |
| Internal custody transfers    | Scan, create, acknowledge, cancel, and show printable/shareable transfer slip.                   | Internal-transfer read/create/acknowledge/cancel permissions.   |
| Call center follow-up         | Call sender/receiver, record outcomes, capture address, preserve follow-up queue.                | Call-center and doorstep-call permissions.                      |
| Self-service agent completion | Claim draft, complete operational details, settle, and print.                                    | Self-service read/complete plus payment permissions.            |
| Delivery change review        | Branch supervisor approves/rejects rider address or fee changes.                                 | Dispatch/review permission enforced by the delivery API.        |
| Customer lookup               | Search, inspect contact/cards, create or update limited customer data.                           | Customer read/create/update permissions.                        |

### Priority 2: Approvals and Work on the Move

These fit mobile when the interaction is a focused review, approval, capture, or exception response.

| Area             | Mobile candidate                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| Accounting       | Daily cash confirmation, expense submit/approve/pay, variance alerts.                              |
| Reconciliation   | Review evidence, approve/reject sessions and bank settlements, track exceptions.                   |
| Procurement      | Demand/request approvals, supplier quote comparison summary, goods receipt capture.                |
| Inventory        | Stock requests, issue/receive acknowledgement, barcode counts, transfers, low-stock alerts.        |
| HR               | Attendance check-in/out, leave request/approval, employee contact directory, payslip access.       |
| Fleet            | Driver trip view, check-in/out, fuel capture, incident evidence, maintenance task acknowledgement. |
| Notification Hub | Campaign approval, send confirmation, failure alerts, retry with permission.                       |
| IT Support       | Create/update tickets, notes, evidence upload, assigned-ticket alerts.                             |
| Management       | Executive, fleet, and operations briefs; branch KPIs; exception notifications.                     |

Each feature must reuse the exact permission and module gate from its desktop route and API. Approve, pay, post, send, and retry actions must never inherit permission from read access.

### Priority 3: Mobile Summaries, Desktop Authoring

Complex setup and high-density workflows should initially remain desktop-authored while mobile provides safe read summaries or focused approvals:

- Chart of accounts, tax setup, manual journal authoring, and full financial statements.
- Role/permission design, company-module administration, and bulk user administration.
- Printer routing and application-release administration.
- Full payroll-cycle configuration, journalization, reversal, and bank-export authoring.
- Complex procurement consolidation and purchase-order authoring.
- Inventory allocation policies, valuation configuration, and enterprise audit analysis.
- Fleet route planning, load optimization, deep analytics, and maintenance-policy configuration.
- Large report builders, bulk exports, and wide reconciliation tables.

These can move to mobile later if a mobile-specific workflow is designed; desktop pages should not simply be squeezed into a phone viewport.

## Delivery Sequence for Every New Mobile Feature

1. Map the desktop route, endpoint, permission, module, and scope rules.
2. Design a task-focused mobile workflow.
3. Add permission and module policies to the centralized access-control feature.
4. Guard navigation, screen data loads, and every action.
5. Verify server authorization and tenant/branch isolation.
6. Test granted, denied, stale-session, module-disabled, and assignment-mismatch cases.
7. Update this roadmap, the module document, API/permission references when affected, and mobile QA documentation.

## Failure Behavior

- Missing screen permission: show a no-access state and make no protected request.
- Missing action permission: keep the screen readable but hide/disable the action and reject stale invocations.
- Server `401`: refresh once when valid; otherwise clear the session and require login.
- Server `403`: show an explicit authorization message; do not retry as another action.
- Module disabled: hide the entry point and treat direct navigation as unavailable.
- Assignment or branch mismatch: show the server denial without broadening the request scope.
