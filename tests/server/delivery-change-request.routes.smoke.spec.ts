import { describe, expect, test } from 'bun:test';
import { HttpStatus } from '@/server/utils/http-status';
import { http } from '../utils/request';

const JSON_HEADERS = { 'content-type': 'application/json' };

describe('Delivery address and fee change routes', () => {
  test('rider request and staff review routes are mounted and protected', async () => {
    const parcelId = 'parcel_test_1';
    const deliveryId = 'delivery_test_1';
    const responses = await Promise.all([
      http('GET', '/v1/deliveries/dd/change-requests/mine'),
      http('GET', '/v1/deliveries/dd/change-requests/pending'),
      http('POST', `/v1/deliveries/dd/${parcelId}/change-request`, {
        headers: JSON_HEADERS,
        body: JSON.stringify({
          requestedDropoffAddress: 'New customer location',
          requestedDeliveryFeeCedis: '25.00',
          reason: 'Customer moved to another location',
        }),
      }),
      http('POST', `/v1/deliveries/dd/change-requests/${deliveryId}/decision`, {
        headers: JSON_HEADERS,
        body: JSON.stringify({ decision: 'APPROVED' }),
      }),
    ]);

    for (const response of responses) {
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    }
  });
});
