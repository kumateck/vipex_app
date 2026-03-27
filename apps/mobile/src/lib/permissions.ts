export function hasPermission(permissions: string[] | undefined, key: string): boolean {
  return Boolean(permissions?.includes(key));
}

export function canUseQueueModule(permissions: string[] | undefined): boolean {
  return (
    hasPermission(permissions, 'CanReadParcels') && hasPermission(permissions, 'CanUpdateParcels')
  );
}

export function canUseRiderModule(permissions: string[] | undefined): boolean {
  return (
    hasPermission(permissions, 'CanCompleteDoorstepDelivery') ||
    hasPermission(permissions, 'CanMarkOutForDelivery') ||
    hasPermission(permissions, 'CanAssignDoorstepRider')
  );
}

export function canUseTransitReceiveScan(permissions: string[] | undefined): boolean {
  return (
    hasPermission(permissions, 'CanUpdateParcels') && hasPermission(permissions, 'CanReadParcels')
  );
}
