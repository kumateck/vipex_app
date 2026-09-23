import { describe, expect, test } from 'bun:test';
import { buildHomeDeliveryReceiptAmounts } from './home-delivery-receipt-amounts';

describe('home delivery receipt amounts', () => {
  test('a paid parcel owes only its delivery fee', () => {
    const result = buildHomeDeliveryReceiptAmounts({
      chargePsw: 4_000,
      deliveryFeePsw: 1_500,
      paidPrincipalPsw: 4_000,
      paidDeliveryFeePsw: 0,
    });
    expect(result.principalDuePsw).toBe(0);
    expect(result.totalDuePsw).toBe(1_500);
    expect(result.grossPsw).toBe(5_500);
  });

  test('an unpaid parcel owes its charge and delivery fee', () => {
    const result = buildHomeDeliveryReceiptAmounts({
      chargePsw: 4_000,
      deliveryFeePsw: 1_500,
      paidPrincipalPsw: 0,
      paidDeliveryFeePsw: 0,
    });
    expect(result.principalDuePsw).toBe(4_000);
    expect(result.totalDuePsw).toBe(5_500);
  });

  test('partial prior payments reduce only the amount to collect', () => {
    const result = buildHomeDeliveryReceiptAmounts({
      chargePsw: 4_000,
      deliveryFeePsw: 1_500,
      paidPrincipalPsw: 2_000,
      paidDeliveryFeePsw: 500,
    });
    expect(result.principalDuePsw).toBe(2_000);
    expect(result.deliveryFeeDuePsw).toBe(1_000);
    expect(result.totalDuePsw).toBe(3_000);
    expect(result.grossPsw).toBe(5_500);
  });
});
