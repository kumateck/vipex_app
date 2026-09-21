import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import type {
  ParcelSearchRow,
  SenderCashierParcel,
} from '@/features/operations/parcel/api/parcel.api';
import { buildReceiverReceiptData } from '@/features/operations/parcel/components/parcel-receiver-cashier/build-receiver-receipt-data';
import { buildSenderReceiptData } from '@/features/operations/parcel/components/parcel-sender-payments/build-sender-receipt-data';
import { InvoiceA5Template } from '@/features/printing/components/templates/invoice-a5-template';

const PARTY_DETAILS = {
  senderName: 'Ama Sender',
  senderPhone: '0200000001',
  receiverName: 'Kojo Receiver',
  receiverPhone: '0200000002',
};

describe('payment receipt payer details', () => {
  test('sender payment uses the sender details', () => {
    const receipt = buildSenderReceiptData({
      parcel: createSenderParcel(),
      senderDueCedis: 30,
      amountValue: 30,
      totalChargeCedis: 30,
      receiverToPayCedis: 0,
      destinationBranchName: 'Accra',
      destinationLocationName: 'Circle',
    });

    expect(receipt.payerType).toBe('sender');
    expect(receipt.payerName).toBe(PARTY_DETAILS.senderName);
    expect(receipt.payerTelephone).toBe(PARTY_DETAILS.senderPhone);
  });

  test('receiver payment uses the primary receiver details', () => {
    const receipt = buildReceiverReceipt('Kojo Receiver');

    expect(receipt.payerType).toBe('receiver');
    expect(receipt.payerName).toBe(PARTY_DETAILS.receiverName);
    expect(receipt.payerTelephone).toBe(PARTY_DETAILS.receiverPhone);
  });

  test('second receiver payment still uses the primary receiver details', () => {
    const receipt = buildReceiverReceipt('Adwoa Second Receiver');

    expect(receipt.receivedByName).toBe('Adwoa Second Receiver');
    expect(receipt.payerType).toBe('receiver');
    expect(receipt.payerName).toBe(PARTY_DETAILS.receiverName);
    expect(receipt.payerTelephone).toBe(PARTY_DETAILS.receiverPhone);
  });

  test('paid invoice renders the selected payer instead of always rendering the sender', () => {
    const html = renderToStaticMarkup(
      <InvoiceA5Template
        bookingCode="KA123"
        issuedAtLabel="22 Aug 2026"
        parcelDetails="One box"
        parcelContent="Clothes"
        destinationBranchName="Accra"
        destinationLocationName="Circle"
        payerLabel="Receiver Info"
        payerName={PARTY_DETAILS.receiverName}
        payerTelephone={PARTY_DETAILS.receiverPhone}
        senderName={PARTY_DETAILS.senderName}
        senderTelephone={PARTY_DETAILS.senderPhone}
        receiverName={PARTY_DETAILS.receiverName}
        receiverTelephone={PARTY_DETAILS.receiverPhone}
        paymentModeLabel="Receiver pay"
        totalChargeCedis={30}
        senderPaidCedis={0}
        receiverToPayCedis={0}
        amountPaidCedis={30}
        amountInWords="Thirty Ghana cedis"
        tax={{ vat: 0, getfund: 0, nhil: 0, totalTax: 0 }}
        qrValue="KA123"
        formatMoney={(amount) => `GHS ${amount.toFixed(2)}`}
      />,
    );

    expect(html).toContain('Receiver Info');
    expect(html).toContain(PARTY_DETAILS.receiverName);
    expect(html).toContain(PARTY_DETAILS.receiverPhone);
    expect(html).not.toContain(PARTY_DETAILS.senderName);
  });
});

function buildReceiverReceipt(receivedByName: string) {
  return buildReceiverReceiptData({
    parcel: createReceiverParcel(),
    receivedByName,
    destinationBranchName: 'Accra',
    destinationLocationName: 'Circle',
    totalChargeCedis: 30,
    senderPaidCedis: 0,
    receiverPaidCedis: 30,
  });
}

function createSenderParcel(): SenderCashierParcel {
  return {
    id: 'parcel-1',
    senderId: 'sender-1',
    receiverId: 'receiver-1',
    destinationId: 'branch-1',
    pickupLocationId: 'location-1',
    bookingCode: 'KA123',
    trackingCode: 'TRACK123',
    parcelDetails: 'One box',
    chargePsw: 3_000,
    plannedToBePaidPsw: 0,
    status: 0,
    createdAt: '2026-08-22T10:00:00.000Z',
    ...PARTY_DETAILS,
  };
}

function createReceiverParcel(): ParcelSearchRow {
  return {
    ...createSenderParcel(),
    companyId: 'company-1',
    sourceId: 'branch-1',
    bookingId: 'booking-1',
    secondReceiverId: 'receiver-2',
    parcelContent: 'Clothes',
    parcelValuePsw: 10_000,
    cardId: null,
    cardNumber: null,
    secondCardId: null,
    secondCardNumber: null,
    method: 1,
    shelfPickerStaffId: null,
    taxReportConfirmation: false,
    callSender: false,
    isDeleted: false,
    deletedBy: null,
    deletedAt: null,
    deleteReason: null,
    createdBy: 'user-1',
    receivedBy: null,
    receivedAt: null,
    confirmedBy: null,
    confirmedAt: null,
    updatedAt: '2026-08-22T10:00:00.000Z',
    cashierSessionId: null,
    bookingCreatedAt: '2026-08-22T10:00:00.000Z',
    secondReceiverName: 'Adwoa Second Receiver',
    secondReceiverPhone: '0200000003',
  };
}
