import { describe, expect, test } from 'bun:test';
import { HttpStatus } from '@/server/utils/http-status';
import { http } from '../utils/request';

describe('Procurement demands route smoke', () => {
  test('procurement demand routes are mounted', async () => {
    const fleetPolicyListRes = await http('GET', '/v1/procurement/fleet-policies');
    const fleetPolicyCreateRes = await http('POST', '/v1/procurement/fleet-policies', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ replenishMultiplier: 1 }),
    });
    const listRes = await http('GET', '/v1/procurement/demands');
    const createRes = await http('POST', '/v1/procurement/demands', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sourceModule: 'general',
        itemCode: 'ITM-001',
        itemName: 'Generic Item',
        quantity: 1,
      }),
    });
    const fleetLowStockRes = await http('POST', '/v1/procurement/demands/from-fleet-low-stock', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    const convertRes = await http('POST', '/v1/procurement/demands/convert-to-purchase-requests', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        demandIds: ['00000000-0000-4000-8000-000000000000'],
      }),
    });

    for (const status of [
      fleetPolicyListRes.status,
      fleetPolicyCreateRes.status,
      listRes.status,
      createRes.status,
      fleetLowStockRes.status,
      convertRes.status,
    ]) {
      expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.BAD_REQUEST]).toContain(
        status,
      );
    }
  });
});
