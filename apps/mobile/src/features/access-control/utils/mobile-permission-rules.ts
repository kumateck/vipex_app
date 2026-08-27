import type { MobilePermissions } from '../types/mobile-access.types';

export const MobilePermissionKeys = {
  CanReadDashboard: 'CanReadDashboard',
  CanChangePassword: 'CanChangePassword',
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
  CanReadSelfServiceBookings: 'CanReadSelfServiceBookings',
  CanCompleteSelfServiceBookings: 'CanCompleteSelfServiceBookings',
  CanReadCallCenterParcelStatus: 'CanReadCallCenterParcelStatus',
  CanMarkDoorstepCalled: 'CanMarkDoorstepCalled',
  CanReadCustomers: 'CanReadCustomers',
  CanUpdateCustomers: 'CanUpdateCustomers',
} as const;

export type MobilePermissionKey = (typeof MobilePermissionKeys)[keyof typeof MobilePermissionKeys];

export function hasPermission(permissions: MobilePermissions, key: MobilePermissionKey): boolean {
  return Boolean(permissions?.includes(key));
}

function hasAnyPermission(permissions: MobilePermissions, keys: readonly MobilePermissionKey[]) {
  return keys.some((key) => hasPermission(permissions, key));
}

export const canViewDashboard = (permissions: MobilePermissions) =>
  hasPermission(permissions, MobilePermissionKeys.CanReadDashboard);

export const canChangeOwnPassword = (permissions: MobilePermissions) =>
  hasPermission(permissions, MobilePermissionKeys.CanChangePassword);

export const canViewParcelSearch = (permissions: MobilePermissions) =>
  hasPermission(permissions, MobilePermissionKeys.CanReadParcels);

export function canViewQueueScreen(permissions: MobilePermissions): boolean {
  return hasAnyPermission(permissions, [
    MobilePermissionKeys.CanCreatePickupQueue,
    MobilePermissionKeys.CanReadSenderPickupQueue,
    MobilePermissionKeys.CanReadReceiverPickupQueue,
  ]);
}

export const canCreateQueueTicket = (permissions: MobilePermissions) =>
  hasPermission(permissions, MobilePermissionKeys.CanCreatePickupQueue);

export const canViewReceiverQueueBoard = (permissions: MobilePermissions) =>
  hasPermission(permissions, MobilePermissionKeys.CanReadReceiverPickupQueue);

export const canViewSenderQueueBoard = (permissions: MobilePermissions) =>
  hasPermission(permissions, MobilePermissionKeys.CanReadSenderPickupQueue);

export const canSearchParcelsForQueue = canViewParcelSearch;
export const canUseQueueModule = canViewQueueScreen;

export const canViewRiderCurrent = (permissions: MobilePermissions) =>
  hasPermission(permissions, MobilePermissionKeys.CanReadRiderCurrentParcels);

export const canViewRiderHistory = (permissions: MobilePermissions) =>
  hasPermission(permissions, MobilePermissionKeys.CanReadRiderHistory);

export function canViewRiderScreen(permissions: MobilePermissions): boolean {
  return hasAnyPermission(permissions, [
    MobilePermissionKeys.CanReadRiderCurrentParcels,
    MobilePermissionKeys.CanReadRiderHistory,
  ]);
}

export const canCompleteRiderDeliveryActions = (permissions: MobilePermissions) =>
  hasPermission(permissions, MobilePermissionKeys.CanCompleteDoorstepDelivery);

export const canUseRiderModule = canViewRiderScreen;

export function canViewReceiveScreen(permissions: MobilePermissions): boolean {
  return hasAnyPermission(permissions, [
    MobilePermissionKeys.CanReadParcelScan,
    MobilePermissionKeys.CanReadParcelIncoming,
  ]);
}

export const canViewIncomingConsignments = (permissions: MobilePermissions) =>
  hasPermission(permissions, MobilePermissionKeys.CanReadParcelIncoming);

export const canUseTransitReceiveScan = (permissions: MobilePermissions) =>
  hasPermission(permissions, MobilePermissionKeys.CanReadParcelScan);

export const canMarkParcelArrived = (permissions: MobilePermissions) =>
  hasPermission(permissions, MobilePermissionKeys.CanUpdateParcels);

export const canCreateParcelBooking = (permissions: MobilePermissions) =>
  hasPermission(permissions, MobilePermissionKeys.CanCreateBookingWithParcels);

export const canViewCashierSessions = (permissions: MobilePermissions) =>
  hasPermission(permissions, MobilePermissionKeys.CanReadCashierSessions);

export const canReadCashierSessionTypes = (permissions: MobilePermissions) =>
  hasPermission(permissions, MobilePermissionKeys.CanReadCashierSessionTypes);

export const canOpenCashierSessions = (permissions: MobilePermissions) =>
  hasPermission(permissions, MobilePermissionKeys.CanOpenCashierSessions);

export const canCloseCashierSessions = (permissions: MobilePermissions) =>
  hasPermission(permissions, MobilePermissionKeys.CanCloseCashierSessions);

export const canViewCashierSalesReport = (permissions: MobilePermissions) =>
  hasPermission(permissions, MobilePermissionKeys.CanViewReportCashierShifts);

export const canViewSelfServiceBookings = (permissions: MobilePermissions) =>
  hasPermission(permissions, MobilePermissionKeys.CanReadSelfServiceBookings);

export const canCompleteSelfServiceBookings = (permissions: MobilePermissions) =>
  hasPermission(permissions, MobilePermissionKeys.CanCompleteSelfServiceBookings);

export const canRecordCallCenterContact = (permissions: MobilePermissions) =>
  hasPermission(permissions, MobilePermissionKeys.CanReadCallCenterParcelStatus);

export const canCollectDoorstepAddress = (permissions: MobilePermissions) =>
  hasPermission(permissions, MobilePermissionKeys.CanMarkDoorstepCalled);

export const canViewCallCenterFollowUp = (permissions: MobilePermissions) =>
  canRecordCallCenterContact(permissions) || canCollectDoorstepAddress(permissions);

export const canReviewDeliveryChanges = canCollectDoorstepAddress;

export const canViewCustomers = (permissions: MobilePermissions) =>
  hasPermission(permissions, MobilePermissionKeys.CanReadCustomers);

export const canUpdateCustomers = (permissions: MobilePermissions) =>
  hasPermission(permissions, MobilePermissionKeys.CanUpdateCustomers);

export function canViewOperationsHub(permissions: MobilePermissions): boolean {
  return (
    canCreateParcelBooking(permissions) ||
    canViewParcelSearch(permissions) ||
    canViewQueueScreen(permissions) ||
    canViewReceiveScreen(permissions) ||
    canViewSelfServiceBookings(permissions) ||
    canViewCallCenterFollowUp(permissions) ||
    canReviewDeliveryChanges(permissions) ||
    canViewCustomers(permissions)
  );
}
