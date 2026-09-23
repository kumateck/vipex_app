import { describe, expect, test } from 'bun:test';
import { ParcelStatus } from '@/db/schemas/enums';
import { isHomeDeliveryReceiptStatus } from './home-delivery-receipt-eligibility';

describe('home delivery receipt eligibility', () => {
  test('supports dispatch and current rider parcels', () => {
    expect(isHomeDeliveryReceiptStatus(ParcelStatus.ADDRESS_COLLECTED)).toBe(true);
    expect(isHomeDeliveryReceiptStatus(ParcelStatus.RETURNED_TO_OFFICE)).toBe(true);
    expect(isHomeDeliveryReceiptStatus(ParcelStatus.DISPATCHED)).toBe(true);
  });

  test('supports completed rider history without opening unrelated parcels', () => {
    expect(isHomeDeliveryReceiptStatus(ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER)).toBe(true);
    expect(isHomeDeliveryReceiptStatus(ParcelStatus.DELIVERED_AT_HOME)).toBe(true);
    expect(isHomeDeliveryReceiptStatus(ParcelStatus.CREATED)).toBe(false);
  });
});
