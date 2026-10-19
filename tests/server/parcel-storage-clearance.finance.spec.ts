import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { auditLogs, journalLines, parcels, parcelStorageWaivers } from '@/db/schemas';
import { ParcelStorageClearanceStatus as Status } from '@/db/schemas/enums';
import {
  createParcelStorageClearanceSvc as create,
  approveParcelStorageClearanceSvc as approve,
} from '@/server/features/shipments/parcel-storage-clearance.service';
import { executeParcelStorageClearanceSvc as execute } from '@/server/features/shipments/parcel-storage-clearance-execution.service';
import { getParcelStorageClearanceRepo as getRequest } from '@/server/features/shipments/parcel-storage-clearance.repository';
import { createStorageClearanceFixture } from '../utils/storage-clearance/fixture';

describe('Finance storage clearance transactions', () => {
  let fixture: Awaited<ReturnType<typeof createStorageClearanceFixture>>;
  beforeAll(async () => {
    fixture = await createStorageClearanceFixture();
  });
  afterAll(async () => {
    await fixture?.cleanup();
  });
  const approvedRequest = async () => {
    const parcel = await fixture.parcel();
    const request = await create({
      companyId: fixture.companyId,
      parcelId: parcel.id,
      actorUserId: fixture.requester,
      requestedDays: 2,
      reason: 'Staff failed to notify receiver',
    });
    await approve({
      companyId: fixture.companyId,
      requestId: request.id,
      actorUserId: fixture.approver,
    });
    return { parcel, request };
  };
  const financeInput = (requestId: string) => ({
    companyId: fixture.companyId,
    requestId,
    actorUserId: fixture.finance,
  });

  test('missing accounting setup rolls back waiver, audit and execution status', async () => {
    await fixture.accounting(false);
    const { parcel, request } = await approvedRequest();
    await expect(execute(financeInput(request.id))).rejects.toThrow('1300');
    expect((await getRequest(request.id))?.status).toBe(Status.APPROVED_FOR_FINANCE);
    expect((await getRequest(request.id))?.executedAt).toBeNull();
    expect(
      await db
        .select()
        .from(parcelStorageWaivers)
        .where(eq(parcelStorageWaivers.parcelId, parcel.id)),
    ).toHaveLength(0);
    expect(
      await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.entityId, request.id),
            eq(auditLogs.action, 'PARCEL_STORAGE_CLEARANCE_EXECUTED'),
          ),
        ),
    ).toHaveLength(0);
    expect(
      await db.select().from(journalLines).where(eq(journalLines.companyId, fixture.companyId)),
    ).toHaveLength(0);
  });

  test('concurrent execution creates one waiver and one balanced journal without reprocessing parcel', async () => {
    await fixture.accounting(true);
    const { parcel, request } = await approvedRequest();
    const results = await Promise.allSettled([
      execute(financeInput(request.id)),
      execute(financeInput(request.id)),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    const waivers = await db
      .select()
      .from(parcelStorageWaivers)
      .where(eq(parcelStorageWaivers.parcelId, parcel.id));
    expect(waivers).toHaveLength(1);
    expect(waivers[0]?.waivedAmountPsw).toBe(400);
    const completed = await getRequest(request.id);
    expect(completed?.status).toBe(Status.EXECUTED);
    expect(completed?.accountingJournalEntryId).toBeTruthy();
    const lines = await db
      .select()
      .from(journalLines)
      .where(eq(journalLines.entryId, completed!.accountingJournalEntryId!));
    expect(lines).toHaveLength(2);
    expect(lines.reduce((total, line) => total + line.debitPsw, 0)).toBe(400);
    expect(lines.reduce((total, line) => total + line.creditPsw, 0)).toBe(400);
    expect(
      await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.entityId, request.id),
            eq(auditLogs.action, 'PARCEL_STORAGE_CLEARANCE_EXECUTED'),
          ),
        ),
    ).toHaveLength(1);
    const [after] = await db.select().from(parcels).where(eq(parcels.id, parcel.id));
    expect(after?.status).toBe(parcel.status);
    expect(after?.chargePsw).toBe(parcel.chargePsw);
    expect(after?.confirmedAt).toBeNull();
    expect(after?.updatedAt).toEqual(parcel.updatedAt);
  });
});
