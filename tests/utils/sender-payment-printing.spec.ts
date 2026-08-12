import { describe, expect, test } from 'bun:test';
import type { SenderCashierParcel } from '@/features/operations/parcel/api/parcel.api';
import { buildSenderReceiptData } from '@/features/operations/parcel/components/parcel-sender-payments/build-sender-receipt-data';
import { isToBePaidDeliveryReceipt } from '@/features/printing/components/templates/invoice-a5-template.utils';

const PARCEL: SenderCashierParcel = {
  id: 'parcel-1',
  senderId: 'sender-1',
  receiverId: 'receiver-1',
  destinationId: 'branch-2',
  pickupLocationId: 'location-2',
  bookingCode: 'KA123',
  trackingCode: 'TRACK123',
  parcelDetails: 'One box',
  parcelContent: 'Clothes',
  senderName: 'Sender Name',
  senderPhone: '0200000000',
  receiverName: 'Receiver Name',
  receiverPhone: '0240000000',
  chargePsw: 3_000,
  plannedToBePaidPsw: 0,
  status: 0,
  createdAt: '2026-08-12T10:00:00.000Z',
};

function buildReceipt(senderDueCedis: number, receiverToPayCedis: number) {
  return buildSenderReceiptData({
    parcel: PARCEL,
    senderDueCedis,
    amountValue: senderDueCedis,
    totalChargeCedis: 30,
    receiverToPayCedis,
    destinationBranchName: 'Accra',
    destinationLocationName: 'Circle',
  });
}

describe('Sender Payments print document selection', () => {
  test('receiver-to-pay parcel produces an acknowledgement note', () => {
    const receipt = buildReceipt(0, 30);

    expect(receipt.amountPaidCedis).toBe(0);
    expect(
      isToBePaidDeliveryReceipt({
        amountPaidCedis: receipt.amountPaidCedis ?? 0,
        receiverToPayCedis: receipt.receiverToPayCedis,
        senderPaidCedis: receipt.senderPaidCedis,
      }),
    ).toBe(true);
  });

  test('sender-paid parcel produces a paid receipt', () => {
    const receipt = buildReceipt(30, 0);

    expect(receipt.amountPaidCedis).toBe(30);
    expect(
      isToBePaidDeliveryReceipt({
        amountPaidCedis: receipt.amountPaidCedis ?? 0,
        receiverToPayCedis: receipt.receiverToPayCedis,
        senderPaidCedis: receipt.senderPaidCedis,
      }),
    ).toBe(false);
  });
});
