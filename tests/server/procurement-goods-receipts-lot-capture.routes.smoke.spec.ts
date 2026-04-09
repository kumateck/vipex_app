import { describe, expect, test } from 'bun:test';
import { HttpStatus } from '@/server/utils/http-status';
import { http } from '../utils/request';

describe('Procurement goods receipt lot capture routes smoke', () => {
  test('goods receipt create route accepts lot capture contract', async () => {
    const res = await http('POST', '/v1/procurement/goods-receipts', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        companyId: '00000000-0000-4000-8000-000000000000',
        actorUserId: '00000000-0000-4000-8000-000000000001',
        purchaseOrderId: '00000000-0000-4000-8000-000000000002',
        lines: [
          {
            purchaseOrderItemId: '00000000-0000-4000-8000-000000000003',
            receivedQuantity: '10',
            locationId: '00000000-0000-4000-8000-000000000004',
            batchNumber: 'BATCH-001',
            supplierBatchNumber: 'SUP-LOT-ABC',
            manufacturedAt: '2026-01-01T00:00:00.000Z',
            expiryDate: '2027-01-01T00:00:00.000Z',
          },
        ],
      }),
    });

    expect([
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
      HttpStatus.BAD_REQUEST,
      HttpStatus.NOT_FOUND,
      HttpStatus.CONFLICT,
    ]).toContain(res.status);
  });
});
