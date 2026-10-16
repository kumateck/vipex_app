import { describe, expect, test } from 'bun:test';
import { ParcelStatus } from '@/db/schemas/enums';
import { isArrivalAudit, mapAuditEntry, type AuditEntry } from './parcel-history-audit';

const at = new Date('2026-09-30T06:55:16.000Z');
const entry = (action: string, metadata: unknown, extra: Partial<AuditEntry> = {}): AuditEntry => ({
  id: 'a1',
  entityType: 'parcel',
  action,
  message: null,
  metadata,
  actorUserId: 'user-1',
  createdAt: at,
  ...extra,
});

describe('parcel history: audit entries', () => {
  test('turns a status patch into a readable status change with the previous status', () => {
    const [draft] = mapAuditEntry(
      entry('PARCEL_UPDATED', {
        patch: { status: ParcelStatus.ARRIVED_AT_DESTINATION },
        previous: { status: ParcelStatus.IN_TRANSIT },
      }),
    );
    expect(draft).toMatchObject({
      category: 'status',
      title: 'Status changed to Arrived at Destination',
      description: 'From In Transit',
      actorId: 'user-1',
    });
  });

  test('splits a combined patch into a status change and an edit', () => {
    const drafts = mapAuditEntry(
      entry('PARCEL_UPDATED', {
        patch: {
          status: ParcelStatus.AWAITING_PICKUP,
          parcelDetails: '1WEB',
          pickupLocationId: 'loc',
        },
      }),
    );
    expect(drafts.map((draft) => draft.category)).toEqual(['status', 'edit']);
    expect(drafts[1]?.description).toBe('Parcel details: 1WEB • Pickup location changed');
    expect(new Set(drafts.map((draft) => draft.id)).size).toBe(2);
  });

  test('names the assigned picker as the subject', () => {
    const [draft] = mapAuditEntry(
      entry('PARCEL_SHELF_PICKER_ASSIGNED', { pickerStaffId: 'picker-9' }),
    );
    expect(draft?.subject).toEqual({ label: 'Picker', userId: 'picker-9' });
  });

  test('keeps deletions with their reason', () => {
    const [draft] = mapAuditEntry(entry('PARCEL_SOFT_DELETED', { reason: 'PAID NOT TBP' }));
    expect(draft).toMatchObject({ title: 'Parcel deleted', description: 'Reason: PAID NOT TBP' });
  });

  test('skips actions whose own table already supplies the history entry', () => {
    for (const action of [
      'PAYMENT_CREATED',
      'PARCEL_STORAGE_WAIVED',
      'PARCEL_DISCREPANCY_LOGGED',
      'PARCEL_INTERNAL_TRANSFER_CREATED',
    ]) {
      expect(mapAuditEntry(entry(action, {}))).toEqual([]);
    }
  });

  test('never drops an unknown action: uses the audit message or a humanized code', () => {
    expect(
      mapAuditEntry(entry('PARCEL_SOMETHING_NEW', {}, { message: 'Something new happened' }))[0]
        ?.title,
    ).toBe('Something new happened');
    expect(mapAuditEntry(entry('PARCEL_SOMETHING_NEW', {}))[0]?.title).toBe('Parcel something new');
  });

  test('recognises arrival from a status patch or a bulk receive', () => {
    expect(
      isArrivalAudit(
        entry('PARCEL_UPDATED', { patch: { status: ParcelStatus.ARRIVED_AT_DESTINATION } }),
      ),
    ).toBe(true);
    expect(isArrivalAudit(entry('PARCELS_BULK_RECEIVED', { parcelIds: ['p'] }))).toBe(true);
    expect(
      isArrivalAudit(entry('PARCEL_UPDATED', { patch: { status: ParcelStatus.AWAITING_PICKUP } })),
    ).toBe(false);
  });
});
