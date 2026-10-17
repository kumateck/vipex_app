import { describe, expect, test } from 'bun:test';
import { ParcelStatus } from '@/db/schemas/enums';
import { toPublicTrackingResponse } from './public-tracking.service';
import { maskReceiverName } from './mask-receiver-name';

const trackingRow = {
  id: 'parcel-1',
  trackingCode: 'TRACK-1',
  receiptCode: 'RECEIPT-1',
  receiverName: 'Ama Owusu Mensah',
  parcelDetails: '1 M/BB',
  chargePsw: 3000,
  plannedToBePaidPsw: 3000,
  status: ParcelStatus.ARRIVED_AT_DESTINATION,
  createdAt: new Date('2026-01-01T10:00:00.000Z'),
  updatedAt: new Date('2026-01-02T10:00:00.000Z'),
  receivedAt: new Date('2026-01-02T09:00:00.000Z'),
  sourceBranchName: 'Accra',
  destinationBranchName: 'Sunyani',
  sentAt: new Date('2026-01-01T12:00:00.000Z'),
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
};

describe('public parcel tracking response', () => {
  test('uses tracking code as the lookup identity and exposes customer-safe fields', () => {
    const response = toPublicTrackingResponse(trackingRow);

    expect(response?.trackingCode).toBe('TRACK-1');
    expect(response?.receiptCode).toBe('RECEIPT-1');
    expect(response?.sourceBranch).toBe('Accra');
    expect(response?.destinationBranch).toBe('Sunyani');
    expect(response?.receiverToPayCedis).toBe(30);
    expect(response?.senderPaidCedis).toBe(0);
    expect(response?.status.label).toBe('Arrived at destination office');
    expect(response?.timeline).toHaveLength(4);
  });

  test('masks the receiver name and omits sender, contents, value and internal codes', () => {
    const response = toPublicTrackingResponse(trackingRow);

    expect(response?.receiver).toEqual({ name: 'Ama O**** M*****' });
    expect(Object.keys(response ?? {}).sort()).toEqual(
      [
        'destinationBranch',
        'packaging',
        'processingTime',
        'reachedDestinationAt',
        'receiptCode',
        'receiver',
        'receiverToPayCedis',
        'senderPaidCedis',
        'sentTime',
        'sourceBranch',
        'status',
        'timeline',
        'trackingCode',
        'updatedAt',
      ].sort(),
    );
    expect(JSON.stringify(response)).not.toContain('Owusu');
  });

  test('masks single names and tolerates a blank receiver name', () => {
    expect(maskReceiverName('Kwame')).toBe('Kw***');
    expect(maskReceiverName('  Ama   Owusu ')).toBe('Ama O****');
    expect(maskReceiverName(maskReceiverName('Ama Owusu'))).toBe('Ama O****');
    expect(maskReceiverName(null)).toBeNull();
    expect(toPublicTrackingResponse({ ...trackingRow, receiverName: '  ' })?.receiver).toEqual({
      name: null,
    });
  });

  test('describes a rider return distinctly from a return to sender', () => {
    const response = toPublicTrackingResponse({
      ...trackingRow,
      status: ParcelStatus.RETURNED_TO_OFFICE,
      events: [
        ...trackingRow.events,
        {
          metadata: { patch: { status: ParcelStatus.RETURNED_TO_OFFICE } },
          createdAt: new Date('2026-01-02T10:00:00.000Z'),
        },
      ],
    });
    expect(response?.status.label).toBe('Returned by rider to office');
    expect(response?.timeline.at(-1)?.label).toBe('Returned by rider to office');

    const withoutAuditEvent = toPublicTrackingResponse({
      ...trackingRow,
      status: ParcelStatus.RETURNED_TO_OFFICE,
    });
    expect(withoutAuditEvent?.timeline.at(-1)?.label).toBe('Returned by rider to office');
  });
});
