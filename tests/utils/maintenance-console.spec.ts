import { describe, expect, test } from 'bun:test';
import { withMaintenanceNavigation } from '@/components/sidebar/maintenance-navigation';
import { isSystemAdminRoleName } from '@/shared/maintenance';
import { validateMaintenanceParams } from '@/server/features/maintenance/validation';
import {
  assertMaintenancePreview,
  maintenanceFingerprint,
} from '@/server/features/maintenance/preview';
import type {
  MaintenanceRunRequest,
  MaintenanceRun,
  MaintenanceParams,
} from '@/shared/maintenance';

describe('maintenance role visibility and preview validation', () => {
  test('only the exact normalized System Admin role sees navigation', () => {
    for (const name of [undefined, null, 'Admin', 'Accounts', 'System Administrator', '']) {
      expect(isSystemAdminRoleName(name)).toBe(false);
      expect(withMaintenanceNavigation([], name)).toEqual([]);
    }
    expect(withMaintenanceNavigation([], ' System Admin ')[0]?.menu[0]?.url).toBe(
      '/settings/maintenance',
    );
    expect(
      withMaintenanceNavigation(withMaintenanceNavigation([], 'System Admin'), 'System Admin')[0]
        ?.menu,
    ).toHaveLength(1);
  });
  test('validated parameters cannot supply commands, paths or company IDs', () => {
    expect(
      validateMaintenanceParams('repair-credit-print-payment', { bookingCode: ' AO4858124I ' })
        .params,
    ).toEqual({ bookingCode: 'AO4858124I' });
    const invalidParams: MaintenanceParams[] = [
      { command: 'ls' },
      { bookingCode: '../secrets' },
      { companyId: 'other' },
    ];
    for (const params of invalidParams) {
      expect(() => validateMaintenanceParams('repair-credit-print-payment', params)).toThrow();
    }
  });
  test('preview proof must match actor-bound request, parameters, time and readiness', () => {
    const request: MaintenanceRunRequest = {
      operationId: 'repair-credit-print-payment',
      mode: 'execute',
      params: { bookingCode: 'BOOK1' },
    };
    const run: MaintenanceRun = {
      id: 'preview',
      operationId: request.operationId,
      params: request.params,
      mode: 'preview',
      status: 'succeeded',
      createdAt: '2026-10-26T12:00:00Z',
      result: { summary: 'Ready', details: { paymentId: 'p1' }, readyToApply: true },
    };
    const metadata = { run, fingerprint: maintenanceFingerprint(run.result!) };
    expect(
      assertMaintenancePreview(
        metadata,
        request,
        request.params,
        Date.parse('2026-10-26T12:01:00Z'),
      ),
    ).toEqual(metadata);
    expect(() =>
      assertMaintenancePreview(
        metadata,
        request,
        { bookingCode: 'BOOK2' },
        Date.parse('2026-10-26T12:01:00Z'),
      ),
    ).toThrow();
    expect(() =>
      assertMaintenancePreview(
        metadata,
        request,
        request.params,
        Date.parse('2026-10-26T12:11:00Z'),
      ),
    ).toThrow();
    expect(() =>
      assertMaintenancePreview(
        { ...metadata, consumedByRunId: 'executed' },
        request,
        request.params,
        Date.parse('2026-10-26T12:01:00Z'),
      ),
    ).toThrow();
  });
});
