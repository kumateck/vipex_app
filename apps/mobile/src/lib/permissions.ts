export function hasPermission(permissions: string[] | undefined, key: string): boolean {
  return Boolean(permissions?.includes(key));
}

export const MobilePermissionKeys = Object.freeze({
  CanReadParcels: 'CanReadParcels',
  CanUpdateParcels: 'CanUpdateParcels',
  CanCreatePickupQueue: 'CanCreatePickupQueue',
  CanReadSenderPickupQueue: 'CanReadSenderPickupQueue',
  CanReadReceiverPickupQueue: 'CanReadReceiverPickupQueue',
  CanReadParcelScan: 'CanReadParcelScan',
  CanReadParcelIncoming: 'CanReadParcelIncoming',
  CanReadRiderCurrentParcels: 'CanReadRiderCurrentParcels',
  CanReadRiderHistory: 'CanReadRiderHistory',
  CanCompleteDoorstepDelivery: 'CanCompleteDoorstepDelivery',
});

export function canViewQueueScreen(permissions: string[] | undefined): boolean {
  return (
    hasPermission(permissions, MobilePermissionKeys.CanCreatePickupQueue) ||
    hasPermission(permissions, MobilePermissionKeys.CanReadSenderPickupQueue) ||
    hasPermission(permissions, MobilePermissionKeys.CanReadReceiverPickupQueue) ||
    hasPermission(permissions, MobilePermissionKeys.CanReadParcels)
  );
}

export function canCreateQueueTicket(permissions: string[] | undefined): boolean {
  return hasPermission(permissions, MobilePermissionKeys.CanCreatePickupQueue);
}

export function canViewReceiverQueueBoard(permissions: string[] | undefined): boolean {
  return hasPermission(permissions, MobilePermissionKeys.CanReadReceiverPickupQueue);
}

export function canViewSenderQueueBoard(permissions: string[] | undefined): boolean {
  return hasPermission(permissions, MobilePermissionKeys.CanReadSenderPickupQueue);
}

export function canSearchParcelsForQueue(permissions: string[] | undefined): boolean {
  return hasPermission(permissions, MobilePermissionKeys.CanReadParcels);
}

export function canUseQueueModule(permissions: string[] | undefined): boolean {
  return canViewQueueScreen(permissions);
}

export function canViewRiderScreen(permissions: string[] | undefined): boolean {
  return (
    hasPermission(permissions, MobilePermissionKeys.CanReadRiderCurrentParcels) ||
    hasPermission(permissions, MobilePermissionKeys.CanReadRiderHistory) ||
    hasPermission(permissions, MobilePermissionKeys.CanCompleteDoorstepDelivery)
  );
}

export function canCompleteRiderDeliveryActions(permissions: string[] | undefined): boolean {
  return hasPermission(permissions, MobilePermissionKeys.CanCompleteDoorstepDelivery);
}

export function canUseRiderModule(permissions: string[] | undefined): boolean {
  return canViewRiderScreen(permissions);
}

export function canViewReceiveScreen(permissions: string[] | undefined): boolean {
  return (
    hasPermission(permissions, MobilePermissionKeys.CanReadParcelScan) ||
    hasPermission(permissions, MobilePermissionKeys.CanReadParcelIncoming)
  );
}

export function canMarkParcelArrived(permissions: string[] | undefined): boolean {
  return hasPermission(permissions, MobilePermissionKeys.CanUpdateParcels);
}

export function canUseTransitReceiveScan(permissions: string[] | undefined): boolean {
  return (
    hasPermission(permissions, MobilePermissionKeys.CanReadParcelScan) ||
    hasPermission(permissions, MobilePermissionKeys.CanReadParcelIncoming)
  );
}
