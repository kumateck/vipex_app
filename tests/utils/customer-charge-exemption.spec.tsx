import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  CUSTOMER_TYPE_OPTIONS,
  customerTypeLabel,
  resolveParcelExemptionType,
} from '@/shared/customers/customer-types';
import { getParcelChargeValidationError } from '@/shared/shipments/parcel-charge-policy';
import { getParcelPaymentStatus } from '@/shared/shipments/parcel-payment-status';
import { resolveStickerPayment } from '@/shared/printing';
import { verifyStickerPaymentRecord } from '@/server/features/shipments/parcel-sticker-payment.rules';
import {
  computeParcelAgeingSnapshot,
  computeStorageAccrualPsw,
} from '@/server/features/shipments/parcels.service';
import { ParcelSuperSearchPaymentCell } from '@/features/operations/parcel/components/parcel-super-search/parcel-super-search-payment-cell';

const payment = {
  bookingCode: 'BK-TEST',
  trackingCode: 'TRK-TEST',
  chargePsw: 0,
  plannedToBePaidPsw: 0,
  senderPaidPsw: 0,
  receiverPaidPsw: 0,
  creditPsw: 0,
  method: 0,
};
const ageing = {
  status: 5,
  receivedAt: new Date('2024-01-01'),
  now: new Date('2026-11-01'),
  policy: { gracePeriodDays: 14, storageFeePerDayPsw: 200, agedThresholdMonths: 6 },
};

describe('customer charge exemptions', () => {
  test.each([2, 3, 4, 5])('type %i qualifies as sender or receiver and has no charges', (type) => {
    expect(resolveParcelExemptionType(type, 0)).toBe(type);
    expect(resolveParcelExemptionType(1, type)).toBe(type);
    expect(customerTypeLabel(type)).not.toBe('Unknown');
    expect(
      getParcelChargeValidationError({
        chargeExemptCustomerType: type,
        chargeCedis: 0,
        plannedToBePaidCedis: 0,
      }),
    ).toBeNull();
    for (const charge of [0.01, -1, Number.NaN]) {
      expect(
        getParcelChargeValidationError({
          chargeExemptCustomerType: type,
          chargeCedis: charge,
          plannedToBePaidCedis: 0,
        }),
      ).not.toBeNull();
    }
    expect(
      getParcelChargeValidationError({
        chargeExemptCustomerType: type,
        chargeCedis: 0,
        plannedToBePaidCedis: 1,
      }),
    ).not.toBeNull();
    expect(
      getParcelPaymentStatus({
        ...payment,
        chargeExemptCustomerType: type,
        paidPrincipalPsw: 0,
        creditPaidPsw: 0,
      }),
    ).toBe('EXEMPT');
    expect(computeStorageAccrualPsw({ ...ageing, chargeExemptCustomerType: type })).toBe(0);
    expect(
      computeParcelAgeingSnapshot({ ...ageing, chargeExemptCustomerType: type }),
    ).toMatchObject({
      isParcelAged: true,
      storageChargePsw: 0,
      storageChargeDays: 0,
      storageFeePerDayPsw: 0,
    });
  });

  test('Staff takes priority; ordinary customers and historical zero charges stay ordinary', () => {
    expect(CUSTOMER_TYPE_OPTIONS.map((row) => row.value)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(resolveParcelExemptionType(5, 2)).toBe(5);
    expect(resolveParcelExemptionType(3, 5)).toBe(5);
    expect(resolveParcelExemptionType(0, 1)).toBeNull();
    expect(resolveParcelExemptionType(undefined, undefined)).toBeNull();
    expect(
      getParcelChargeValidationError({ chargeCedis: 0, plannedToBePaidCedis: 0 }),
    ).not.toBeNull();
    expect(getParcelPaymentStatus({ ...payment, paidPrincipalPsw: 0, creditPaidPsw: 0 })).toBe(
      'CHARGE_MISSING',
    );
    expect(computeStorageAccrualPsw(ageing)).toBeGreaterThan(0);
    expect(() => verifyStickerPaymentRecord(payment)).toThrow('not confirmed');
  });

  test('verified exemption prints zero and retains the receiving staff name', () => {
    const result = verifyStickerPaymentRecord({
      ...payment,
      chargeExemptCustomerType: 5,
      relatedStaffNameSnapshot: 'Ama Mensah',
    });
    expect(result).toMatchObject({
      status: 'EXEMPT',
      amountCedis: 0,
      relatedStaffNameSnapshot: 'Ama Mensah',
    });
    expect(resolveStickerPayment(0, result.status)).toEqual({
      hasToBePaid: false,
      statusLabel: 'EXEMPT',
    });
    expect(() => resolveStickerPayment(1, 'EXEMPT')).toThrow();
    expect(() =>
      verifyStickerPaymentRecord({ ...payment, chargeExemptCustomerType: 2, senderPaidPsw: 1 }),
    ).toThrow();
    expect(() =>
      verifyStickerPaymentRecord({ ...payment, chargeExemptCustomerType: 2, method: 4 }),
    ).toThrow();
  });

  test('search identifies exemption without claiming a payment was made', () => {
    const html = renderToStaticMarkup(
      <ParcelSuperSearchPaymentCell
        parcel={{ ...payment, chargeExemptCustomerType: 2, parcelValuePsw: 5000, status: 5 }}
      />,
    );
    expect(html).toContain('Exempt');
    expect(html).not.toContain('Paid by');
    expect(html).not.toContain('Charge missing');
  });
});
