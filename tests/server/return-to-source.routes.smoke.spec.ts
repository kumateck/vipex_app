import { describe, expect, test } from 'bun:test';
import { HttpStatus } from '@/server/utils/http-status';
import { http } from '../utils/request';

describe('return to source route', () => {
  test('return list requires authentication', async () => {
    const response = await http('GET', '/v1/shipments/parcels/return-to-source');
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  test('requires authentication', async () => {
    const response = await http(
      'POST',
      '/v1/shipments/parcels/parcel-placeholder/return-to-source',
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reason: 'Return requested by destination branch' }),
      },
    );
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });
});
