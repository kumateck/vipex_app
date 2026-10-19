import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { parcelStorageWaivers, parcels } from '@/db/schemas';
import { ParcelStorageClearanceStatus as Status } from '@/db/schemas/enums';
import {
  createParcelStorageClearanceSvc as create,
  approveParcelStorageClearanceSvc as approve,
  resubmitParcelStorageClearanceSvc as resubmit,
  rejectParcelStorageClearanceSvc as reject,
  returnParcelStorageClearanceForReviewSvc as returnForReview,
} from '@/server/features/shipments/parcel-storage-clearance.service';
import { executeParcelStorageClearanceSvc as execute } from '@/server/features/shipments/parcel-storage-clearance-execution.service';
import { getParcelStorageClearanceRepo as getRequest } from '@/server/features/shipments/parcel-storage-clearance.repository';
import { getParcelStorageClearanceDetailSvc as detail } from '@/server/features/shipments/parcel-storage-clearance-detail.service';
import { createStorageClearanceFixture, receivedDate } from '../utils/storage-clearance/fixture';

describe('storage clearance lifecycle', () => {
  let fixture: Awaited<ReturnType<typeof createStorageClearanceFixture>>;
  beforeAll(async () => {
    fixture = await createStorageClearanceFixture();
  });
  afterAll(async () => {
    await fixture?.cleanup();
  });
  const requestInput = (parcelId: string) => ({
    companyId: fixture.companyId,
    branchId: fixture.branchId,
    parcelId,
    actorUserId: fixture.requester,
    requestedDays: 2,
    reason: 'Staff delayed notification',
    evidenceUrl: 'https://example.test/case/1',
  });
  const actionInput = (requestId: string, actorUserId = fixture.finance) => ({
    companyId: fixture.companyId,
    branchId: fixture.branchId,
    requestId,
    actorUserId,
  });

  test('above-accrual days pass human review; return and resubmit require fresh approval', async () => {
    const parcel = await fixture.parcel();
    const request = await create({ ...requestInput(parcel.id), requestedDays: 9 });
    expect((await getRequest(request.id))?.status).toBe(Status.PENDING_APPROVAL);
    expect(
      await db
        .select()
        .from(parcelStorageWaivers)
        .where(eq(parcelStorageWaivers.parcelId, parcel.id)),
    ).toHaveLength(0);
    await expect(create(requestInput(parcel.id))).rejects.toThrow('already has an open');
    await expect(approve(actionInput(request.id, fixture.requester))).rejects.toThrow(
      'requester cannot approve',
    );
    await approve(actionInput(request.id, fixture.approver));
    await expect(execute(actionInput(request.id))).rejects.toThrow('exceed outstanding');
    await returnForReview({ ...actionInput(request.id), note: 'Please review the number of days' });
    await expect(
      resubmit({ ...requestInput(parcel.id), ...actionInput(request.id, fixture.approver) }),
    ).rejects.toThrow('original requester');
    await resubmit({ ...requestInput(parcel.id), ...actionInput(request.id, fixture.requester) });
    const revised = await getRequest(request.id);
    expect(revised?.status).toBe(Status.PENDING_APPROVAL);
    expect(revised?.approvedAt).toBeNull();
    await expect(execute(actionInput(request.id))).rejects.toThrow('Only approved');
    await approve(actionInput(request.id, fixture.approver));
    await expect(execute(actionInput(request.id, fixture.requester))).rejects.toThrow(
      'requester cannot execute',
    );
    await execute(actionInput(request.id));
    const current = await detail({ id: request.id, companyId: fixture.companyId });
    expect(current.outstandingPsw).toBe(600);
    expect(current.accruedDays).toBe(3);
    expect(current.remainingDays).toBe(3);
    expect(current.history.map((event) => event.action)).toEqual([
      'PARCEL_STORAGE_CLEARANCE_REQUESTED',
      'PARCEL_STORAGE_CLEARANCE_APPROVED',
      'PARCEL_STORAGE_CLEARANCE_RETURNED_FOR_REVIEW',
      'PARCEL_STORAGE_CLEARANCE_RESUBMITTED',
      'PARCEL_STORAGE_CLEARANCE_APPROVED',
      'PARCEL_STORAGE_CLEARANCE_EXECUTED',
    ]);
  });

  test('rejection closes the request and allows a fresh request', async () => {
    const parcel = await fixture.parcel();
    const request = await create(requestInput(parcel.id));
    await reject({
      ...actionInput(request.id, fixture.approver),
      note: 'Insufficient justification',
    });
    await expect(execute(actionInput(request.id))).rejects.toThrow('Only approved');
    const next = await create(requestInput(parcel.id));
    expect(next.id).not.toBe(request.id);
  });

  test('no unpaid accrual, wrong company and unrelated branch cannot request clearance', async () => {
    const fresh = await fixture.parcel(0);
    await expect(create(requestInput(fresh.id))).rejects.toThrow('no accrued');
    const parcel = await fixture.parcel();
    await expect(create({ ...requestInput(parcel.id), companyId: createId() })).rejects.toThrow(
      'Parcel not found',
    );
    await expect(create({ ...requestInput(parcel.id), branchId: createId() })).rejects.toThrow(
      'Parcel not found',
    );
    await db.update(parcels).set({ isDeleted: true }).where(eq(parcels.id, parcel.id));
    await expect(create(requestInput(parcel.id))).rejects.toThrow('Parcel not found');
  });

  test('Clear All uses remaining unpaid days, and new accrual requires review', async () => {
    const parcel = await fixture.parcel();
    const first = await create(requestInput(parcel.id));
    await approve(actionInput(first.id, fixture.approver));
    await execute(actionInput(first.id));
    const all = await create({ ...requestInput(parcel.id), clearAll: true });
    expect((await getRequest(all.id))?.requestedDays).toBe(3);
    expect((await getRequest(all.id))?.requestedAmountPsw).toBe(600);
    await db
      .update(parcels)
      .set({ receivedAt: receivedDate(6) })
      .where(eq(parcels.id, parcel.id));
    await approve(actionInput(all.id, fixture.approver));
    await expect(execute(actionInput(all.id))).rejects.toThrow('out of date');
    await returnForReview({ ...actionInput(all.id), note: 'Clear the current remaining balance' });
    await resubmit({
      ...requestInput(parcel.id),
      ...actionInput(all.id, fixture.requester),
      clearAll: true,
    });
    expect((await getRequest(all.id))?.requestedDays).toBe(4);
    await approve(actionInput(all.id, fixture.approver));
    await execute(actionInput(all.id));
    expect((await detail({ id: all.id, companyId: fixture.companyId })).outstandingPsw).toBe(0);
    await expect(create(requestInput(parcel.id))).rejects.toThrow('no accrued');
    await db
      .update(parcels)
      .set({ receivedAt: receivedDate(7) })
      .where(eq(parcels.id, parcel.id));
    expect((await detail({ id: all.id, companyId: fixture.companyId })).outstandingPsw).toBe(200);
  });
});
