# Route Permissions: Operations and People

Generated from `src/shared/permissions/constants.ts` (`RoutePermissionOverrides`) on 2026-09-23.

Parcel, cashier, and human-capital route overrides.

| Route                                   | Permission key                    |
| --------------------------------------- | --------------------------------- |
| `/parcels/sender-payments`              | `CanCreateSenderPayments`         |
| `/parcels/processed`                    | `CanReadConsignments`             |
| `/parcels/consignments/history`         | `CanReadConsignments`             |
| `/parcels/pickup-queue`                 | `CanCreatePickupQueue`            |
| `/parcels/pickup-queue/sender`          | `CanReadSenderPickupQueue`        |
| `/parcels/waiting-pickup`               | `CanCompleteOfficePickup`         |
| `/parcels/pickup-queue/receiver`        | `CanReadReceiverPickupQueue`      |
| `/parcels/receiver-cashier`             | `CanCreateReceiverPayments`       |
| `/parcels/uncollected`                  | `CanViewReportParcelsUncollected` |
| `/parcels/in-transit/outgoing`          | `CanReadParcelOutgoing`           |
| `/parcels/in-transit/incoming`          | `CanReadParcelIncoming`           |
| `/parcels/discrepancies`                | `CanReadParcelIncoming`           |
| `/parcels/reconciliation-cases`         | `CanReadParcelReconciliation`     |
| `/parcels/receive`                      | `CanReadParcelScan`               |
| `/parcels/delivery-reversal`            | `CanReverseParcelDelivery`        |
| `/parcels/home-delivery/dispatch`       | `CanDispatchForDelivery`          |
| `/parcels/home-delivery/rider-assigned` | `CanDispatchForDelivery`          |
| `/parcels/delivery-cashier`             | `CanCompleteDoorstepDelivery`     |
| `/parcels/status`                       | `CanReadCallCenterParcelStatus`   |
| `/parcels/call-center-assignment`       | `CanReadCallCenterAssignment`     |
| `/parcels/shelf-picker-update`          | `CanReadShelfPickerUpdate`        |
| `/parcels/home-delivery/address`        | `CanMarkDoorstepCalled`           |
| `/parcels/rider/current`                | `CanReadRiderCurrentParcels`      |
| `/parcels/rider/history`                | `CanReadRiderHistory`             |
| `/parcels/edit/:id`                     | `CanCreateBookingWithParcels`     |
| `/parcels/self-service`                 | `CanReadSelfServiceBookings`      |
| `/parcels/self-service/:id`             | `CanCompleteSelfServiceBookings`  |
| `/branches/:id/qr-print`                | `CanPrintSelfServiceQrCode`       |
| `/cashiers`                             | `CanReadCashiers`                 |
| `/cashier/sessions/active`              | `CanReadActiveCashierSessions`    |
| `/cashier/sessions/history`             | `CanReadCashierSessionsHistory`   |
| `/cashier/sessions/open`                | `CanReadOpenCashierSessions`      |
| `/cashier/sessions/close`               | `CanReadCloseCashierSessions`     |
| `/hr/attendance`                        | `CanReadAttendance`               |
| `/hr/leave`                             | `CanReadLeaveRequests`            |
| `/hr/leave/requests`                    | `CanReadLeaveRequests`            |
| `/hr/leave/history`                     | `CanReadLeaveRequests`            |
| `/hr/leave/types`                       | `CanReadLeaveTypes`               |
