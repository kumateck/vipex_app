const PermissionKeys = {
  CanCreatePickupQueue: 'CanCreatePickupQueue',
  CanReadSenderPickupQueue: 'CanReadSenderPickupQueue',
  CanReadReceiverPickupQueue: 'CanReadReceiverPickupQueue',
  CanReadParcels: 'CanReadParcels',
  CanReadRiderCurrentParcels: 'CanReadRiderCurrentParcels',
  CanReadRiderHistory: 'CanReadRiderHistory',
  CanCompleteDoorstepDelivery: 'CanCompleteDoorstepDelivery',
  CanReadParcelScan: 'CanReadParcelScan',
  CanReadParcelIncoming: 'CanReadParcelIncoming',
  CanUpdateParcels: 'CanUpdateParcels',
  CanCreateBookingWithParcels: 'CanCreateBookingWithParcels',
  CanReadCashierSessions: 'CanReadCashierSessions',
  CanReadCashierSessionTypes: 'CanReadCashierSessionTypes',
  CanOpenCashierSessions: 'CanOpenCashierSessions',
  CanCloseCashierSessions: 'CanCloseCashierSessions',
  CanViewReportCashierShifts: 'CanViewReportCashierShifts',
  CanReadAccounting: 'CanReadAccounting',
} as const;

export function hasPermission(permissions: string[] | undefined, key: string): boolean {
  return Boolean(permissions?.includes(key));
}

export function canViewQueueScreen(permissions: string[] | undefined): boolean {
  return (
    hasPermission(permissions, PermissionKeys.CanCreatePickupQueue) ||
    hasPermission(permissions, PermissionKeys.CanReadSenderPickupQueue) ||
    hasPermission(permissions, PermissionKeys.CanReadReceiverPickupQueue) ||
    hasPermission(permissions, PermissionKeys.CanReadParcels)
  );
}

export function canCreateQueueTicket(permissions: string[] | undefined): boolean {
  return hasPermission(permissions, PermissionKeys.CanCreatePickupQueue);
}

export function canViewReceiverQueueBoard(permissions: string[] | undefined): boolean {
  return hasPermission(permissions, PermissionKeys.CanReadReceiverPickupQueue);
}

export function canViewSenderQueueBoard(permissions: string[] | undefined): boolean {
  return hasPermission(permissions, PermissionKeys.CanReadSenderPickupQueue);
}

export function canSearchParcelsForQueue(permissions: string[] | undefined): boolean {
  return hasPermission(permissions, PermissionKeys.CanReadParcels);
}

export function canUseQueueModule(permissions: string[] | undefined): boolean {
  return canViewQueueScreen(permissions);
}

export function canViewRiderScreen(permissions: string[] | undefined): boolean {
  return (
    hasPermission(permissions, PermissionKeys.CanReadRiderCurrentParcels) ||
    hasPermission(permissions, PermissionKeys.CanReadRiderHistory) ||
    hasPermission(permissions, PermissionKeys.CanCompleteDoorstepDelivery)
  );
}

export function canCompleteRiderDeliveryActions(permissions: string[] | undefined): boolean {
  return hasPermission(permissions, PermissionKeys.CanCompleteDoorstepDelivery);
}

export function canUseRiderModule(permissions: string[] | undefined): boolean {
  return canViewRiderScreen(permissions);
}

export function canViewReceiveScreen(permissions: string[] | undefined): boolean {
  return (
    hasPermission(permissions, PermissionKeys.CanReadParcelScan) ||
    hasPermission(permissions, PermissionKeys.CanReadParcelIncoming)
  );
}

export function canMarkParcelArrived(permissions: string[] | undefined): boolean {
  return hasPermission(permissions, PermissionKeys.CanUpdateParcels);
}

export function canUseTransitReceiveScan(permissions: string[] | undefined): boolean {
  return (
    hasPermission(permissions, PermissionKeys.CanReadParcelScan) ||
    hasPermission(permissions, PermissionKeys.CanReadParcelIncoming)
  );
}

export function canCreateParcelBooking(permissions: string[] | undefined): boolean {
  return hasPermission(permissions, PermissionKeys.CanCreateBookingWithParcels);
}

export function canViewCashierSessions(permissions: string[] | undefined): boolean {
  return hasPermission(permissions, PermissionKeys.CanReadCashierSessions);
}

export function canReadCashierSessionTypes(permissions: string[] | undefined): boolean {
  return hasPermission(permissions, PermissionKeys.CanReadCashierSessionTypes);
}

export function canOpenCashierSessions(permissions: string[] | undefined): boolean {
  return hasPermission(permissions, PermissionKeys.CanOpenCashierSessions);
}

export function canCloseCashierSessions(permissions: string[] | undefined): boolean {
  return hasPermission(permissions, PermissionKeys.CanCloseCashierSessions);
}

export function canViewCashierSalesReport(permissions: string[] | undefined): boolean {
  return (
    hasPermission(permissions, PermissionKeys.CanViewReportCashierShifts) ||
    hasPermission(permissions, PermissionKeys.CanReadAccounting)
  );
}
