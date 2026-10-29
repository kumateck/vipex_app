import { PermissionKeys } from '@/shared/permissions/constants';
import { assertChargePermission } from './access';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { auditLogs, parcelChargeCorrections, parcels } from '@/db/schemas';
import { BadRequest, Conflict, NotFound } from '@/server/utils/http-error';
import { assertAvailableCredit, correctionAmount, lockZeroChargeParcel } from './policy';

/** Submitting a correction only records a proposal. Approval is the only mutation path. */
export async function requestCreditChargeSvc(input: {
  companyId: string;
  parcelId: string;
  actorUserId: string;
  chargeCedis: string | number;
  expectedChargePsw: number;
  method: number;
  reason: string;
}) {
  await assertChargePermission(input.companyId, input.actorUserId, [
    PermissionKeys.CanUpdateParcelCharge,
  ]);
  if (input.expectedChargePsw !== 0)
    throw BadRequest('Only an existing zero charge can be corrected');
  if (input.method !== 4) throw BadRequest('Select CREDIT for this correction');
  const chargePsw = correctionAmount(input.chargeCedis);
  const reason = input.reason.trim();
  if (reason.length < 3 || reason.length > 500)
    throw BadRequest('Provide a reason between 3 and 500 characters');
  const [initial] = await db
    .select({ senderId: parcels.senderId })
    .from(parcels)
    .where(
      and(
        eq(parcels.id, input.parcelId),
        eq(parcels.companyId, input.companyId),
        eq(parcels.isDeleted, false),
      ),
    );
  if (!initial) throw NotFound('Parcel not found');
  return db.transaction(async (tx) => {
    await assertChargePermission(
      input.companyId,
      input.actorUserId,
      [PermissionKeys.CanUpdateParcelCharge],
      tx,
    );
    const { parcel, customer } = await lockZeroChargeParcel(
      tx,
      input.companyId,
      input.parcelId,
      initial.senderId,
    );
    const [pending] = await tx
      .select({ id: parcelChargeCorrections.id })
      .from(parcelChargeCorrections)
      .where(
        and(eq(parcelChargeCorrections.parcelId, parcel.id), eq(parcelChargeCorrections.status, 0)),
      );
    if (pending) throw Conflict('A charge correction is already awaiting approval for this parcel');
    await assertAvailableCredit(
      tx,
      input.companyId,
      customer.id,
      customer.creditLimitPsw,
      chargePsw,
    );
    const [request] = await tx
      .insert(parcelChargeCorrections)
      .values({
        companyId: input.companyId,
        parcelId: parcel.id,
        customerId: customer.id,
        originalMethod: parcel.method,
        chargePsw,
        reason,
        requestedBy: input.actorUserId,
      })
      .returning({ id: parcelChargeCorrections.id });
    await tx.insert(auditLogs).values({
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      entityType: 'parcel',
      entityId: parcel.id,
      action: 'PARCEL_CHARGE_CORRECTION_REQUESTED',
      metadata: {
        requestId: request!.id,
        chargePsw,
        previousChargePsw: 0,
        customerName: customer.fullname,
        originalMethod: parcel.method,
        proposedMethod: 4,
        customerId: customer.id,
        reason,
      },
    });
    return { id: request!.id, status: 'PENDING_APPROVAL' as const };
  });
}
