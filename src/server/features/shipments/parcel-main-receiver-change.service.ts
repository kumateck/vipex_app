import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@/db/config';
import { customers, parcels } from '@/db/schemas';
import { findCustomerNameByExactTelephoneRepo } from '../customers/repository';
import { BadRequest, Conflict } from '../../utils/http-error';
import { recordAuditLog } from '../audit/logger';
import { callOutcomeStatus, type CallOutcome } from './parcel-bulk-call-outcome.service';
import {
  assertMainReceiverChangeCandidate,
  mainReceiverChangeEligibleStatuses,
  normalizeMainReceiverPhone,
} from './parcel-main-receiver-change.rules';

export async function changeMainReceiverWithCallOutcomeSvc(input: {
  parcelId: string;
  companyId: string;
  branchId: string;
  actorUserId: string;
  telephone: string;
  fullname?: string;
  outcome: CallOutcome;
}) {
  const telephone = normalizeMainReceiverPhone(input.telephone);
  if (!input.companyId || !input.branchId) throw BadRequest('Company and branch are required');

  const result = await db.transaction(async (tx) => {
    const [parcel] = await tx
      .select({
        id: parcels.id,
        bookingCode: parcels.bookingCode,
        receiverId: parcels.receiverId,
        status: parcels.status,
        companyId: parcels.companyId,
        destinationId: parcels.destinationId,
        callCenterAssignedToUserId: parcels.callCenterAssignedToUserId,
        isDeleted: parcels.isDeleted,
        callCenterCalledAt: parcels.callCenterCalledAt,
      })
      .from(parcels)
      .where(eq(parcels.id, input.parcelId));
    assertMainReceiverChangeCandidate(parcel, input);

    const existing = await findCustomerNameByExactTelephoneRepo(
      { companyId: input.companyId, telephone },
      tx,
    );
    const fullname = input.fullname?.trim() ?? '';
    if (!existing && !fullname)
      throw BadRequest('New receiver name is required for an unknown telephone');
    let createdCustomer = false;
    let receiver = existing;
    if (!receiver) {
      const [created] = await tx
        .insert(customers)
        .values({
          companyId: input.companyId,
          fullname,
          telephone,
          createdBy: input.actorUserId,
        })
        .onConflictDoNothing()
        .returning({ id: customers.id });
      createdCustomer = Boolean(created);
      receiver = created
        ? { id: created.id, fullname, telephone, telephone2: null }
        : await findCustomerNameByExactTelephoneRepo({ companyId: input.companyId, telephone }, tx);
      if (!receiver) throw Conflict('Customer telephone is already in use; reload and try again');
    }
    if (receiver.id === parcel.receiverId)
      throw Conflict('This customer is already the main receiver');
    const status = callOutcomeStatus(input.outcome);
    const [updated] = await tx
      .update(parcels)
      .set({
        receiverId: receiver.id,
        secondReceiverId: null,
        cardId: null,
        cardNumber: null,
        secondCardId: null,
        secondCardNumber: null,
        status,
        callCenterCalledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(parcels.id, input.parcelId),
          eq(parcels.companyId, input.companyId),
          eq(parcels.destinationId, input.branchId),
          eq(parcels.callCenterAssignedToUserId, input.actorUserId),
          eq(parcels.isDeleted, false),
          isNull(parcels.callCenterCalledAt),
          inArray(parcels.status, mainReceiverChangeEligibleStatuses),
          eq(parcels.receiverId, parcel.receiverId),
        ),
      )
      .returning({ id: parcels.id });
    if (!updated) throw Conflict('Parcel changed while saving; reload and try again');
    return { parcel, receiver, status, createdCustomer };
  });

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'parcel',
    entityId: input.parcelId,
    action: 'PARCEL_MAIN_RECEIVER_CHANGED',
    message: `Main receiver changed for ${result.parcel.bookingCode}`,
    metadata: {
      previousReceiverId: result.parcel.receiverId,
      receiverId: result.receiver.id,
      telephone,
      outcome: input.outcome,
      status: result.status,
    },
  });
  if (result.createdCustomer) {
    await recordAuditLog({
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      entityType: 'customer',
      entityId: result.receiver.id,
      action: 'CUSTOMER_CREATED',
      message: 'Customer created during main receiver change',
      metadata: { fullname: result.receiver.fullname, telephone },
    });
  }
  return {
    id: result.parcel.id,
    receiverId: result.receiver.id,
    status: result.status,
    receiverName: result.receiver.fullname,
  };
}
