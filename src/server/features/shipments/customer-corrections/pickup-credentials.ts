import { and, eq, gt, inArray, isNotNull, or } from 'drizzle-orm';
import { parcelReceiverOtps, parcels } from '@/db/schemas';
import type { CorrectionTransaction } from './repository';

export async function invalidateCustomerPickupCredentials(
  tx: CorrectionTransaction,
  companyId: string,
  customerId: string,
) {
  const scope = and(
    eq(parcels.companyId, companyId),
    eq(parcels.isDeleted, false),
    or(eq(parcels.receiverId, customerId), eq(parcels.secondReceiverId, customerId)),
  );
  const affected = await tx
    .select({
      id: parcels.id,
      receiverId: parcels.receiverId,
      secondReceiverId: parcels.secondReceiverId,
    })
    .from(parcels)
    .where(scope);
  await tx
    .update(parcels)
    .set({ pendingReceiverHandover: null, updatedAt: new Date() })
    .where(and(scope, isNotNull(parcels.pendingReceiverHandover)));
  const now = new Date();
  const mainIds = affected.filter((row) => row.receiverId === customerId).map((row) => row.id);
  const secondIds = affected
    .filter((row) => row.secondReceiverId === customerId)
    .map((row) => row.id);
  await tx
    .update(parcelReceiverOtps)
    .set({
      expiresAt: now,
      verificationToken: null,
      verificationTokenExpiresAt: null,
    })
    .where(
      and(
        eq(parcelReceiverOtps.companyId, companyId),
        or(
          and(
            eq(parcelReceiverOtps.targetReceiver, 'main'),
            inArray(parcelReceiverOtps.parcelId, mainIds),
          ),
          and(
            eq(parcelReceiverOtps.targetReceiver, 'second'),
            inArray(parcelReceiverOtps.parcelId, secondIds),
          ),
        ),
        or(gt(parcelReceiverOtps.expiresAt, now), isNotNull(parcelReceiverOtps.verificationToken)),
      ),
    );
  return affected.length;
}

export async function invalidateParcelPickupCredentials(
  tx: CorrectionTransaction,
  parcelId: string,
) {
  await tx
    .update(parcelReceiverOtps)
    .set({
      expiresAt: new Date(),
      verificationToken: null,
      verificationTokenExpiresAt: null,
    })
    .where(eq(parcelReceiverOtps.parcelId, parcelId));
}
