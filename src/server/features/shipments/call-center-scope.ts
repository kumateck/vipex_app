import { Forbidden } from '@/server/utils/http-error';

export type CallCenterScope = {
  companyId?: string | null;
  branchId?: string | null;
  locationId?: string | null;
};

export function callCenterParcelFilters(scope: CallCenterScope) {
  if (!scope.companyId || !scope.branchId)
    throw Forbidden('Company and branch context are required');
  return {
    companyId: scope.companyId,
    destinationId: scope.branchId,
    locationId: scope.locationId || null,
  };
}

export function isParcelInCallCenterScope(
  parcel: { companyId: string; destinationId: string; pickupLocationId?: string | null },
  scope: CallCenterScope,
) {
  return Boolean(
    scope.companyId &&
      scope.branchId &&
      parcel.companyId === scope.companyId &&
      parcel.destinationId === scope.branchId &&
      (!scope.locationId || parcel.pickupLocationId === scope.locationId),
  );
}
