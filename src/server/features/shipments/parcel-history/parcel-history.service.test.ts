import { describe, expect, test } from 'bun:test';
import { DeliveryMode } from '@/db/schemas/enums';
import { mapDeliveries, mapParcelRecord } from './parcel-history-records';
import { toParcelHistoryEvents } from './parcel-history.service';

const parcel = {
  id: 'p1',
  sourceId: 'b-src',
  destinationId: 'b-dst',
  createdAt: new Date('2026-09-29T16:44:00Z'),
  createdBy: 'creator',
  receivedAt: new Date('2026-09-30T06:55:00Z'),
  receivedBy: null,
  confirmedAt: null,
  confirmedBy: null,
  isDeleted: false,
  deletedAt: null,
  deletedBy: null,
  deleteReason: null,
};

describe('parcel history: records and resolution', () => {
  test('omits the generic received entry when an audit arrival already covers it', () => {
    const ids = (hasArrivalEvent: boolean) =>
      mapParcelRecord(parcel, { hasArrivalEvent, hasDeletionEvent: false }).map(
        (draft) => draft.id,
      );
    expect(ids(false)).toContain('parcel:received');
    expect(ids(true)).not.toContain('parcel:received');
  });

  test('records each home-delivery step with the rider named', () => {
    const drafts = mapDeliveries([
      {
        id: 'd1',
        mode: DeliveryMode.DOORSTEP,
        status: 'DELIVERED_AT_HOME',
        dropoffAddress: 'SPINTEX',
        chargePsw: 5000,
        createdAt: new Date('2026-10-05T09:52:00Z'),
        createdBy: 'desk',
        riderUserId: 'rider-1',
        riderAssignedAt: new Date('2026-10-06T09:34:00Z'),
        riderCompletedAt: new Date('2026-10-06T21:55:00Z'),
        returnedAt: null,
        riderCollectedPrincipalPsw: 0,
        riderCollectedDeliveryFeePsw: 5000,
        riderCollectionRecordedAt: null,
        receiverCalledConfirmedBy: null,
        receiverCalledConfirmedAt: null,
        deliveredAt: new Date('2026-10-06T22:41:00Z'),
        confirmedBy: 'cashier',
        confirmedAt: new Date('2026-10-06T22:41:00Z'),
      },
    ]);
    expect(drafts.map((draft) => draft.title)).toEqual([
      'Home delivery set up',
      'Rider assigned',
      'Rider handed parcel to customer',
      'Delivered at home',
      'Delivery confirmed',
    ]);
    expect(drafts.find((draft) => draft.title === 'Rider assigned')?.subject?.userId).toBe(
      'rider-1',
    );
  });

  test('resolves names, flags unknown users, prefixes the subject and sorts by time', () => {
    const events = toParcelHistoryEvents(
      [
        {
          id: 'b',
          occurredAt: new Date('2026-10-06T10:00:00Z'),
          category: 'delivery',
          title: 'Rider assigned',
          subject: { label: 'Rider', userId: 'rider-1' },
        },
        {
          id: 'a',
          occurredAt: new Date('2026-10-05T10:00:00Z'),
          category: 'created',
          title: 'Parcel booked',
          actorId: 'gone',
          branchId: 'b-src',
          description: 'note',
        },
      ],
      { 'rider-1': 'Evans Kwame Asamoah' },
      { 'b-src': 'Kumasi' },
    );
    expect(events.map((event) => event.id)).toEqual(['a', 'b']);
    expect(events[0]).toMatchObject({
      actorName: 'Unknown user',
      branchName: 'Kumasi',
      description: 'note',
    });
    expect(events[1]).toMatchObject({ actorName: null, description: 'Rider: Evans Kwame Asamoah' });
  });
});
