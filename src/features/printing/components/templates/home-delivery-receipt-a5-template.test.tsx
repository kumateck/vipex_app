import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { HomeDeliveryReceiptA5Template } from './home-delivery-receipt-a5-template';

describe('home delivery A5 receipt', () => {
  test('shows the full tax base and the separate amount due', () => {
    const html = renderToStaticMarkup(
      <HomeDeliveryReceiptA5Template
        issuedAtLabel="23 Sep 2026"
        bookingCode="AA123"
        trackingCode="AA123"
        senderName="Sender"
        senderPhone="0240000000"
        receiverName="Receiver"
        receiverPhone="0550000000"
        parcelDetails="Box"
        parcelContent="Books"
        destinationName="Accra"
        dropoffAddress="Home"
        chargePsw={4_000}
        deliveryFeePsw={1_500}
        paidPrincipalPsw={4_000}
        paidDeliveryFeePsw={0}
        principalDuePsw={0}
        deliveryFeeDuePsw={1_500}
        totalDuePsw={1_500}
        grossPsw={5_500}
        netPsw={4_700}
        taxRows={[{ label: 'VAT', amountPsw: 800 }]}
        qrValue="https://example.com/AA123"
      />,
    );
    expect(html).toContain('Tax Invoice');
    expect(html).toContain('Amount due on delivery');
    expect(html).toContain('GH₵ 15.00');
    expect(html).toContain('GH₵ 55.00');
    expect(html).toContain('VAT');
    expect(html).not.toContain('Parcel charge');
    expect(html).not.toContain('To be paid');
    expect(html).not.toContain('Parcel balance due');
  });

  test('shows the outstanding to-be-paid principal instead of the full charge', () => {
    const html = renderToStaticMarkup(
      <HomeDeliveryReceiptA5Template
        issuedAtLabel="23 Sep 2026"
        bookingCode="BB456"
        trackingCode="BB456"
        senderName="Sender"
        senderPhone="0240000000"
        receiverName="Receiver"
        receiverPhone="0550000000"
        parcelDetails="Box"
        parcelContent="Books"
        destinationName="Accra"
        dropoffAddress="Home"
        chargePsw={4_000}
        deliveryFeePsw={1_500}
        paidPrincipalPsw={2_000}
        paidDeliveryFeePsw={0}
        principalDuePsw={2_000}
        deliveryFeeDuePsw={1_500}
        totalDuePsw={3_500}
        grossPsw={5_500}
        netPsw={4_700}
        taxRows={[{ label: 'VAT', amountPsw: 800 }]}
        qrValue="https://example.com/BB456"
      />,
    );
    expect(html).toContain('To be paid');
    expect(html).toContain('GH₵ 20.00');
    expect(html).toContain('Amount due on delivery');
    expect(html).toContain('GH₵ 35.00');
    expect(html).not.toContain('Parcel charge');
    expect(html).not.toContain('GH₵ 40.00');
  });
});
