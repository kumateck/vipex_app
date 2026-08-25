import { and, eq, inArray, lt } from 'drizzle-orm';
import { db } from '@/db/config';
import { selfServiceBookingDrafts } from '@/db/schemas';
import { SelfServiceDraftStatus } from '@/db/schemas/enums';

export async function createSelfServiceDraftRepo(
  values: typeof selfServiceBookingDrafts.$inferInsert,
) {
  const [row] = await db.insert(selfServiceBookingDrafts).values(values).returning();
  return row ?? null;
}

export async function getSelfServiceDraftRepo(id: string, companyId: string) {
  const [row] = await db
    .select()
    .from(selfServiceBookingDrafts)
    .where(
      and(eq(selfServiceBookingDrafts.id, id), eq(selfServiceBookingDrafts.companyId, companyId)),
    )
    .limit(1);
  return row ?? null;
}

export async function listSelfServiceDraftsForBranchRepo(input: {
  companyId: string;
  branchId: string;
  statuses: number[];
}) {
  return db
    .select()
    .from(selfServiceBookingDrafts)
    .where(
      and(
        eq(selfServiceBookingDrafts.companyId, input.companyId),
        eq(selfServiceBookingDrafts.branchId, input.branchId),
        inArray(selfServiceBookingDrafts.status, input.statuses),
      ),
    )
    .orderBy(selfServiceBookingDrafts.createdAt);
}

// Atomic conditional claim: only succeeds if the draft is still PENDING, so
// two agents opening the same draft at once can't both claim it.
export async function claimSelfServiceDraftRepo(input: {
  id: string;
  companyId: string;
  claimedBy: string;
}) {
  const [row] = await db
    .update(selfServiceBookingDrafts)
    .set({
      status: SelfServiceDraftStatus.CLAIMED,
      claimedBy: input.claimedBy,
      claimedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(selfServiceBookingDrafts.id, input.id),
        eq(selfServiceBookingDrafts.companyId, input.companyId),
        eq(selfServiceBookingDrafts.status, SelfServiceDraftStatus.PENDING),
      ),
    )
    .returning();
  return row ?? null;
}

export async function markSelfServiceDraftCompletedRepo(input: {
  id: string;
  completedBy: string;
  bookingId: string;
  parcelId: string;
}) {
  const [row] = await db
    .update(selfServiceBookingDrafts)
    .set({
      status: SelfServiceDraftStatus.COMPLETED,
      completedBy: input.completedBy,
      completedAt: new Date(),
      bookingId: input.bookingId,
      parcelId: input.parcelId,
      updatedAt: new Date(),
    })
    .where(eq(selfServiceBookingDrafts.id, input.id))
    .returning();
  return row ?? null;
}

export async function cancelSelfServiceDraftRepo(input: {
  id: string;
  companyId: string;
  cancelledBy: string;
  reason: string;
}) {
  const [row] = await db
    .update(selfServiceBookingDrafts)
    .set({
      status: SelfServiceDraftStatus.CANCELLED,
      cancelledBy: input.cancelledBy,
      cancelledAt: new Date(),
      cancelReason: input.reason,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(selfServiceBookingDrafts.id, input.id),
        eq(selfServiceBookingDrafts.companyId, input.companyId),
      ),
    )
    .returning();
  return row ?? null;
}

// Hard-deletes drafts that were never completed and whose TTL has passed.
// Called on a background interval (see expiry-sweep.ts) and defensively
// before listing the agent queue.
export async function deleteExpiredSelfServiceDraftsRepo(): Promise<number> {
  const deleted = await db
    .delete(selfServiceBookingDrafts)
    .where(
      and(
        inArray(selfServiceBookingDrafts.status, [
          SelfServiceDraftStatus.PENDING,
          SelfServiceDraftStatus.CLAIMED,
        ]),
        lt(selfServiceBookingDrafts.expiresAt, new Date()),
      ),
    )
    .returning({ id: selfServiceBookingDrafts.id });
  return deleted.length;
}
