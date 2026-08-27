import { describe, expect, test } from 'bun:test';
import { HttpStatus } from '@/server/utils/http-status';
import { http } from '../utils/request';

describe('Parcel discrepancy evidence route smoke', () => {
  test('evidence upload route is mounted and protected', async () => {
    const response = await http(
      'POST',
      '/v1/shipments/parcels/discrepancies/discrepancy_placeholder/evidence',
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fileName: 'evidence.jpg',
          dataUrl: 'data:image/jpeg;base64,ZmFrZS1pbWFnZQ==',
        }),
      },
    );

    expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN]).toContain(response.status);
  });
});
