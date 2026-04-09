import { describe, expect, test } from 'bun:test';
import { inferRequiredPermissionByPath } from '@/shared/permissions/path-access';

describe('Fleet analytics page permission mapping', () => {
  test('maps compliance KPI page to fleet read permission', () => {
    expect(inferRequiredPermissionByPath('/fleet-transport/compliance/kpis')).toBe(
      'CanReadFleetTransport',
    );
  });

  test('maps fuel fraud signals page to fleet read permission', () => {
    expect(inferRequiredPermissionByPath('/fleet-transport/fuel-analytics/fraud-signals')).toBe(
      'CanReadFleetTransport',
    );
  });

  test('maps unit economics page to fleet read permission', () => {
    expect(inferRequiredPermissionByPath('/fleet-transport/decision-support/unit-economics')).toBe(
      'CanReadFleetTransport',
    );
  });
});
