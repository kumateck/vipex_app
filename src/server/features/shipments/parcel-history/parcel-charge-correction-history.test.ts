import { describe, expect, test } from 'bun:test';
import { mapAuditEntry, type AuditEntry } from './parcel-history-audit';
import { toParcelHistoryEvents } from './parcel-history.service';

const make = (action: string, metadata: unknown): AuditEntry => ({
  id: 'audit1',
  entityType: 'parcel',
  action,
  metadata,
  message: null,
  actorUserId: 'approver',
  createdAt: new Date('2026-10-26T15:00:00Z'),
});
describe('readable charge correction history', () => {
  test('requested changes show proposed values and reason without claiming they were applied', () => {
    const [event] = mapAuditEntry(
      make('PARCEL_CHARGE_CORRECTION_REQUESTED', {
        chargePsw: 5000,
        previousChargePsw: 0,
        originalMethod: 0,
        reason: 'Missed charge at booking',
        customerName: 'Sender Business',
        requestId: 'request1',
      }),
    );
    expect(event!.title).toBe('Charge correction requested');
    for (const value of [
      'GHS 0.00 → GHS 50.00',
      'Cash → CREDIT',
      'Missed charge at booking',
      'Awaiting approval',
      'Sender Business',
      'request1',
    ])
      expect(event!.description).toContain(value);
  });
  test('approved history retains before/after, request reason, approval note and both actors', () => {
    const drafts = mapAuditEntry(
      make('PARCEL_ZERO_CHARGE_CORRECTION_APPROVED', {
        chargePsw: 5000,
        previousChargePsw: 0,
        originalMethod: 0,
        reason: 'Agreed charge was omitted',
        reviewNote: 'Confirmed against booking receipt',
        requestedBy: 'requester',
      }),
    );
    const [event] = toParcelHistoryEvents(
      drafts,
      { requester: 'Booking staff', approver: 'Finance approver' },
      {},
    );
    expect(event).toMatchObject({
      title: 'Charge correction approved and applied',
      actorName: 'Finance approver',
      occurredAt: '2026-10-26T15:00:00.000Z',
    });
    for (const value of [
      'Requested by: Booking staff',
      'GHS 0.00 → GHS 50.00',
      'Cash → CREDIT',
      'Agreed charge was omitted',
      'Confirmed against booking receipt',
    ])
      expect(event!.description).toContain(value);
  });
  test('rejection preserves request reason and rejection reason and says no change took effect', () => {
    const [event] = mapAuditEntry(
      make('PARCEL_CHARGE_CORRECTION_REJECTED', {
        chargePsw: 5000,
        originalMethod: 0,
        reason: 'Original request reason',
        reviewNote: 'Amount is not supported',
        requestedBy: 'requester',
      }),
    );
    expect(event!.title).toBe('Charge correction rejected');
    expect(event!.description).toContain('Original request reason');
    expect(event!.description).toContain('Rejection reason: Amount is not supported');
    expect(event!.description).toContain('Parcel charge and debt were not changed');
  });
});
