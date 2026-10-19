import { describe, expect, test } from 'bun:test';
import { CashierType, PaymentComponent } from '../../db/schemas/enums';
import { getDeliveryCashierCollections } from './delivery-cashier-collections';

describe('delivery cashier received components', () => {
  test('sums collected principal and delivery fees independently across payments', () => {
    expect(
      getDeliveryCashierCollections([
        {
          cashierType: CashierType.DELIVERY,
          component: PaymentComponent.PRINCIPAL,
          grossAmountPsw: 3000,
        },
        {
          cashierType: CashierType.DELIVERY,
          component: PaymentComponent.DELIVERY_FEE,
          grossAmountPsw: 1200,
        },
        {
          cashierType: CashierType.DELIVERY,
          component: PaymentComponent.PRINCIPAL,
          grossAmountPsw: 2000,
        },
      ]),
    ).toEqual({
      toBePaidReceivedPsw: 5000,
      deliveryFeeReceivedPsw: 1200,
      hasDeliveryPayments: true,
    });
  });
  test('excludes sender, receiver and full-cashier principal from delivery collections', () => {
    for (const cashierType of [CashierType.SENDING, CashierType.TOBEPAID, CashierType.FULL]) {
      expect(
        getDeliveryCashierCollections([
          { cashierType, component: PaymentComponent.PRINCIPAL, grossAmountPsw: 9000 },
        ]),
      ).toEqual({ toBePaidReceivedPsw: 0, deliveryFeeReceivedPsw: 0, hasDeliveryPayments: false });
    }
  });
  test('does not classify other payment components as fees or To Be Paid', () => {
    expect(
      getDeliveryCashierCollections([
        {
          cashierType: CashierType.DELIVERY,
          component: PaymentComponent.OTHER,
          grossAmountPsw: 1000,
        },
      ]),
    ).toEqual({ toBePaidReceivedPsw: 0, deliveryFeeReceivedPsw: 0, hasDeliveryPayments: true });
  });
  test('shows zero received when no posted transactions exist', () => {
    expect(getDeliveryCashierCollections()).toEqual({
      toBePaidReceivedPsw: 0,
      deliveryFeeReceivedPsw: 0,
      hasDeliveryPayments: false,
    });
  });
});
