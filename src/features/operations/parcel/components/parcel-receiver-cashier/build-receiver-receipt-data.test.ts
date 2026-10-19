import { describe, expect, test } from 'bun:test';
import type { ParcelSearchRow } from '../../api/parcel.api';
import { buildReceiverReceiptData } from './build-receiver-receipt-data';

const parcel = {
  bookingCode: 'AA123',
  trackingCode: 'TRACK123',
  parcelDetails: 'Box',
  chargePsw: 4_000,
  receiverName: 'Receiver',
  senderName: 'Sender',
} as ParcelSearchRow;

describe('receiver receipt ageing storage', () => {
  test('adds collected storage to receipt total and preserves supplied receipt tax', () => {
    const receipt = buildReceiverReceiptData({
      parcel,
      receivedByName: 'Receiver',
      destinationBranchName: 'Accra',
      destinationLocationName: 'Circle',
      totalChargeCedis: 40,
      senderPaidCedis: 10,
      receiverPaidCedis: 30,
      storageChargeCedis: 6,
      taxBreakdown: {
        vatCedis: 2,
        getfundCedis: 0,
        nhilCedis: 0,
        covidCedis: 0,
        taxTotalCedis: 2,
      },
    });

    expect(receipt.amountPaidCedis).toBe(36);
    expect(receipt.storageChargeCedis).toBe(6);
    expect(receipt.taxBreakdown?.taxTotalCedis).toBe(2);
  });
});
