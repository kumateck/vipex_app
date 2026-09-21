import { describe, expect, test } from 'bun:test';
import { getConsignmentPaymentStatus } from './payment-status';

describe('getConsignmentPaymentStatus', () => {
  test('marks a sender-paid parcel as paid', () => {
    expect(getConsignmentPaymentStatus({ chargePsw: 5_000, plannedToBePaidPsw: 0 })).toEqual({
      dotClassName: 'bg-emerald-500',
    });
  });

  test('marks a receiver-paid parcel as to be paid', () => {
    expect(getConsignmentPaymentStatus({ chargePsw: 5_000, plannedToBePaidPsw: 5_000 })).toEqual({
      dotClassName: 'bg-amber-500',
    });
  });

  test('marks a split-payment parcel as partial', () => {
    expect(getConsignmentPaymentStatus({ chargePsw: 5_000, plannedToBePaidPsw: 2_000 })).toEqual({
      dotClassName: 'bg-sky-500',
    });
  });
});
