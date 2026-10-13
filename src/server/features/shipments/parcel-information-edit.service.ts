import { and, eq, ne, or } from 'drizzle-orm';
import { db } from '@/db/config';
import { auditLogs, customers, parcels } from '@/db/schemas';
import type { ParcelInformationEdit } from '@/shared/shipments/parcel-information-edit';
import { BadRequest, Conflict, NotFound } from '../../utils/http-error';

export async function editParcelInformationSvc(
  input: ParcelInformationEdit & { companyId: string; branchId: string; actorUserId: string },
) {
  if (!input.companyId || !input.branchId) throw BadRequest('Company and branch are required');
  const fullname = input.receiver?.fullname?.trim();
  if (fullname !== undefined && (!fullname || fullname.length > 255)) {
    throw BadRequest('Receiver name must contain 1 to 255 characters');
  }
  const telephone = input.receiver?.telephone;
  if (telephone != null && !/^\d{10}$/.test(telephone)) {
    throw BadRequest('Receiver telephone must be exactly 10 digits');
  }
  if (input.parcelDetails !== undefined && !input.parcelDetails.trim()) {
    throw BadRequest('Parcel details is required');
  }

  return db.transaction(async (tx) => {
    const [parcel] = await tx
      .select()
      .from(parcels)
      .where(
        and(
          eq(parcels.id, input.id),
          eq(parcels.companyId, input.companyId),
          eq(parcels.destinationId, input.branchId),
          eq(parcels.isDeleted, false),
        ),
      )
      .for('update');
    if (!parcel) throw NotFound('Parcel not found at your branch');
    if (input.receiver && input.receiver.id !== parcel.receiverId) {
      throw Conflict('Parcel receiver changed; reload and try again');
    }

    if (input.receiver) {
      const [customer] = await tx
        .select()
        .from(customers)
        .where(
          and(
            eq(customers.id, parcel.receiverId),
            eq(customers.companyId, input.companyId),
            eq(customers.isDeleted, false),
          ),
        )
        .for('update');
      if (!customer) throw NotFound('Receiver customer not found');
      if (telephone && telephone === customer.telephone2) {
        throw BadRequest('Primary and secondary telephone cannot be the same');
      }
      if (telephone) {
        const [duplicate] = await tx
          .select({ id: customers.id })
          .from(customers)
          .where(
            and(
              eq(customers.companyId, input.companyId),
              eq(customers.isDeleted, false),
              ne(customers.id, customer.id),
              or(eq(customers.telephone, telephone), eq(customers.telephone2, telephone)),
            ),
          )
          .limit(1);
        if (duplicate)
          throw Conflict('A customer with this telephone already exists in this company');
      }
      if (fullname !== undefined || telephone !== undefined) {
        await tx
          .update(customers)
          .set({ fullname, telephone })
          .where(eq(customers.id, customer.id));
        await tx.insert(auditLogs).values({
          companyId: input.companyId,
          actorUserId: input.actorUserId,
          entityType: 'customer',
          entityId: customer.id,
          action: 'CUSTOMER_UPDATED',
          message: 'Customer updated from parcel edit',
          metadata: { parcelId: parcel.id, patch: { fullname, telephone } },
        });
      }
    }
    const [updated] = await tx
      .update(parcels)
      .set({
        parcelDetails: input.parcelDetails?.trim(),
        parcelContent: input.parcelContent?.trim(),
        receiverNameSnapshot: fullname,
        updatedAt: new Date(),
      })
      .where(eq(parcels.id, parcel.id))
      .returning({ receiverName: parcels.receiverNameSnapshot });
    if (fullname !== undefined && updated?.receiverName !== fullname) {
      throw Conflict('Receiver name correction could not be saved; contact support');
    }
    await tx.insert(auditLogs).values({
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      entityType: 'parcel',
      entityId: parcel.id,
      action: 'PARCEL_INFORMATION_UPDATED',
      message: `Parcel information updated for ${parcel.bookingCode}`,
      metadata: { previousReceiverName: parcel.receiverNameSnapshot, patch: input },
    });
    return { id: parcel.id };
  });
}
