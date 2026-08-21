import { describe, expect, it } from 'bun:test';
import {
  getParcelChargeValidationError,
  MAX_STANDARD_PARCEL_CHARGE_CEDIS,
} from '@/shared/shipments/parcel-charge-policy';

describe('parcel charge policy', () => {
  it('rejects a telephone number entered as a parcel charge', () => {
    expect(
      getParcelChargeValidationError({
        chargeCedis: 548_538_476,
        plannedToBePaidCedis: 0,
      }),
    ).toContain('telephone number');
  });

  it('rejects receiver to-be-paid greater than the total charge', () => {
    expect(
      getParcelChargeValidationError({
        chargeCedis: 50,
        plannedToBePaidCedis: 60,
      }),
    ).toContain('cannot exceed');
  });

  it('accepts an amount at the configured charge limit', () => {
    expect(
      getParcelChargeValidationError({
        chargeCedis: MAX_STANDARD_PARCEL_CHARGE_CEDIS,
        plannedToBePaidCedis: 25,
      }),
    ).toBeNull();
  });
});
