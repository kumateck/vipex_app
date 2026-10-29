import { describe, expect, test } from 'bun:test';
import {
  buildInvoiceA5Props,
  computeParcelReceiptTax,
} from '@/features/operations/parcel/utils/build-invoice-a5-props';
import { buildHomeDeliveryReceiptA5Props } from '@/features/operations/parcel/utils/build-home-delivery-receipt-props';
import { buildSenderReceiptData, type ReceiptParcelRow } from '../receipt-data';
import { renderReceiptHtml } from './render-receipt-html';
import { PaymentMethod } from '@/db/schemas/enums';

const row: ReceiptParcelRow = {
  bookingCode: 'BK-2026-0001',
  trackingCode: 'TRK123456',
  callSender: false,
  parcelDetails: '1 x Box',
  parcelContent: 'Documents',
  parcelValuePsw: 50_000,
  chargePsw: 4_000,
  plannedToBePaidPsw: 0,
  senderName: 'Ama Mensah',
  senderPhone: '0244123456',
  senderPhone2: null,
  receiverName: 'Kofi Boateng',
  receiverPhone: '0209876543',
  receiverPhone2: null,
  destinationName: 'Kumasi',
  pickupLocationName: 'Adum',
  createdAt: new Date('2026-10-16T10:00:00Z'),
};
const recorded = {
  grossAmountPsw: 4_000,
  vatPsw: 400,
  getfundPsw: 100,
  nhilPsw: 100,
  covidPsw: 0,
  taxTotalPsw: 600,
  taxComponentKeys: ['GETFUND', 'NHIL', 'VAT'],
};

function renderInvoice(data: ReturnType<typeof buildSenderReceiptData>) {
  const tax = computeParcelReceiptTax(data);
  return renderReceiptHtml(
    {
      template: 'invoice-a5',
      props: buildInvoiceA5Props(data, {
        amountPaidCedis: data.amountPaidCedis ?? data.senderPaidCedis,
        tax,
        qrUrl: 'https://vipexparcel.com/tracking/TRK123456',
      }),
    },
    'receipt-BK-2026-0001',
  );
}

describe('renderReceiptHtml', () => {
  test('credit digital copies retain zero collected and render a credit acknowledgement', () => {
    const data = buildSenderReceiptData({ ...row, method: PaymentMethod.CREDIT }, null);
    expect(data.amountPaidCedis).toBe(0);
    const html = renderInvoice(data);
    expect(html).toContain('PAYMENT STATUS: CREDIT');
    expect(html).not.toContain('Tax Invoice');
    expect(html).not.toContain('will be collected from the recipient');
  });
  test('renders the paid A5 receipt as a standalone document', () => {
    const html = renderInvoice(buildSenderReceiptData(row, recorded));
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('BK-2026-0001');
    expect(html).toContain('Ama Mensah');
    expect(html).toContain('GH₵ 40.00');
    expect(html).toContain('<svg'); // QR code renders as SVG, not an empty canvas
    expect(html).toContain('data:image'); // logo is embedded
    expect(html).toContain('size: A5 landscape');
    expect(html).not.toContain('<script');
  });

  test('renders the unpaid acknowledgement note for to-be-paid bookings', () => {
    const unpaid = buildSenderReceiptData({ ...row, plannedToBePaidPsw: 4_000 }, null);
    expect(unpaid.amountPaidCedis).toBe(0);
    const paid = renderInvoice(buildSenderReceiptData(row, recorded));
    const note = renderInvoice(unpaid);
    expect(note).toContain('BK-2026-0001');
    expect(note).not.toBe(paid);
  });

  test('renders the home delivery receipt', () => {
    const html = renderReceiptHtml(
      {
        template: 'home-delivery-a5',
        props: buildHomeDeliveryReceiptA5Props(
          {
            bookingCode: 'BK-2026-0001',
            trackingCode: 'TRK123456',
            parcelDetails: '1 x Box',
            parcelContent: 'Documents',
            dropoffAddress: 'House 5, Adum',
            senderName: 'Ama Mensah',
            senderPhone: '0244123456',
            senderPhone2: null,
            receiverName: 'Kofi Boateng',
            receiverPhone: '0209876543',
            receiverPhone2: null,
            destinationName: 'Kumasi',
            chargePsw: 4_000,
            deliveryFeePsw: 1_500,
            paidPrincipalPsw: 4_000,
            paidDeliveryFeePsw: 1_500,
            principalDuePsw: 0,
            deliveryFeeDuePsw: 0,
            totalDuePsw: 0,
            grossPsw: 1_500,
            netPsw: 1_300,
            taxRows: [{ label: 'VAT', amountPsw: 200 }],
          },
          { issuedAt: '2026-10-16T12:00:00Z' },
        ),
      },
      'home-delivery-receipt-BK-2026-0001',
    );
    expect(html).toContain('House 5, Adum');
    expect(html).toContain('Kofi Boateng');
    expect(html).toContain('<svg');
  });
});
