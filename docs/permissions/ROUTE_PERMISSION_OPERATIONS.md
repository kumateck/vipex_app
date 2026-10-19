# Route Permissions: Operations and People

Generated from `src/shared/permissions/constants.ts` (`RoutePermissionOverrides`) on 2026-10-17.

Parcel, cashier, and human-capital route overrides.

| Route                                   | Permission key                     |
| --------------------------------------- | ---------------------------------- |
| `/parcels/sender-payments`              | `CanCreateSenderPayments`          |
| `/parcels/processed`                    | `CanReadConsignments`              |
| `/parcels/consignments/history`         | `CanReadConsignmentsHistory`       |
| `/parcels/pickup-queue`                 | `CanCreatePickupQueue`             |
| `/parcels/pickup-queue/sender`          | `CanReadSenderPickupQueue`         |
| `/parcels/waiting-pickup`               | `CanCompleteOfficePickup`          |
| `/parcels/pickup-queue/receiver`        | `CanReadReceiverPickupQueue`       |
| `/parcels/receiver-cashier`             | `CanCreateReceiverPayments`        |
| `/parcels/uncollected`                  | `CanViewReportParcelsUncollected`  |
| `/parcels/in-transit/outgoing`          | `CanReadParcelOutgoing`            |
| `/parcels/in-transit/incoming`          | `CanReadParcelIncoming`            |
| `/parcels/discrepancies`                | `CanReadParcelIncoming`            |
| `/parcels/return-to-source`             | `CanReadParcels`                   |
| `/parcels/reconciliation-cases`         | `CanReadParcelReconciliation`      |
| `/parcels/storage-clearances`           | `CanReadParcelStorageClearances`   |
| `/parcels/storage-clearances/new`       | `CanRequestParcelStorageClearance` |
| `/parcels/storage-clearances/approvals` | `CanApproveParcelStorageClearance` |
| `/parcels/storage-clearances/execution` | `CanExecuteParcelStorageClearance` |
| `/parcels/receive`                      | `CanReadParcelScan`                |
| `/parcels/delivery-reversal`            | `CanReverseParcelDelivery`         |
| `/parcels/financial-repair`             | `CanRepairParcelFinancialState`    |
| `/parcels/home-delivery/dispatch`       | `CanDispatchForDelivery`           |
| `/parcels/home-delivery/returned`       | `CanDispatchForDelivery`           |
| `/parcels/home-delivery/rider-assigned` | `CanDispatchForDelivery`           |
| `/parcels/delivery-cashier`             | `CanCompleteDoorstepDelivery`      |
| `/parcels/status`                       | `CanReadCallCenterParcelStatus`    |
| `/parcels/call-center-assignment`       | `CanReadCallCenterAssignment`      |
| `/parcels/shelf-picker-update`          | `CanReadShelfPickerUpdate`         |
| `/parcels/shelf-pickup-reassignment`    | `CanUpdateParcelShelfPicker`       |
| `/parcels/home-delivery/address`        | `CanMarkDoorstepCalled`            |
| `/parcels/rider/current`                | `CanReadRiderCurrentParcels`       |
| `/parcels/rider/history`                | `CanReadRiderHistory`              |
| `/parcels/edit/:id`                     | `CanCreateBookingWithParcels`      |
| `/parcels/self-service`                 | `CanReadSelfServiceBookings`       |
| `/parcels/self-service/:id`             | `CanCompleteSelfServiceBookings`   |
| `/branches/:id/qr-print`                | `CanPrintSelfServiceQrCode`        |
| `/cashiers`                             | `CanReadCashiers`                  |
| `/cashier/sessions/active`              | `CanReadActiveCashierSessions`     |
| `/cashier/sessions/history`             | `CanReadCashierSessionsHistory`    |
| `/cashier/sessions/open`                | `CanReadOpenCashierSessions`       |
| `/cashier/sessions/close`               | `CanReadCloseCashierSessions`      |
| `/hr/attendance`                        | `CanReadAttendance`                |
| `/hr/leave`                             | `CanReadLeaveRequests`             |
| `/hr/leave/requests`                    | `CanReadLeaveRequests`             |
| `/hr/leave/history`                     | `CanReadLeaveRequests`             |
| `/hr/leave/types`                       | `CanReadLeaveTypes`                |

Receiver Cashier's Delivered receipt action uses
`GET /v1/shipments/parcels/:id/receiver-receipt-reprint`, requiring
`CanCreateReceiverPayments` and the authenticated company/destination branch. It cannot read
receipts across branches, even with broad parcel read permission. Parcel search retains its
existing read permission, and printing retains the active cashier-session gate. Only
non-deleted office-delivered parcels with recorded receiver payments are eligible. Web and
desktop support the action; mobile does not. QA: test cashier permission, missing permission,
other company/branch, deleted parcel, and a reversed delivery; denied requests must not print.

## Parcel information edits

`GET /v1/shipments/parcels/:id/details` and `GET /v1/shipments/parcels/:id/history` require
`CanReadParcels` and are company-scoped (404 outside the caller's company). The history is visible
to anyone who can open the parcel; it does not require `CanListAuditLogs` or
`CanGetEntityAuditHistory`. See [Parcel details and history](../PARCEL_DETAILS.md#access-and-scope).

`POST /v1/shipments/parcels/:id/edit-information` accepts one of `CanUpdateParcels`,
`CanReadParcelIncoming`, `CanCompleteOfficePickup`, `CanCreateReceiverPayments`,
`CanReadParcelScan`, or `CanReadShelfPickerUpdate`. A receiver payload additionally requires
`CanUpdateCustomers`. Writes use the authenticated company and destination branch, or the
source branch when the actor has `CanUpdateParcels`;
client-supplied company/branch scope is not accepted. Customer Management PATCH routes keep
their existing `CanUpdateCustomers` gate and never update parcel snapshots.
QA: with each workflow grant, verify details-only edits succeed, receiver edits fail without
the customer grant and succeed with it, customer permission alone fails, and another branch
or company cannot edit the parcel. The source-branch Edit action is available on Processed
Parcels / Consignment, In Transit Outgoing and Super Search; receiver fields additionally need
`CanUpdateCustomers`. Source read-workflow grants alone do not permit outgoing edits. See
`tests/server/parcel-information-edit-access.spec.ts` and `parcel-information-edit.spec.ts`.

Sender customer correction: `GET /shipments/parcels/:id/sender-candidates` and
`POST /shipments/parcels/:id/correct-sender` both require `CanUpdateParcels` **and**
`CanUpdateCustomers` and enforce the authenticated company/source branch. Neither destination
branch access nor customer permission alone grants this action. Candidate lookup discloses only
exact matching customer identity fields. Creation-page name editing remains under
`CanCreateBookingWithParcels` for lookup and `CanUpdateCustomers` for saving on both clients.
