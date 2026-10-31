import { describe, expect, test } from 'bun:test';
import { planReceivingWorkflow } from './plan';
import type { WorkflowEvidence, WorkflowParcel } from './types';

const parcel: WorkflowParcel = {
  id: 'parcel',
  booking_code: 'BOOK1',
  destination_id: 'destination',
  pickup_location_id: null,
  status: 3,
  received_at: null,
  confirmed_at: null,
  deleted_at: null,
  call_center_assigned_to_user_id: null,
  call_center_called_at: null,
  updated_at: new Date('2026-10-21T08:14:24Z'),
};
const evidence: WorkflowEvidence = {
  locations: [{ id: 'circle', name: 'Circle' }],
  latestStatusChange: null,
  deliveries: [],
};
const called = {
  ...parcel,
  pickup_location_id: 'circle',
  call_center_called_at: new Date('2026-10-21T07:17:34Z'),
};
const regression = {
  id: 'regression',
  previous_status: '5',
  next_status: '3',
  created_at: new Date('2026-10-21T08:14:24Z'),
};

describe('receiving workflow repair plan', () => {
  test('missing location uses only one eligible destination location and retains arrival status', () => {
    expect(planReceivingWorkflow(parcel, evidence)).toMatchObject({
      restriction: null,
      changes: { pickupLocationId: 'circle' },
      after: { pickupLocationId: 'circle', status: 3 },
      needsRepair: true,
    });
  });
  test('multiple receiving locations require an explicit choice and existing locations are retained', () => {
    const options = {
      ...evidence,
      locations: [...evidence.locations, { id: 'other', name: 'Other' }],
    };
    expect(planReceivingWorkflow(parcel, options).restriction).toContain('unique');
    expect(planReceivingWorkflow(parcel, options, 'other').after.pickupLocationId).toBe('other');
    expect(planReceivingWorkflow(parcel, options, 'foreign').restriction).toContain('destination');
    expect(
      planReceivingWorkflow({ ...parcel, pickup_location_id: 'circle' }, options, 'other')
        .restriction,
    ).toContain('never replaces');
  });
  test('only a recorded pickup regression after the call restores Awaiting Pickup', () => {
    expect(
      planReceivingWorkflow(called, { ...evidence, latestStatusChange: regression }),
    ).toMatchObject({ restriction: null, changes: { status: 5 } });
    for (const change of [
      null,
      { ...regression, previous_status: '2' },
      { ...regression, next_status: '7' },
      { ...regression, created_at: new Date('2026-10-21T06:00:00Z') },
    ]) {
      expect(
        planReceivingWorkflow(called, { ...evidence, latestStatusChange: change }).restriction,
      ).toContain('no matching');
    }
    expect(
      planReceivingWorkflow(parcel, { ...evidence, latestStatusChange: regression }).after.status,
    ).toBe(3);
  });
  test('already-repaired parcels require no change', () => {
    expect(planReceivingWorkflow({ ...called, status: 5 }, evidence)).toMatchObject({
      restriction: null,
      needsRepair: false,
      changes: {},
    });
  });
  test('completed, deleted, progressed and active delivery parcels are blocked', () => {
    for (const patch of [
      { confirmed_at: new Date() },
      { deleted_at: new Date() },
      ...[0, 1, 2, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((status) => ({ status })),
    ]) {
      expect(planReceivingWorkflow({ ...parcel, ...patch }, evidence).restriction).toBeTruthy();
    }
    const delivery = {
      id: 'delivery',
      mode: 1,
      status: 'QUEUED',
      delivered_at: null,
      confirmed_at: null,
      rider_completed_at: null,
    };
    for (const patch of [
      {},
      { mode: 0, delivered_at: new Date() },
      { mode: 0, rider_completed_at: new Date() },
      { mode: 0, confirmed_at: new Date() },
      { mode: 0, status: 'DELIVERED' },
    ]) {
      expect(
        planReceivingWorkflow(parcel, { ...evidence, deliveries: [{ ...delivery, ...patch }] })
          .restriction,
      ).toContain('handover');
    }
    expect(
      planReceivingWorkflow(parcel, {
        ...evidence,
        deliveries: [{ ...delivery, status: 'RETURNED_TO_OFFICE' }],
      }).restriction,
    ).toBeNull();
  });
});
