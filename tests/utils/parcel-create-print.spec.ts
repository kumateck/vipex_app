import { describe, expect, test } from 'bun:test';
import {
  getParcelCreationPrintSelection,
  mergePaidParcelsIntoReceipt,
} from '@/features/operations/parcel/components/parcel-create/parcel-create-print.utils';
import type { ReceiptSummary } from '@/features/operations/parcel/components/parcel-create/parcel-form.types';

describe('parcel creation print queue', () => {
  test('prints a receipt only when the sender paid an amount', () => {
    const parcels = createReceipt().parcels;
    const senderPaid = parcels[0]!;
    const receiverPay = parcels[1]!;
    const credit = parcels[2]!;

    expect(getParcelCreationPrintSelection(senderPaid)).toBe('both');
    expect(getParcelCreationPrintSelection(receiverPay)).toBe('sticker');
    expect(getParcelCreationPrintSelection(credit)).toBe('sticker');
  });

  test('retains unpaid parcels while replacing paid parcel receipt data', () => {
    const receipt = createReceipt();
    const paidSenderParcel = {
      ...receipt.parcels[0]!,
      amountPaidCedis: 25,
      senderPaidCedis: 25,
    };

    const merged = mergePaidParcelsIntoReceipt(receipt, [paidSenderParcel]);

    expect(merged.parcels).toHaveLength(3);
    expect(merged.parcels[0]).toEqual(paidSenderParcel);
    expect(merged.parcels[1]).toBe(receipt.parcels[1]);
    expect(merged.parcels[2]).toBe(receipt.parcels[2]);
  });
});

function createReceipt(): ReceiptSummary {
  const shared = {
    bookingCode: 'BK-1',
    trackingCode: 'TR-1',
    parcelDetails: 'Box',
    senderName: 'Sender',
    senderTelephone: '0200000000',
    receiverName: 'Receiver',
    receiverTelephone: '0240000000',
    destinationBranchName: 'Accra',
    destinationLocationName: 'Terminal',
    totalChargeCedis: 25,
    issuedAt: '2026-08-10T00:00:00.000Z',
  };

  return {
    bookingId: 'booking-1',
    parcels: [
      { ...shared, parcelId: 'sender-paid', senderPaidCedis: 25, receiverToPayCedis: 0 },
      { ...shared, parcelId: 'receiver-pay', senderPaidCedis: 0, receiverToPayCedis: 25 },
      { ...shared, parcelId: 'credit', senderPaidCedis: 0, receiverToPayCedis: 0 },
    ],
  };
}
