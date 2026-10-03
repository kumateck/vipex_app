import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/config';
import { parcelReceiverOtps, parcels } from '@/db/schemas';
import { SECOND_RECEIVER_EDITABLE_STATUSES } from '@/shared/shipments/second-receiver';
import { BadRequest, Conflict } from '../../utils/http-error';
import { recordAuditLog } from '../audit/logger';
import { findOrCreateCustomerSvc } from '../customers/service';
import {
  assertNotMainReceiver,
  assertSecondReceiverCandidate,
  normalizeSecondReceiverInput,
} from './parcel-second-receiver.rules';

export async function setParcelSecondReceiverSvc(input: {
  parcelId: string;
  companyId: string;
  branchId: string;
  actorUserId: string;
  fullname: string;
  telephone: string;
}) {
  if (!input.companyId || !input.branchId) throw BadRequest('Company and branch are required');
  const { fullname, telephone } = normalizeSecondReceiverInput(input);
  const context = { companyId: input.companyId, branchId: input.branchId };

  const [current] = await db
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
    .where(eq(parcels.id, input.parcelId));
  assertSecondReceiverCandidate(current, context);

  // An existing customer with this telephone is reused as-is (same as the call outcome flow).
  const customer = await findOrCreateCustomerSvc({
    companyId: input.companyId,
    fullname,
    telephone,
    createdBy: input.actorUserId,
  });
  assertNotMainReceiver(current, customer.id);
  const changed = customer.id !== current.secondReceiverId;

  if (changed) {
    await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(parcels)
        .set({
          secondReceiverId: customer.id,
          // ID card details captured for a previous second receiver no longer apply.
          secondCardId: null,
          secondCardNumber: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(parcels.id, input.parcelId),
            eq(parcels.companyId, input.companyId),
            eq(parcels.destinationId, input.branchId),
            eq(parcels.isDeleted, false),
            eq(parcels.receiverId, current.receiverId),
            inArray(parcels.status, [...SECOND_RECEIVER_EDITABLE_STATUSES]),
          ),
        )
        .returning({ id: parcels.id });
      if (!updated) throw Conflict('Parcel changed while saving; reload and try again');

      // A pickup OTP sent to the previous second receiver must not authorise a handover.
      const now = new Date();
      await tx
        .update(parcelReceiverOtps)
        .set({ expiresAt: now, verificationToken: null, verificationTokenExpiresAt: null })
        .where(
          and(
            eq(parcelReceiverOtps.parcelId, input.parcelId),
            eq(parcelReceiverOtps.targetReceiver, 'second'),
          ),
        );
    });

    await recordAuditLog({
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      entityType: 'parcel',
      entityId: input.parcelId,
      action: 'PARCEL_SECOND_RECEIVER_SET',
      message: `Second receiver set for ${current.bookingCode}`,
      metadata: {
        previousSecondReceiverId: current.secondReceiverId,
        previousSecondReceiverName: current.secondReceiverNameSnapshot,
        secondReceiverId: customer.id,
        telephone,
      },
    });
  }

  return { id: current.id, secondReceiverId: customer.id, changed };
}
