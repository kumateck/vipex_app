import { describe, expect, test } from 'bun:test';
import { PermissionKeys } from '@/shared/permissions/constants';
import { inferRequiredPermissionByPath } from '@/shared/permissions/path-access';

describe('Fleet analytics page permission mapping', () => {
  test('maps compliance KPI page to its granular permission', () => {
    expect(inferRequiredPermissionByPath('/fleet-transport/compliance/kpis')).toBe(
      PermissionKeys.CanReadFleetComplianceKpis,
    );
  });

  test('maps fuel fraud signals page to its granular permission', () => {
    expect(inferRequiredPermissionByPath('/fleet-transport/fuel-analytics/fraud-signals')).toBe(
      PermissionKeys.CanReadFleetFuelFraudSignals,
    );
  });

  test('maps unit economics page to its granular permission', () => {
    expect(inferRequiredPermissionByPath('/fleet-transport/decision-support/unit-economics')).toBe(
      PermissionKeys.CanReadFleetUnitEconomics,
    );
  });
});
