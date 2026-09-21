import { describe, expect, test } from 'bun:test';
import { PaymentComponent } from '@/db/schemas/enums';
import { getOutstandingPrincipalPsw } from './principal-settlement';

describe('getOutstandingPrincipalPsw', () => {
  test('keeps the receiver balance after the sender pays their portion', () => {
    expect(
      getOutstandingPrincipalPsw(15_000, [
        { component: PaymentComponent.PRINCIPAL, grossAmountPsw: 10_000 },
      ]),
    ).toBe(5_000);
  });

  test('subtracts subsequent recipient payments without double counting', () => {
    expect(
      getOutstandingPrincipalPsw(15_000, [
        { component: PaymentComponent.PRINCIPAL, grossAmountPsw: 10_000 },
        { component: PaymentComponent.PRINCIPAL, grossAmountPsw: 2_000 },
      ]),
    ).toBe(3_000);
  });

  test('ignores non-principal and voided payments', () => {
    expect(
      getOutstandingPrincipalPsw(5_000, [
        { component: PaymentComponent.OTHER, grossAmountPsw: 1_000 },
        {
          component: PaymentComponent.PRINCIPAL,
          grossAmountPsw: 2_000,
          voidedAt: '2026-09-20T00:00:00.000Z',
        },
      ]),
    ).toBe(5_000);
  });
});
