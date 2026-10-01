import { describe, expect, test } from 'bun:test';
import { SENDER_PAYMENTS_REFRESH_INTERVAL_MS } from '@/features/operations/parcel/components/parcel-sender-payments/constants';

describe('sender payments refresh', () => {
  test('refreshes every 15 minutes', () => {
    expect(SENDER_PAYMENTS_REFRESH_INTERVAL_MS).toBe(15 * 60 * 1000);
  });
});
