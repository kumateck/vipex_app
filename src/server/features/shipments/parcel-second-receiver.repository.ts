import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/config';
import { parcelReceiverOtps, parcels } from '@/db/schemas';
import { SECOND_RECEIVER_EDITABLE_STATUSES } from '@/shared/shipments/second-receiver';

export async function getSecondReceiverCandidateRepo(parcelId: string) {
  const [row] = await db
    .select({
      id: parcels.id,
      bookingCode: parcels.bookingCode,
      companyId: parcels.companyId,
      destinationId: parcels.destinationId,
      receiverId: parcels.receiverId,
      secondReceiverId: parcels.secondReceiverId,
      secondReceiverNameSnapshot: parcels.secondReceiverNameSnapshot,
      status: parcels.status,
      isDeleted: parcels.isDeleted,
    })
    .from(parcels)
    .where(eq(parcels.id, parcelId));
  return row ?? null;
}

/**
 * Sets (or clears, with `null`) the second receiver while the parcel is still editable, clears
 * second-receiver ID card details, and expires pickup OTPs issued to the previous second
 * receiver. Returns false when the parcel changed concurrently.
 */
export async function replaceSecondReceiverRepo(input: {
  parcelId: string;
  companyId: string;
  branchId: string;
  receiverId: string;
  secondReceiverId: string | null;
}) {
  return db.transaction(async (tx) => {
    const now = new Date();
    const [updated] = await tx
      .update(parcels)
      .set({
        secondReceiverId: input.secondReceiverId,
        secondCardId: null,
        secondCardNumber: null,
        updatedAt: now,
      })
      .where(
        and(
          eq(parcels.id, input.parcelId),
          eq(parcels.companyId, input.companyId),
          eq(parcels.destinationId, input.branchId),
          eq(parcels.isDeleted, false),
          eq(parcels.receiverId, input.receiverId),
          inArray(parcels.status, [...SECOND_RECEIVER_EDITABLE_STATUSES]),
        ),
      )
      .returning({ id: parcels.id });
    if (!updated) return false;

    await tx
      .update(parcelReceiverOtps)
      .set({ expiresAt: now, verificationToken: null, verificationTokenExpiresAt: null })
      .where(
        and(
          eq(parcelReceiverOtps.parcelId, input.parcelId),
          eq(parcelReceiverOtps.targetReceiver, 'second'),
        ),
      );
    return true;
  });
}
