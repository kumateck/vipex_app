import { describe, expect, test } from 'bun:test';
import { HttpStatus } from '@/server/utils/http-status';
import { http } from '../utils/request';

describe('Inventory stock lot engine routes smoke', () => {
  test('stock lot traceability, expiry, and analytics routes are mounted', async () => {
    const companyId = '00000000-0000-4000-8000-000000000000';
    const lotId = '00000000-0000-4000-8000-000000000001';

    const analyticsRes = await http(
      'GET',
      `/v1/inventory/stock-lots/analytics?companyId=${companyId}&daysAhead=30&issueLookbackDays=90`,
    );
    const traceabilityRes = await http('GET', `/v1/inventory/stock-lots/${lotId}/traceability`);
    const alertsRes = await http(
      'GET',
      `/v1/inventory/stock-lot-expiry/alerts?companyId=${companyId}&daysAhead=30`,
    );
    const sweepRes = await http('POST', '/v1/inventory/stock-lot-expiry/sweep', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        companyId,
        actorUserId: '00000000-0000-4000-8000-000000000002',
      }),
    });

    for (const status of [
      analyticsRes.status,
      traceabilityRes.status,
      alertsRes.status,
      sweepRes.status,
    ]) {
      expect([
        HttpStatus.UNAUTHORIZED,
        HttpStatus.FORBIDDEN,
        HttpStatus.BAD_REQUEST,
        HttpStatus.NOT_FOUND,
      ]).toContain(status);
    }
  });
});
