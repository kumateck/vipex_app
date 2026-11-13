import { and, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { branches, BranchType, customers, parcels, ParcelStatus } from '@/db/schemas';
import {
  isOtpExceptionReason,
  OTP_AUTHORIZATION_MINUTES,
  type OtpAuthorizationTarget,
  type OtpAuthorizationWorkflow,
} from '@/shared/shipments/receiver-otp-exception';
import { BadRequest, Conflict, Forbidden, NotFound } from '@/server/utils/http-error';
import { getActiveOtpAuthorization, saveOtpAuthorization } from './exception';
import { findOtpApprover } from './exception-access.repository';
import { findPendingOtpForApproval } from './exception-queue.repository';

type Input = {
  companyId: string;
  branchId: string;
  parcelId: string;
  workflow: OtpAuthorizationWorkflow;
  handoverTarget: OtpAuthorizationTarget;
};

function eligible(
  parcel: Pick<typeof parcels.$inferSelect, 'status' | 'confirmedAt' | 'pendingReceiverHandover'>,
) {
  return (
    parcel.status === ParcelStatus.AWAITING_PICKUP &&
    !parcel.confirmedAt &&
    !parcel.pendingReceiverHandover
  );
}

export async function authorizeParcelWithoutOtp(
  input: Input & {
    actorUserId: string;
    expectedReceiverId: string;
    expectedCollectorId: string;
    expectedOtpRequestId?: string;
    reason: string;
  },
) {
  const reason = input.reason.trim();
  if (!isOtpExceptionReason(reason))
    throw BadRequest('Enter an approval reason of 10 to 500 characters');

  return db.transaction(async (tx) => {
    const [parcel] = await tx
      .select()
      .from(parcels)
      .where(
        and(
          eq(parcels.id, input.parcelId),
          eq(parcels.companyId, input.companyId),
          eq(parcels.isDeleted, false),
        ),
      )
      .for('update');
    if (!parcel) throw NotFound('Parcel not found');

    const grant = await findOtpApprover(tx, input, true);
    if (
      !grant ||
      (input.branchId !== parcel.destinationId && grant.branchType !== BranchType.HEADOFFICE)
    )
      throw Forbidden('You do not have permission to approve handover for this parcel');

    if (!eligible(parcel)) throw Conflict('Parcel is no longer available for OTP approval');
    const [branch] = await tx
      .select({
        requirePickupOtp: branches.requirePickupOtp,
        requireReceiverOtp: branches.requireReceiverOtp,
      })
      .from(branches)
      .where(
        and(
          eq(branches.id, parcel.destinationId),
          eq(branches.companyId, input.companyId),
          eq(branches.isDeleted, false),
        ),
      )
      .for('share');
    const required =
      input.workflow === 'office_pickup' ? branch?.requirePickupOtp : branch?.requireReceiverOtp;
    if (!required) throw BadRequest('OTP is not required for this workflow');

    const collectorId =
      input.handoverTarget === 'main' ? parcel.receiverId : parcel.secondReceiverId;
    if (!collectorId || (input.handoverTarget === 'second' && collectorId === parcel.receiverId))
      throw BadRequest('Select a linked collector');
    if (parcel.receiverId !== input.expectedReceiverId || collectorId !== input.expectedCollectorId)
      throw Conflict('The receiver changed. Reopen the parcel before approving.');
    const [collector] = await tx
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(
          eq(customers.id, collectorId),
          eq(customers.companyId, input.companyId),
          eq(customers.isDeleted, false),
        ),
      )
      .for('share');
    if (!collector) throw Conflict('The collector is no longer available');

    if (input.expectedOtpRequestId) {
      const pending = await findPendingOtpForApproval(tx, input);
      if (pending?.otpRequestId !== input.expectedOtpRequestId)
        throw Conflict('The pending OTP request has changed. Refresh the approval queue.');
    }

    const expiresAt = new Date(Date.now() + OTP_AUTHORIZATION_MINUTES * 60_000).toISOString();
    return saveOtpAuthorization(
      tx,
      {
        companyId: input.companyId,
        branchId: parcel.destinationId,
        parcelId: parcel.id,
        workflow: input.workflow,
        handoverTarget: input.handoverTarget,
        receiverId: parcel.receiverId,
        collectorId,
      },
      input.actorUserId,
      reason,
      expiresAt,
    );
  });
}

export async function readParcelOtpAuthorization(input: Input) {
  const [parcel] = await db
    .select()
    .from(parcels)
    .where(
      and(
        eq(parcels.id, input.parcelId),
        eq(parcels.companyId, input.companyId),
        eq(parcels.destinationId, input.branchId),
        eq(parcels.isDeleted, false),
      ),
    );
  if (!parcel) throw NotFound('Parcel not found at this branch');
  if (!eligible(parcel)) return null;
  const collectorId = input.handoverTarget === 'main' ? parcel.receiverId : parcel.secondReceiverId;
  if (!collectorId) return null;
  const result = await getActiveOtpAuthorization(db, {
    ...input,
    receiverId: parcel.receiverId,
    collectorId,
  });
  return (
    result && { id: result.id, expiresAt: result.expiresAt, handoverTarget: result.handoverTarget }
  );
}
