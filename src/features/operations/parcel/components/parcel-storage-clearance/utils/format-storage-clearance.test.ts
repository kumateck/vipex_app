import { describe, expect, it } from 'bun:test';
import { ParcelStorageClearanceStatus as Status } from '@/db/schemas/enums';
import { describeStorageClearanceStatus, isStorageClearanceActionAllowed } from '.';

describe('storage clearance status rules', () => {
  it('locks every action once a request is executed or rejected', () => {
    for (const action of ['approve', 'reject', 'return', 'execute']) {
      expect(isStorageClearanceActionAllowed(action, Status.EXECUTED)).toBe(false);
      expect(isStorageClearanceActionAllowed(action, Status.REJECTED)).toBe(false);
    }
  });

  it('only lets finance act on approved requests', () => {
    expect(isStorageClearanceActionAllowed('execute', Status.APPROVED_FOR_FINANCE)).toBe(true);
    expect(isStorageClearanceActionAllowed('execute', Status.PENDING_APPROVAL)).toBe(false);
    expect(isStorageClearanceActionAllowed('approve', Status.PENDING_APPROVAL)).toBe(true);
  });

  it('explains whether storage is still owed', () => {
    expect(describeStorageClearanceStatus(Status.APPROVED_FOR_FINANCE)).toContain('still owed');
    expect(describeStorageClearanceStatus(Status.EXECUTED)).toContain('removed');
  });
});
