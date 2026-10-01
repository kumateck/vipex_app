import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { InvoiceA5Template } from './invoice-a5-template';
import type { InvoiceA5TemplateProps } from './invoice-a5-template.types';

const receipt: InvoiceA5TemplateProps = {
  bookingCode: 'AS9962869W',
  issuedAtLabel: '30 Sep 2026',
  parcelDetails: 'Cloth',
  destinationBranchName: 'Kumasi',
  destinationLocationName: 'Anloga Junction',
  payerLabel: 'Sender Info',
  payerName: 'Shermin Dodd',
  payerTelephone: '0554558838',
  senderName: 'Shermin Dodd',
  senderTelephone: '0554558838',
  receiverName: 'Receiver',
  receiverTelephone: '0240000000',
  paymentModeLabel: 'Sender pays',
  totalChargeCedis: 30,
  senderPaidCedis: 30,
  receiverToPayCedis: 0,
  amountPaidCedis: 30,
  amountInWords: 'thirty Ghana cedis only',
  tax: {
    vat: 3.75,
    getfund: 0.75,
    nhil: 0.75,
    totalTax: 5.25,
    taxComponentKeys: ['VAT', 'GETFUND', 'NHIL'],
  },
  qrValue: 'https://example.com/track/AS9962869W',
  formatMoney: (amount) => `GHS ${amount.toFixed(2)}`,
};

describe('A5 receipt reprint', () => {
  test('marks duplicate and prints recorded tax components', () => {
    const html = renderToStaticMarkup(<InvoiceA5Template {...receipt} duplicate />);
    expect(html).toContain('DUPLICATE');
    expect(html).toMatch(/<img src="data:image\/png;base64,[^"]+" alt="Vipex logo"/);
    expect(html).toContain('GETFUND:');
    expect(html).toContain('NHIL:');
    expect(html).toContain('VAT:');
    expect(html).toContain('GHS 24.75');
    expect(html).toContain('GHS 30.00');
  });

  test('does not mark an original receipt', () => {
    const html = renderToStaticMarkup(<InvoiceA5Template {...receipt} />);
    expect(html).not.toContain('DUPLICATE');
    expect(html).toMatch(/<img src="data:image\/png;base64,[^"]+" alt="Vipex logo"/);
  });

  test('prints recorded sender tax when component keys are absent', () => {
    const html = renderToStaticMarkup(
      <InvoiceA5Template {...receipt} tax={{ ...receipt.tax, taxComponentKeys: undefined }} />,
    );
    expect(html).toContain('GETFUND:');
    expect(html).toContain('NHIL:');
    expect(html).toContain('VAT:');
    expect(html).not.toContain('COVID:');
  });

  test('shows the logo and recorded tax on original and duplicate receiver-paid receipts', () => {
    const receiverReceipt = {
      ...receipt,
      payerLabel: 'Receiver Info',
      payerName: 'Receiver',
      senderPaidCedis: 0,
      amountPaidCedis: 30,
      receiverToPayCedis: 0,
      tax: { ...receipt.tax, taxComponentKeys: undefined },
    };
    const original = renderToStaticMarkup(<InvoiceA5Template {...receiverReceipt} />);
    const duplicate = renderToStaticMarkup(<InvoiceA5Template {...receiverReceipt} duplicate />);
    for (const html of [original, duplicate]) {
      expect(html).toContain('Receiver Info');
      expect(html).toMatch(/<img src="data:image\/png;base64,[^"]+" alt="Vipex logo"/);
      expect(html).toContain('GETFUND:');
      expect(html).toContain('NHIL:');
      expect(html).toContain('VAT:');
    }
    expect(original).not.toContain('DUPLICATE');
    expect(duplicate).toContain('DUPLICATE');
  });

  test('marks reprinted acknowledgement notes', () => {
    const html = renderToStaticMarkup(
      <InvoiceA5Template
        {...receipt}
        senderPaidCedis={0}
        amountPaidCedis={0}
        receiverToPayCedis={30}
        duplicate
      />,
    );
    expect(html).toContain('ACKNOWLEDGEMENT NOTE');
    expect(html).toContain('DUPLICATE');
  });
});
