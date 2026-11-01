import { withDraftCustomerTypes } from '../shipments/charge-exemption';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { auditLogs, selfServiceBookingDrafts } from '@/db/schemas';
import { SelfServiceDraftStatus } from '@/db/schemas/enums';
import type { AuthUser } from '@/server/plugins/auth';
import { BadRequest, Conflict, Forbidden, NotFound } from '@/server/utils/http-error';
import { resolveDraftContact } from './draft-customer-resolve';
import { normalizeDraftContact, type DraftContactInput } from './draft-customer.rules';
import { normalizeDraftParcel, type DraftDetailsInput } from './draft-details.rules';
import { validateSelfServiceDestinationSvc } from './destination.service';

type UpdateDraftInput = {
  sender: DraftContactInput;
  receiver: DraftContactInput;
  expectedUpdatedAt: string;
  // Omitted by the contacts-only route; the full draft edit sends destination and parcel too.
  details?: DraftDetailsInput;
};

export async function updateSelfServiceDraftSvc(
  id: string,
  input: UpdateDraftInput,
  actor: AuthUser,
) {
  if (!actor.companyId || !actor.branchId) throw Forbidden('Branch context is required');
  const sender = normalizeDraftContact(input.sender);
  const receiver = normalizeDraftContact(input.receiver);
  if (
    sender.phone === receiver.phone &&
    (sender.fullname !== receiver.fullname || sender.phone2 !== receiver.phone2)
  )
    throw BadRequest('The same customer number must have consistent sender and receiver details');
  const parcel = input.details ? normalizeDraftParcel(input.details) : null;
  const updatedDraft = await db.transaction(async (tx) => {
    const [draft] = await tx
      .select()
      .from(selfServiceBookingDrafts)
      .where(
        and(
          eq(selfServiceBookingDrafts.id, id),
          eq(selfServiceBookingDrafts.companyId, actor.companyId!),
          eq(selfServiceBookingDrafts.branchId, actor.branchId!),
        ),
      )
      .for('update');
    if (!draft || draft.expiresAt.getTime() <= Date.now())
      throw NotFound('Booking draft not found or expired');
    if (![SelfServiceDraftStatus.PENDING, SelfServiceDraftStatus.CLAIMED].includes(draft.status))
      throw Conflict('Only pending or claimed drafts can be edited');
    if (draft.status === SelfServiceDraftStatus.CLAIMED && draft.claimedBy !== actor.sub)
      throw Conflict('This draft is claimed by another officer');
    if (draft.updatedAt.toISOString() !== input.expectedUpdatedAt)
      throw Conflict('Booking draft changed; reload it before saving');
    const destination = input.details?.destinationBranchId
      ? await validateSelfServiceDestinationSvc({
          sourceBranchId: draft.branchId,
          companyId: draft.companyId,
          destinationBranchId: input.details.destinationBranchId,
          destinationLocationId: input.details.destinationLocationId,
        })
      : null;
    // Sequential: both roles may resolve to one customer; the receiver must see the sender correction.
    const senderCustomerId = await resolveDraftContact(tx, actor.companyId!, actor, sender, {
      fullname: draft.senderFullname,
      phone: draft.senderPhone,
      phone2: draft.senderPhone2,
      customerId: draft.senderCustomerId,
    });
    const receiverCustomerId = await resolveDraftContact(tx, actor.companyId!, actor, receiver, {
      fullname: draft.receiverFullname,
      phone: draft.receiverPhone,
      phone2: draft.receiverPhone2,
      customerId: draft.receiverCustomerId,
    });
    const patch = {
      senderFullname: sender.fullname,
      senderPhone: sender.phone,
      senderPhone2: sender.phone2,
      senderCustomerId,
      receiverFullname: receiver.fullname,
      receiverPhone: receiver.phone,
      receiverPhone2: receiver.phone2,
      receiverCustomerId,
      ...destination,
      ...parcel,
      updatedAt: new Date(),
    };
    const [updated] = await tx
      .update(selfServiceBookingDrafts)
      .set(patch)
      .where(eq(selfServiceBookingDrafts.id, id))
      .returning();
    await tx.insert(auditLogs).values({
      companyId: actor.companyId!,
      actorUserId: actor.sub,
      entityType: 'self_service_draft',
      entityId: id,
      action: 'SELF_SERVICE_DRAFT_UPDATED',
      message: input.details
        ? 'Self-service booking details corrected'
        : 'Self-service sender and receiver details corrected',
      metadata: {
        previous: {
          senderFullname: draft.senderFullname,
          senderPhone: draft.senderPhone,
          senderPhone2: draft.senderPhone2,
          receiverFullname: draft.receiverFullname,
          receiverPhone: draft.receiverPhone,
          receiverPhone2: draft.receiverPhone2,
          ...(input.details
            ? {
                destinationBranchId: draft.destinationBranchId,
                destinationLocationId: draft.destinationLocationId,
                parcelContent: draft.parcelContent,
                parcelValuePsw: draft.parcelValuePsw,
              }
            : {}),
        },
        patch,
      },
    });
    return updated!;
  });
  return withDraftCustomerTypes(updatedDraft);
}

export const updateSelfServiceDraftCustomersSvc = (
  id: string,
  input: Omit<UpdateDraftInput, 'details'>,
  actor: AuthUser,
) => updateSelfServiceDraftSvc(id, input, actor);
