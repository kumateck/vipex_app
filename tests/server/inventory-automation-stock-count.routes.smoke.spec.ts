import { describe, expect, test } from 'bun:test';
import { HttpStatus } from '@/server/utils/http-status';
import { http } from '../utils/request';

describe('Inventory automation + stock count routes smoke', () => {
  test('monitoring, automation, and stock count routes are mounted', async () => {
    const companyId = '00000000-0000-4000-8000-000000000000';
    const actorUserId = '00000000-0000-4000-8000-000000000001';
    const locationId = '00000000-0000-4000-8000-000000000002';
    const sessionId = '00000000-0000-4000-8000-000000000003';
    const lineId = '00000000-0000-4000-8000-000000000004';

    const monitoringRes = await http(
      'GET',
      `/v1/inventory/monitoring/summary?companyId=${companyId}&daysAhead=30&issueLookbackDays=90`,
    );
    const runDailyRes = await http('POST', '/v1/inventory/automation/run-daily', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ companyId, actorUserId, daysAhead: 30, sendEmailAlerts: false }),
    });
    const listSessionsRes = await http(
      'GET',
      `/v1/inventory/stock-count-sessions?companyId=${companyId}`,
    );
    const createSessionRes = await http('POST', '/v1/inventory/stock-count-sessions', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ companyId, locationId, createdBy: actorUserId }),
    });
    const getSessionRes = await http('GET', `/v1/inventory/stock-count-sessions/${sessionId}`);
    const updateLineRes = await http(
      'PATCH',
      `/v1/inventory/stock-count-sessions/${sessionId}/lines/${lineId}`,
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          countedQuantity: '5',
          varianceReason: 'Test variance',
          countedBy: actorUserId,
        }),
      },
    );
    const submitSessionRes = await http(
      'POST',
      `/v1/inventory/stock-count-sessions/${sessionId}/submit`,
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ submittedBy: actorUserId }),
      },
    );
    const approveSessionRes = await http(
      'POST',
      `/v1/inventory/stock-count-sessions/${sessionId}/approve`,
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ approvedBy: actorUserId, applyAdjustments: true }),
      },
    );

    for (const status of [
      monitoringRes.status,
      runDailyRes.status,
      listSessionsRes.status,
      createSessionRes.status,
      getSessionRes.status,
      updateLineRes.status,
      submitSessionRes.status,
      approveSessionRes.status,
    ]) {
      expect([
        HttpStatus.UNAUTHORIZED,
        HttpStatus.FORBIDDEN,
        HttpStatus.BAD_REQUEST,
        HttpStatus.NOT_FOUND,
        HttpStatus.CONFLICT,
      ]).toContain(status);
    }
  });
});
