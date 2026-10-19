import { describe, expect, test } from 'bun:test';
import { assertDispatchCanBeRetried } from './notification-dispatch-retry';

describe('OTP dispatch log retries', () => {
  test('requires a fresh OTP instead of retrying a logged code', () => {
    expect(() =>
      assertDispatchCanBeRetried({ eventCode: 'receiver_pickup_otp', parcelId: 'parcel' }),
    ).toThrow('Request a fresh pickup OTP');
  });
  test('ordinary SMS/email/bulk dispatches retain retry support', () => {
    for (const metadata of [
      null,
      {},
      { eventCode: 'pickup_queue_ticket' },
      { audienceType: 'customers_all' },
    ]) {
      expect(() => assertDispatchCanBeRetried(metadata)).not.toThrow();
    }
  });
});
