import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReceiptRollTemplate } from './receipt-roll-template';
import { HomeDeliveryReceiptRollTemplate } from './home-delivery-receipt-roll-template';
import type { InvoiceA5TemplateProps } from './invoice-a5-template.types';

const receipt: InvoiceA5TemplateProps = {
  bookingCode: 'TEST-123',
  issuedAtLabel: '8 Oct 2026',
  parcelDetails: 'Cloth with long description',
  parcelContent: 'Test content',
  destinationBranchName: 'Accra',
  destinationLocationName: 'Circle',
  payerLabel: 'Receiver Info',
  payerName: 'Test Receiver',
  payerTelephone: '0000000000',
  senderName: 'Test Sender',
  senderTelephone: '0000000001',
  receiverName: 'Test Receiver',
  receiverTelephone: '0000000000',
  paymentModeLabel: 'Receiver pays',
  totalChargeCedis: 50,
  senderPaidCedis: 0,
  receiverToPayCedis: 0,
  amountPaidCedis: 55,
  storageChargeCedis: 5,
  amountInWords: 'Fifty five Ghana cedis',
  tax: { vat: 5, nhil: 1, getfund: 1, totalTax: 7, taxComponentKeys: ['VAT', 'GETFUND', 'NHIL'] },
  qrValue: 'https://example.invalid/TEST-123',
  formatMoney: (amount) => `GHS ${amount.toFixed(2)}`,
};

describe('vertical roll receipts', () => {
  for (const paperFormat of ['xprinter-58mm', 'xprinter-80mm'] as const) {
    test(`${paperFormat} unpaid acknowledgement preserves notice, customer details, QR and terms`, () => {
      const html = renderToStaticMarkup(
        <ReceiptRollTemplate
          {...receipt}
          paperFormat={paperFormat}
          amountPaidCedis={0}
          receiverToPayCedis={50}
          duplicate
        />,
      );
      expect(html).not.toContain('<canvas');
      expect(html).toMatch(/<path d="M[^"]+" fill="#000"/);
      expect(html).toMatch(/<img src="data:image\/png;base64,[^"]+" alt="Vipex logo"/);
      expect(html).toContain('ACKNOWLEDGEMENT NOTE');
      expect(html).toContain('NO PAYMENT');
      expect(html).toContain('PAYMENT STATUS: TO BE PAID');
      expect(html).toContain('GHS 50.00');
      expect(html).toContain('Test Sender');
      expect(html).toContain('Test Receiver');
      expect(html).toContain('TEST-123');
      expect(html).toContain('DUPLICATE');
      expect(html).toContain('TERMS AND CONDITIONS');
      expect(html).toContain('Parcel tracking QR code');
      expect(html).toContain(`data-receipt-paper="${paperFormat}"`);
      expect(html).toContain(paperFormat === 'xprinter-58mm' ? 'width:58mm' : 'width:80mm');
      expect(html).not.toContain('198mm');
      expect(html).not.toContain('rotate');
    });
    test(`${paperFormat} paid receipts preserve recorded taxes, storage, payer and total`, () => {
      const html = renderToStaticMarkup(
        <ReceiptRollTemplate {...receipt} paperFormat={paperFormat} />,
      );
      expect(html).toContain('Tax Invoice');
      expect(html).toContain('Ageing storage (included)');
      expect(html).toContain('GHS 55.00');
      expect(html).toContain('GHS 48.00');
      for (const label of ['VAT:', 'GETFUND:', 'NHIL:', 'Receiver Info:'])
        expect(html).toContain(label);
      expect(html).not.toContain('COVID:');
      expect(html).not.toContain('NO PAYMENT');
    });
  }
  test('partial receipts show the recorded payment and remaining balance independently', () => {
    const html = renderToStaticMarkup(
      <ReceiptRollTemplate
        {...receipt}
        paperFormat="xprinter-80mm"
        senderPaidCedis={20}
        amountPaidCedis={20}
        receiverToPayCedis={30}
      />,
    );
    expect(html).toContain('PARTIAL PAYMENT RECEIPT');
    expect(html).toContain('GHS 20.00');
    expect(html).toContain('GHS 30.00');
  });
  test('home-delivery receipts include only outstanding principal/delivery fees, with tax', () => {
    const html = renderToStaticMarkup(
      <HomeDeliveryReceiptRollTemplate
        paperFormat="xprinter-58mm"
        issuedAtLabel="8 Oct 2026"
        bookingCode="TEST-HD"
        trackingCode="TEST-HD"
        senderName="Test Sender"
        senderPhone="0000000001"
        receiverName="Test Receiver"
        receiverPhone="0000000000"
        parcelDetails="Books"
        parcelContent="Box"
        destinationName="Accra"
        dropoffAddress="Test address"
        chargePsw={4000}
        deliveryFeePsw={1500}
        paidPrincipalPsw={4000}
        paidDeliveryFeePsw={0}
        principalDuePsw={0}
        deliveryFeeDuePsw={1500}
        totalDuePsw={1500}
        grossPsw={1500}
        netPsw={1200}
        taxRows={[{ label: 'VAT', amountPsw: 300 }]}
        qrValue="https://example.invalid/TEST-HD"
      />,
    );
    expect(html).toContain('Amount due on delivery');
    expect(html).toContain('GH₵ 15.00');
    expect(html).toContain('VAT:');
    expect(html).toContain('Test address');
    expect(html).not.toContain('To be paid:');
    expect(html).not.toContain('GH₵ 40.00');
  });
});
