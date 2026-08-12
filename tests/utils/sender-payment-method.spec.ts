import { describe, expect, test } from 'bun:test';
import { PaymentMethod } from '@/db/schemas/enums';
import { resolveMomoTransactionId } from '@/features/operations/parcel/components/parcel-sender-payments/sender-payment-method';

describe('Sender payment method resolution', () => {
  test('records a manually confirmed transfer as MTN without a gateway transaction', () => {
    const mtnMethod = String(PaymentMethod.MTN);

    expect(Number(mtnMethod)).toBe(PaymentMethod.MTN);
    expect(resolveMomoTransactionId(mtnMethod, 'manual', 'gateway-id')).toBeNull();
  });

  test('keeps the confirmed transaction for MTN Request-to-Pay', () => {
    const requestToPayValue = String(PaymentMethod.MTN);

    expect(resolveMomoTransactionId(requestToPayValue, 'automated', 'gateway-id')).toBe(
      'gateway-id',
    );
  });

  test('does not attach an MTN transaction to other payment methods', () => {
    expect(
      resolveMomoTransactionId(String(PaymentMethod.CASH), 'automated', 'gateway-id'),
    ).toBeNull();
  });
});
