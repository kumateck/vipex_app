import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { ToBePaidReceiptA5Template } from '../../src/features/printing/components/templates/to-be-paid-receipt-a5-template';

describe('A5 acknowledgement note', () => {
  test('renders the receiver-pay acknowledgement fields without the retired receipt fields', () => {
    const html = renderToStaticMarkup(
      <ToBePaidReceiptA5Template
        bookingCode="KA123"
        issuedAtLabel="12 Aug 2026"
        parcelDetails="1 box"
        parcelContent="Clothes"
        destinationBranchName="Accra"
        destinationLocationName="Circle"
        payerLabel="Receiver Info"
        payerName="Kojo Recipient"
        payerTelephone="0200000002"
        senderName="Ama Sender"
        senderTelephone="0200000001"
        receiverName="Kojo Recipient"
        receiverTelephone="0200000002"
        paymentModeLabel="Receiver pay"
        totalChargeCedis={30}
        senderPaidCedis={0}
        receiverToPayCedis={30}
        amountPaidCedis={0}
        amountInWords="Thirty Ghana cedis"
        tax={{ vat: 0, getfund: 0, nhil: 0, totalTax: 0 }}
        qrValue="KA123"
        formatMoney={(amount) => `GHS ${amount.toFixed(2)}`}
      />,
    );

    expect(html).toContain('ACKNOWLEDGEMENT NOTE');
    expect(html).toContain('Techiman: 0559085369');
    expect(html).toContain('Tamale: 0502638678');
    expect(html).toContain('The sender has made <strong>NO PAYMENT</strong>');
    expect(html).toContain('Parcel Code');
    expect(html).toContain('#KA123');
    expect(html).toContain('Sender:');
    expect(html).toContain('Ama Sender (0200000001)');
    expect(html).toContain('Recipient:');
    expect(html).toContain('Kojo Recipient (0200000002)');
    expect(html).toContain('Delivery Location');
    expect(html).toContain('Circle, Accra');
    expect(html).toContain('Item Description');
    expect(html).toContain('PAYMENT STATUS: TO BE PAID');
    expect(html).toContain('Amount Due for payment');
    expect(html).toContain('GHS 30.00');
    expect(html).toContain(
      'Parcels not collected within two weeks will incur a daily storage fee of GH₵2.',
    );
    expect(html).toContain(
      'Information collected will be used only for the intended purpose and handled in accordance with applicable data protection requirements.',
    );
    expect(html).not.toContain('PARCEL DELIVERY RECEIPT');
    expect(html).not.toContain('Receipt Number');
  });
});
