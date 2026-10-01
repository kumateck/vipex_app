import { describe, expect, test } from 'bun:test';
import { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ParcelReceiptPrintContent } from './parcel-receipt-print-content';
import type { ReceiptPrintData } from './parcel-receipt.types';

const receipt: ReceiptPrintData = {
  bookingCode: 'BOOK1',
  trackingCode: 'TRACK1',
  parcelDetails: 'Documents',
  senderName: 'Sender',
  senderTelephone: '0200000000',
  receiverName: 'Receiver',
  receiverTelephone: '0500000000',
  destinationBranchName: 'Kumasi',
  destinationLocationName: 'Asafo',
  totalChargeCedis: 30,
  senderPaidCedis: 0,
  receiverToPayCedis: 30,
  issuedAt: '2026-10-01T12:00:00.000Z',
};

function renderReceipt(data: ReceiptPrintData) {
  return renderToStaticMarkup(
    <ParcelReceiptPrintContent
      data={data}
      desktopStickerRef={createRef<HTMLDivElement>()}
      stickerRef={createRef<HTMLDivElement>()}
      invoiceRef={createRef<HTMLDivElement>()}
      qrUrl="https://vipexparcel.com/tracking/TRACK1"
      amountPaidCedis={0}
      tax={{ vat: 0, getfund: 0, nhil: 0, covid: 0, totalTax: 0 }}
    />,
  );
}

describe('parcel sticker CS propagation', () => {
  test('marks browser and desktop stickers while keeping receiver contacts', () => {
    const html = renderReceipt({ ...receipt, callSender: true });
    expect(html.match(/>CS<\/span>/g)).toHaveLength(2);
    expect(html).toContain('Receiver');
    expect(html).toContain('0500000000');
  });

  test('does not mark unflagged parcel stickers', () => {
    expect(renderReceipt(receipt)).not.toContain('>CS</span>');
  });
});
