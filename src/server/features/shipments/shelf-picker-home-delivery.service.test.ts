import { describe, expect, test } from 'bun:test';
import { ParcelStatus } from '@/db/schemas';
import { assertShelfPickerHomeDeliveryCandidate } from './shelf-picker-home-delivery.service';

describe('shelf picker home delivery eligibility', () => {
  test('accepts awaiting pickup', () => {
    expect(() =>
      assertShelfPickerHomeDeliveryCandidate({ status: ParcelStatus.AWAITING_PICKUP }),
    ).not.toThrow();
  });

  test('rejects missing and stale parcels', () => {
    expect(() => assertShelfPickerHomeDeliveryCandidate(null)).toThrow('not found');
    expect(() =>
      assertShelfPickerHomeDeliveryCandidate({ status: ParcelStatus.HOME_DELIVERY_REQUESTED }),
    ).toThrow('awaiting pickup');
  });
});
