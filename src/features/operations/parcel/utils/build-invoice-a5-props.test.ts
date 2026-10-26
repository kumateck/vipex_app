import { describe, expect, test } from 'bun:test';
import type { ReceiptPrintData } from '../components/parcel-receipt.types';
import { buildInvoiceA5Props } from './build-invoice-a5-props';

const creditReceipt: ReceiptPrintData = {
  bookingCode: 'BOOK-CREDIT',
  trackingCode: 'TRACK-CREDIT',
  settlementMode: 'CREDIT',
  parcelDetails: 'Box',
  senderName: 'Sender',
  senderTelephone: '0200000000',
  receiverName: 'Receiver',
  receiverTelephone: '0500000000',
  destinationBranchName: 'Kumasi',
  destinationLocationName: 'Asafo',
  totalChargeCedis: 50,
  senderPaidCedis: 0,
  receiverToPayCedis: 0,
  amountPaidCedis: 0,
  issuedAt: '2026-10-01T12:00:00.000Z',
};

describe('buildInvoiceA5Props credit reprints', () => {
  test('labels credit and keeps the paid amount at zero', () => {
    const props = buildInvoiceA5Props(creditReceipt, {
      amountPaidCedis: 0,
      tax: { vat: 0, getfund: 0, nhil: 0, covid: 0, totalTax: 0 },
      qrUrl: 'https://vipexparcel.com/tracking/TRACK-CREDIT',
    });

    expect(props.paymentModeLabel).toBe('Credit');
    expect(props.amountPaidCedis).toBe(0);
    expect(props.senderPaidCedis).toBe(0);
  });
});
