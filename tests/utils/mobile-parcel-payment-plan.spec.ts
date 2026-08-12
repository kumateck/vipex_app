import { describe, expect, test } from 'bun:test';
import { PaymentMethod, PaymentResponsibility } from '@mobile/constants/payment';
import {
  buildMobileParcelPaymentPlan,
  getInitialMobilePaymentResponsibility,
} from '@mobile/features/parcel-create/mobile-parcel-payment-plan';

describe('mobile parcel payment handoff', () => {
  test('opens paid and to-be-paid entries with the correct responsibility', () => {
    expect(getInitialMobilePaymentResponsibility('sender')).toBe(PaymentResponsibility.SENDER);
    expect(getInitialMobilePaymentResponsibility('recipient')).toBe(
      PaymentResponsibility.RECIPIENT,
    );
    expect(getInitialMobilePaymentResponsibility()).toBe(PaymentResponsibility.RECIPIENT);
  });

  test('leaves sender-pay parcels unpaid for the sender cashier', () => {
    expect(buildMobileParcelPaymentPlan(PaymentResponsibility.SENDER, 30)).toEqual({
      method: PaymentMethod.CASH,
      plannedToBePaidCedis: 0,
      senderPaymentCedis: 0,
      paymentResponsibility: PaymentResponsibility.SENDER,
    });
  });

  test('records the full receiver-pay amount without collecting it on mobile', () => {
    expect(buildMobileParcelPaymentPlan(PaymentResponsibility.RECIPIENT, 30)).toEqual({
      method: PaymentMethod.CASH,
      plannedToBePaidCedis: 30,
      senderPaymentCedis: 0,
      paymentResponsibility: PaymentResponsibility.RECIPIENT,
    });
  });
});
