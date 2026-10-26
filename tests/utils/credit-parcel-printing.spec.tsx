import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { PaymentMethod, PaymentComponent } from '@/db/schemas/enums';
import type { ReceiptPrintData } from '@/features/operations/parcel/components/parcel-receipt.types';
import type { SenderCashierParcel } from '@/features/operations/parcel/api/parcel.api';
import { getSenderDuePsw } from '@/features/operations/parcel/components/parcel-sender-payments/utils';
import { buildSenderReceiptData } from '@/features/operations/parcel/components/parcel-sender-payments/build-sender-receipt-data';
import {
  buildInvoiceA5Props,
  computeParcelReceiptTax,
  resolveReceiptReprint,
} from '@/features/operations/parcel/utils';
import { InvoiceA5Template } from '@/features/printing/components/templates/invoice-a5-template';
import { ReceiptRollTemplate } from '@/features/printing/components/templates/receipt-roll-template';
import { buildSenderReceiptReprintTax } from '@/server/features/receipt-reprint/receipt-reprint-tax';
import {
  assertCreditPrincipalNotCollected,
  assertCreditBookingUncollected,
} from '@/server/features/payments/utils/credit-collection-policy';

// The list used to infer 50 paid from charge 50 and receiver balance zero.
const staleReceipt: ReceiptPrintData = {
  bookingCode: 'AO4858124I',
  trackingCode: 'TEST-TRACK',
  parcelDetails: 'Test parcel',
  senderName: 'Sender',
  senderTelephone: '0200000000',
  receiverName: 'Receiver',
  receiverTelephone: '0500000000',
  destinationBranchName: 'Accra',
  destinationLocationName: 'Office',
  totalChargeCedis: 50,
  senderPaidCedis: 50,
  amountPaidCedis: 50,
  receiverToPayCedis: 0,
  issuedAt: '2026-10-24T18:57:13.436Z',
};
const recordedCash = {
  component: 0,
  payer: 0,
  method: PaymentMethod.CASH,
  grossAmountPsw: 5000,
  vatPsw: 625,
  getfundPsw: 104,
  nhilPsw: 104,
  covidPsw: 0,
  taxTotalPsw: 833,
};

describe('credit parcel printing and collection regression', () => {
  test('credit booking cannot create a simultaneous cash payment or receiver obligation', () => {
    expect(() => assertCreditBookingUncollected(PaymentMethod.CREDIT, 0, 0)).not.toThrow();
    expect(() => assertCreditBookingUncollected(PaymentMethod.CREDIT, 50, 0)).toThrow(
      'Credit bookings',
    );
    expect(() => assertCreditBookingUncollected(PaymentMethod.CREDIT, 0, 50)).toThrow(
      'Credit bookings',
    );
    expect(() => assertCreditBookingUncollected(PaymentMethod.CASH, 20, 30)).not.toThrow();
  });
  test('credit sender print confirmation owes no cash and cannot fabricate a PAID sticker', () => {
    const parcel = {
      method: PaymentMethod.CREDIT,
      chargePsw: 5000,
      plannedToBePaidPsw: 0,
      bookingCode: 'CREDIT-TEST',
      trackingCode: 'TEST',
    } as SenderCashierParcel;
    expect(getSenderDuePsw(parcel)).toBe(0);
    const receipt = buildSenderReceiptData({
      parcel,
      senderDueCedis: 50,
      amountValue: 50,
      totalChargeCedis: 50,
      receiverToPayCedis: 0,
      destinationBranchName: 'Accra',
      destinationLocationName: 'Office',
    });
    expect(receipt.amountPaidCedis).toBe(0);
    expect(receipt.settlementMode).toBe('CREDIT');
    expect(receipt.confirmedStickerPayment).toBeUndefined();
    expect(() =>
      assertCreditPrincipalNotCollected(PaymentMethod.CREDIT, PaymentComponent.PRINCIPAL),
    ).toThrow('customer credit');
  });

  test('credit guard permits normal principal, storage and delivery collections', () => {
    for (const method of [
      PaymentMethod.CASH,
      PaymentMethod.MTN,
      PaymentMethod.TELECEL,
      PaymentMethod.AIRTEL,
    ]) {
      expect(() =>
        assertCreditPrincipalNotCollected(method, PaymentComponent.PRINCIPAL),
      ).not.toThrow();
    }
    for (const component of [PaymentComponent.DELIVERY_FEE, PaymentComponent.OTHER]) {
      expect(() =>
        assertCreditPrincipalNotCollected(PaymentMethod.CREDIT, component),
      ).not.toThrow();
    }
  });

  test('voided cash and credit-method entries never become a paid reprint', () => {
    const recorded = buildSenderReceiptReprintTax(PaymentMethod.CREDIT, [
      { ...recordedCash, voidedAt: new Date() },
      { ...recordedCash, method: PaymentMethod.CREDIT },
    ]);
    const data = resolveReceiptReprint(staleReceipt, recorded);
    expect(data.amountPaidCedis).toBe(0);
    expect(data.taxBreakdown).toBeUndefined();
    expect(data.settlementMode).toBe('CREDIT');
    const props = buildInvoiceA5Props(data, {
      amountPaidCedis: 0,
      tax: computeParcelReceiptTax(data),
      qrUrl: 'https://example.invalid/test',
      isDuplicate: true,
    });
    const outputs = [
      renderToStaticMarkup(<InvoiceA5Template {...props} />),
      ...(['xprinter-58mm', 'xprinter-80mm'] as const).map((paperFormat) =>
        renderToStaticMarkup(<ReceiptRollTemplate {...props} paperFormat={paperFormat} />),
      ),
    ];
    for (const html of outputs) {
      expect(html).toContain('PAYMENT STATUS: CREDIT');
      expect(html).toContain('ACKNOWLEDGEMENT NOTE');
      expect(html).toContain('Amount charged to credit account');
      expect(html).toContain('50.00');
      expect(html).toContain('DUPLICATE');
      expect(html).not.toContain('Tax Invoice');
      expect(html).not.toContain('will be collected from the recipient');
      expect(html).not.toContain('VAT:');
    }
  });

  test('fresh actual payment records override a stale credit/zero-paid page snapshot', () => {
    const recorded = buildSenderReceiptReprintTax(PaymentMethod.CREDIT, [recordedCash]);
    const data = resolveReceiptReprint(
      { ...staleReceipt, settlementMode: 'CREDIT', senderPaidCedis: 0, amountPaidCedis: 0 },
      recorded,
    );
    expect(data.settlementMode).toBeUndefined();
    expect(data.amountPaidCedis).toBe(50);
    expect(data.taxBreakdown?.taxTotalCedis).toBe(8.33);
  });

  test('missing payment blocks a claimed paid receipt while receiver-pay notes remain printable', () => {
    expect(() => resolveReceiptReprint(staleReceipt, null)).toThrow('unavailable');
    const receiverPay = {
      ...staleReceipt,
      senderPaidCedis: 0,
      amountPaidCedis: 0,
      receiverToPayCedis: 50,
    };
    expect(resolveReceiptReprint(receiverPay, null)).toEqual(receiverPay);
  });
});
