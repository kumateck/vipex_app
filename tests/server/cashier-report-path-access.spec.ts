import { describe, expect, test } from 'bun:test';
import { normalizePermissionKeys, PermissionKeys } from '@/shared/permissions/constants';
import {
  hasRequiredPermissionForPath,
  inferRequiredPermissionByPath,
} from '@/shared/permissions/path-access';

describe('Cashier report page permission mapping', () => {
  test('maps shift sessions report to cashier performance permission', () => {
    expect(inferRequiredPermissionByPath('/reports/cashier/shifts')).toBe(
      PermissionKeys.CanViewReportCashierShifts,
    );
  });

  test('maps shift revenue report to shift revenue permission', () => {
    expect(inferRequiredPermissionByPath('/reports/cashier/revenue')).toBe(
      PermissionKeys.CanViewReportCashierRevenue,
    );
  });

  test('allows the reports hub when a role has any current report permission', () => {
    expect(
      hasRequiredPermissionForPath('/reports', [PermissionKeys.CanViewReportCashierRevenue]),
    ).toBe(true);
  });

  test('blocks the reports hub when a role has no report permissions', () => {
    expect(hasRequiredPermissionForPath('/reports', [PermissionKeys.CanReadCustomers])).toBe(false);
  });

  test('normalizes legacy report permissions to current report permissions', () => {
    expect(normalizePermissionKeys(['CanGetShiftRevenueReport'])).toEqual([
      PermissionKeys.CanViewReportCashierRevenue,
    ]);
    expect(normalizePermissionKeys(['CanGetParcelStatusSummaryReport'])).toEqual([
      PermissionKeys.CanViewReportParcelsStatusSummary,
      PermissionKeys.CanViewReportParcelsDeliveryPerformance,
    ]);
  });
});
