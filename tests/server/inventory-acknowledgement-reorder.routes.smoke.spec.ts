import { describe, expect, test } from 'bun:test';
import { HttpStatus } from '@/server/utils/http-status';
import { http } from '../utils/request';

describe('Inventory acknowledgement + reorder routes smoke', () => {
  test('request/transfer acknowledgement and reorder routes are mounted', async () => {
    const companyId = '00000000-0000-4000-8000-000000000000';
    const actorUserId = '00000000-0000-4000-8000-000000000001';
    const transferId = '00000000-0000-4000-8000-000000000010';
    const requestId = '00000000-0000-4000-8000-000000000011';
    const lineId = '00000000-0000-4000-8000-000000000012';

    const reorderRes = await http(
      'GET',
      `/v1/inventory/reorder-suggestions?companyId=${companyId}`,
    );
    const transferAckRes = await http(
      'POST',
      `/v1/inventory/stock-transfers/${transferId}/acknowledge-receipt`,
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          acceptedQuantity: '5',
          damagedQuantity: '1',
          missingQuantity: '0',
          notes: 'Smoke receipt',
          acknowledgedBy: actorUserId,
        }),
      },
    );
    const requestAckRes = await http(
      'POST',
      `/v1/inventory/stock-requests/${requestId}/lines/${lineId}/acknowledge`,
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          acknowledgedQuantity: '3',
          acknowledgedBy: actorUserId,
          notes: 'Smoke acknowledgement',
        }),
      },
    );

    for (const status of [reorderRes.status, transferAckRes.status, requestAckRes.status]) {
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
