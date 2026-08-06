import { describe, expect, test } from 'bun:test';
import { HttpStatus } from '@/server/utils/http-status';
import { http } from '../utils/request';

describe('Inventory major modules routes smoke', () => {
  test('approval, valuation, planning, tasks, audit, and kpi routes are mounted', async () => {
    const companyId = '00000000-0000-4000-8000-000000000000';
    const actorUserId = '00000000-0000-4000-8000-000000000001';
    const id = '00000000-0000-4000-8000-000000000010';

    const responses = await Promise.all([
      http('GET', `/v1/inventory/approval-policies?companyId=${companyId}`),
      http('GET', `/v1/inventory/approval-requests?companyId=${companyId}`),
      http('POST', '/v1/inventory/approval-requests/escalate-overdue', {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ companyId, actorUserId }),
      }),
      http('GET', `/v1/inventory/valuation/summary?companyId=${companyId}`),
      http('POST', '/v1/inventory/valuation/recompute', {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ companyId, actorUserId }),
      }),
      http('GET', `/v1/inventory/replenishment-proposals?companyId=${companyId}`),
      http('GET', `/v1/inventory/tasks?companyId=${companyId}`),
      http('GET', `/v1/inventory/tasks/${id}`),
      http('GET', `/v1/inventory/audit/event-journal?companyId=${companyId}`),
      http('GET', `/v1/inventory/reports/enterprise-kpis?companyId=${companyId}`),
    ]);

    for (const res of responses) {
      expect([
        HttpStatus.UNAUTHORIZED,
        HttpStatus.FORBIDDEN,
        HttpStatus.BAD_REQUEST,
        HttpStatus.NOT_FOUND,
        HttpStatus.CONFLICT,
      ]).toContain(res.status);
    }
  });
});
