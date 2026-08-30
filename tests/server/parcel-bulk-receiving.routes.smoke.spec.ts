import { describe, expect, test } from 'bun:test';
import { HttpStatus } from '@/server/utils/http-status';
import { http } from '../utils/request';

describe('Bulk incoming parcel arrival route', () => {
  test('bulk mark-received route is mounted and protected', async () => {
    const response = await http('POST', '/v1/shipments/parcels/bulk-mark-received', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ parcelIds: ['parcel_placeholder'] }),
    });

    expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN]).toContain(response.status);
  });
});
