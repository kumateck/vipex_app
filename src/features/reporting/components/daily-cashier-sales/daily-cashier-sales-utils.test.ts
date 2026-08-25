import { describe, expect, it } from 'bun:test';
import { CashierType, PaymentComponent, PaymentMethod, Payer } from '@/db/schemas/enums';
import type { DailyCashierSalesTransactionRow } from '@/features/reporting/api/reporting.api';
import { groupDeliveryCashierTransactions } from './daily-cashier-sales-utils';

function transaction(
  overrides: Partial<DailyCashierSalesTransactionRow>,
): DailyCashierSalesTransactionRow {
  return {
    paymentId: 'payment-1',
    sessionId: 'session-1',
    parcelId: 'parcel-1',
    bookingCode: 'KA4453168D',
    trackingCode: 'TRACK-1',
    parcelDetails: '1 P/B',
    parcelContent: 'KENTE',
    payerName: 'Customer',
    payerTelephone: '0200000000',
    whoPaid: 'Delivery',
    cashierId: 'cashier-1',
    cashierName: 'Cashier',
    branchId: 'branch-1',
    branchName: 'Accra',
    locationId: null,
    locationName: null,
    cashierType: CashierType.DELIVERY,
    method: PaymentMethod.CASH,
    component: PaymentComponent.PRINCIPAL,
    payer: Payer.RECIPIENT,
    grossAmountPsw: 3_000,
    netAmountPsw: 3_000,
    taxTotalPsw: 0,
    receivedAt: '2026-08-25T12:25:00.000Z',
    receiptNo: null,
    ...overrides,
  };
}

describe('delivery cashier transaction grouping', () => {
  it('groups matching booking payments and exposes the requested breakdown', () => {
    const rows = groupDeliveryCashierTransactions([
      transaction({ paymentId: 'principal', grossAmountPsw: 3_000, netAmountPsw: 3_000 }),
      transaction({
        paymentId: 'delivery-fee',
        component: PaymentComponent.DELIVERY_FEE,
        grossAmountPsw: 6_000,
        netAmountPsw: 6_000,
      }),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      grossAmountPsw: 9_000,
      toBePaidAmountPsw: 3_000,
      deliveryFeeAmountPsw: 6_000,
      paymentIds: ['principal', 'delivery-fee'],
    });
  });

  it('does not group non-delivery cashier payments', () => {
    const rows = groupDeliveryCashierTransactions([
      transaction({ paymentId: 'sender-1', cashierType: CashierType.SENDING }),
      transaction({ paymentId: 'sender-2', cashierType: CashierType.SENDING }),
    ]);

    expect(rows).toHaveLength(2);
  });
});
