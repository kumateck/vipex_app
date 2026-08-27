import { describe, expect, it } from 'bun:test';
import {
  MobilePermissionKeys,
  canCollectDoorstepAddress,
  canCompleteSelfServiceBookings,
  canRecordCallCenterContact,
  canUseTransitReceiveScan,
  canUpdateCustomers,
  canViewCashierSalesReport,
  canViewCallCenterFollowUp,
  canViewCustomers,
  canViewIncomingConsignments,
  canViewQueueScreen,
  canViewRiderCurrent,
  canViewRiderHistory,
  canViewSelfServiceBookings,
} from './mobile-permission-rules';
import { PermissionKeys as DesktopPermissionKeys } from '../../../../../../src/shared/permissions/constants';

describe('mobile permission parity', () => {
  it('uses permission keys from the desktop permission catalog', () => {
    for (const key of Object.values(MobilePermissionKeys)) {
      expect(DesktopPermissionKeys[key]).toBe(key);
    }
  });

  it('does not treat parcel read access as queue access', () => {
    expect(canViewQueueScreen(['CanReadParcels'])).toBeFalse();
    expect(canViewQueueScreen(['CanCreatePickupQueue'])).toBeTrue();
  });

  it('separates scan access from incoming consignment access', () => {
    expect(canUseTransitReceiveScan(['CanReadParcelIncoming'])).toBeFalse();
    expect(canViewIncomingConsignments(['CanReadParcelScan'])).toBeFalse();
    expect(canUseTransitReceiveScan(['CanReadParcelScan'])).toBeTrue();
    expect(canViewIncomingConsignments(['CanReadParcelIncoming'])).toBeTrue();
  });

  it('separates current rider work from rider history', () => {
    expect(canViewRiderCurrent(['CanReadRiderHistory'])).toBeFalse();
    expect(canViewRiderHistory(['CanReadRiderCurrentParcels'])).toBeFalse();
    expect(canViewRiderCurrent(['CanReadRiderCurrentParcels'])).toBeTrue();
    expect(canViewRiderHistory(['CanReadRiderHistory'])).toBeTrue();
  });

  it('requires the exact desktop cashier shift report permission', () => {
    expect(canViewCashierSalesReport(['CanReadAccounting'])).toBeFalse();
    expect(canViewCashierSalesReport(['CanViewReportCashierShifts'])).toBeTrue();
  });

  it('keeps read and mutation permissions separate for new mobile workflows', () => {
    expect(canViewSelfServiceBookings(['CanReadSelfServiceBookings'])).toBe(true);
    expect(canCompleteSelfServiceBookings(['CanReadSelfServiceBookings'])).toBe(false);
    expect(canViewCallCenterFollowUp(['CanReadCallCenterParcelStatus'])).toBe(true);
    expect(canCollectDoorstepAddress(['CanReadCallCenterParcelStatus'])).toBe(false);
    expect(canViewCallCenterFollowUp(['CanMarkDoorstepCalled'])).toBe(true);
    expect(canRecordCallCenterContact(['CanMarkDoorstepCalled'])).toBe(false);
    expect(canViewCustomers(['CanReadCustomers'])).toBe(true);
    expect(canUpdateCustomers(['CanReadCustomers'])).toBe(false);
  });
});
