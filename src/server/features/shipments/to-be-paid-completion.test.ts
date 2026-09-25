import { describe, expect, test } from 'bun:test';
import { PaymentResponsibility } from '@/db/schemas/enums';
import { assertToBePaidCompletion } from './to-be-paid-completion';

describe('immediate to-be-paid completion', () => {
  const valid = {
    paymentResponsibility: PaymentResponsibility.RECIPIENT,
    chargeCedis: 40,
    plannedToBePaidCedis: 40,
    senderPaymentCedis: 0,
  };

  test('accepts a fully receiver-paid parcel', () => {
    expect(() => assertToBePaidCompletion([valid])).not.toThrow();
  });

  test.each([
    { parcels: [{ ...valid, paymentResponsibility: PaymentResponsibility.SENDER }] },
    { parcels: [{ ...valid, senderPaymentCedis: 10 }] },
    { parcels: [{ ...valid, plannedToBePaidCedis: 20 }] },
    { parcels: [{ ...valid, chargeCedis: 0 }] },
    { parcels: [] },
  ])('rejects payment mixes outside the delegate path', ({ parcels }) => {
    expect(() => assertToBePaidCompletion(parcels)).toThrow();
  });
});
