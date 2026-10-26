import { describe, expect, test } from 'bun:test';
import { getParcelPaymentStatus } from '@/shared/shipments/parcel-payment-status';

describe('customer parcel payment labels', () => {
  const base = { chargePsw: 5000, method: 0, paidPrincipalPsw: 0, creditPaidPsw: 0 };
  test('indicates unpaid, partial, fully paid and credit from recorded settlements', () => {
    expect(getParcelPaymentStatus(base)).toBe('TO_BE_PAID');
    expect(getParcelPaymentStatus({ ...base, paidPrincipalPsw: 2000 })).toBe('PARTIAL');
    expect(getParcelPaymentStatus({ ...base, paidPrincipalPsw: 5000 })).toBe('PAID');
    expect(getParcelPaymentStatus({ ...base, method: 4 })).toBe('CREDIT');
    expect(getParcelPaymentStatus({ ...base, method: 4, paidPrincipalPsw: 5000 })).toBe('CREDIT');
    expect(getParcelPaymentStatus({ ...base, method: 4, creditPaidPsw: 5000 })).toBe('PAID');
  });
  test('zero is never presented as paid', () => {
    expect(getParcelPaymentStatus({ ...base, chargePsw: 0 })).toBe('CHARGE_MISSING');
    expect(getParcelPaymentStatus({ ...base, chargePsw: 0, method: 4 })).toBe('CREDIT');
  });
});
