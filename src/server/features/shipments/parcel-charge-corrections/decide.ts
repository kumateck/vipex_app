import { PermissionKeys } from '@/shared/permissions/constants';
import { assertChargePermission } from './access';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import {
  auditLogs,
  customerCreditTransactions,
  parcelChargeCorrections,
  parcels,
  users,
} from '@/db/schemas';
import { BadRequest, Conflict, NotFound } from '@/server/utils/http-error';
import { assertAvailableCredit, lockZeroChargeParcel } from './policy';

export async function decideCreditChargeSvc(input: {
  companyId: string;
  requestId: string;
  actorUserId: string;
  approve: boolean;
  note?: string;
}) {
  await assertChargePermission(input.companyId, input.actorUserId, [
    PermissionKeys.CanApproveParcelCharge,
  ]);
  const note = input.note?.trim() || null;
  if (note && note.length > 500) throw BadRequest('Review note cannot exceed 500 characters');
  if (!input.approve && (!note || note.length < 3))
    throw BadRequest('A rejection reason is required');
  return db.transaction(async (tx) => {
    await assertChargePermission(
      input.companyId,
      input.actorUserId,
      [PermissionKeys.CanApproveParcelCharge],
      tx,
    );
    const [request] = await tx
      .select()
      .from(parcelChargeCorrections)
      .where(
        and(
          eq(parcelChargeCorrections.id, input.requestId),
          eq(parcelChargeCorrections.companyId, input.companyId),
        ),
      )
      .for('update');
    if (!request) throw NotFound('Charge correction request not found');
    if (request.status !== 0) throw Conflict('This charge correction has already been reviewed');
    if (request.requestedBy === input.actorUserId)
      throw Conflict('The requester cannot approve or reject their own charge correction');
    if (input.approve) {
      const { parcel, customer } = await lockZeroChargeParcel(
        tx,
        input.companyId,
        request.parcelId,
        request.customerId,
      );
      if (parcel.method !== request.originalMethod)
        throw Conflict(
          'The parcel payment method changed. Reject the request and submit a fresh correction.',
        );
      const [requester] = await tx
        .select({ status: users.status })
        .from(users)
        .where(and(eq(users.id, request.requestedBy), eq(users.companyId, input.companyId)));
      if (!requester || requester.status !== 0)
        throw Conflict('The requesting staff member is no longer active');
      await assertAvailableCredit(
        tx,
        input.companyId,
        customer.id,
        customer.creditLimitPsw,
        request.chargePsw,
      );
      const [credit] = await tx
        .insert(customerCreditTransactions)
        .values({
          companyId: input.companyId,
          customerId: customer.id,
          sourceType: 0,
          transactionType: 0,
          referenceId: parcel.id,
          signedAmountPsw: request.chargePsw,
          notes: `Approved zero-charge correction for ${parcel.bookingCode}: ${request.reason}`,
          createdBy: input.actorUserId,
        })
        .returning({ id: customerCreditTransactions.id });
      await tx
        .update(parcels)
        .set({
          chargePsw: request.chargePsw,
          method: 4,
          plannedToBePaidPsw: 0,
          updatedAt: new Date(),
        })
        .where(eq(parcels.id, parcel.id));
      await tx.insert(auditLogs).values({
        companyId: input.companyId,
        actorUserId: input.actorUserId,
        entityType: 'parcel',
        entityId: parcel.id,
        action: 'PARCEL_ZERO_CHARGE_CORRECTION_APPROVED',
        metadata: {
          requestId: request.id,
          requestedBy: request.requestedBy,
          customerId: customer.id,
          customerName: customer.fullname,
          previousChargePsw: 0,
          chargePsw: request.chargePsw,
          originalMethod: parcel.method,
          method: 4,
          creditTransactionId: credit!.id,
          reason: request.reason,
          reviewNote: note,
        },
      });
    } else {
      await tx.insert(auditLogs).values({
        companyId: input.companyId,
        actorUserId: input.actorUserId,
        entityType: 'parcel',
        entityId: request.parcelId,
        action: 'PARCEL_CHARGE_CORRECTION_REJECTED',
        metadata: {
          requestId: request.id,
          reason: request.reason,
          reviewNote: note,
          requestedBy: request.requestedBy,
          previousChargePsw: 0,
          chargePsw: request.chargePsw,
          originalMethod: request.originalMethod,
        },
      });
    }
    await tx
      .update(parcelChargeCorrections)
      .set({
        status: input.approve ? 1 : 2,
        reviewedBy: input.actorUserId,
        reviewedAt: new Date(),
        reviewNote: note,
      })
      .where(eq(parcelChargeCorrections.id, request.id));
    return {
      id: request.id,
      status: input.approve ? ('APPROVED' as const) : ('REJECTED' as const),
    };
  });
}
