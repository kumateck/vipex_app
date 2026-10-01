import { describe, expect, test } from 'bun:test';
import { ParcelStatus } from '@/db/schemas/enums';
import { toPublicTrackingResponse } from './public-tracking.service';

describe('public parcel tracking response', () => {
  test('uses tracking code as the lookup identity and exposes customer-safe fields', () => {
    const response = toPublicTrackingResponse({
      id: 'parcel-1',
      trackingCode: 'TRACK-1',
      receiptCode: 'RECEIPT-1',
      senderName: 'Sender',
      receiverName: 'Receiver',
      secondReceiverName: null,
      parcelDetails: '1 M/BB',
      parcelContent: 'Documents',
      parcelValuePsw: 1000,
      chargePsw: 3000,
      plannedToBePaidPsw: 3000,
      status: ParcelStatus.ARRIVED_AT_DESTINATION,
      createdAt: new Date('2026-01-01T10:00:00.000Z'),
      updatedAt: new Date('2026-01-02T10:00:00.000Z'),
      receivedAt: new Date('2026-01-02T09:00:00.000Z'),
      sourceBranchName: 'Accra',
      destinationBranchName: 'Sunyani',
      sentAt: new Date('2026-01-01T12:00:00.000Z'),
      consignmentCode: 'CON-1',
      events: [
        {
          metadata: { patch: { status: ParcelStatus.PROCESSED } },
          createdAt: new Date('2026-01-01T11:00:00.000Z'),
        },
        {
          metadata: { patch: { status: ParcelStatus.IN_TRANSIT } },
          createdAt: new Date('2026-01-01T12:00:00.000Z'),
        },
      ],
    });

    expect(response?.trackingCode).toBe('TRACK-1');
    expect(response?.receiptCode).toBe('RECEIPT-1');
    expect(response?.sourceBranch).toBe('Accra');
    expect(response?.destinationBranch).toBe('Sunyani');
    expect(response?.receiverToPayCedis).toBe(30);
    expect(response?.senderPaidCedis).toBe(0);
    expect(response?.status.label).toBe('Arrived at destination office');
    expect(response?.timeline).toHaveLength(4);
  });
});
