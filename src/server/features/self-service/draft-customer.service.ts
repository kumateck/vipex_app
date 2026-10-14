import { and, eq, or } from 'drizzle-orm';
import { db } from '@/db/config';
import { auditLogs, customers, selfServiceBookingDrafts } from '@/db/schemas';
import { SelfServiceDraftStatus } from '@/db/schemas/enums';
import type { AuthUser } from '@/server/plugins/auth';
import { BadRequest, Conflict, Forbidden, NotFound } from '@/server/utils/http-error';
import { PermissionKeys } from '@/shared/permissions/constants';
import { normalizeDraftContact, type DraftContactInput } from './draft-customer.rules';

type Executor = Parameters<Parameters<typeof db.transaction>[0]>[0];
async function resolveContact(
  tx: Executor,
  companyId: string,
  actor: AuthUser,
  input: ReturnType<typeof normalizeDraftContact>,
  previous: { fullname: string; phone: string; phone2: string | null; customerId: string | null },
) {
  if (
    input.fullname === previous.fullname &&
    input.phone === previous.phone &&
    input.phone2 === previous.phone2
  )
    return previous.customerId;
  const matches = await tx
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.companyId, companyId),
        eq(customers.isDeleted, false),
        or(
          eq(customers.telephone, input.phone),
          eq(customers.telephone2, input.phone),
          ...(input.phone2
            ? [eq(customers.telephone, input.phone2), eq(customers.telephone2, input.phone2)]
            : []),
        ),
      ),
    )
    .for('update');
  if (matches.length > 1)
    throw Conflict(
      'More than one customer matches this number; resolve the customer records first',
    );
  const customer = matches.find(
    (match) => match.telephone === input.phone || match.telephone2 === input.phone,
  );
  if (!customer && matches.length)
    throw Conflict(
      'Backup number belongs to a saved customer; select that customer or correct the number',
    );
  if (!customer) return null;
  if (
    customer.fullname === input.fullname &&
    customer.telephone === input.phone &&
    customer.telephone2 === input.phone2
  )
    return customer.id;
  if (!actor.permissions?.includes(PermissionKeys.CanUpdateCustomers))
    throw Forbidden('Customer update permission is required to change a saved customer');
  await tx
    .update(customers)
    .set({
      fullname: input.fullname,
      telephone: input.phone,
      telephone2: input.phone2,
      updatedAt: new Date(),
    })
    .where(eq(customers.id, customer.id));
  await tx.insert(auditLogs).values({
    companyId,
    actorUserId: actor.sub,
    entityType: 'customer',
    entityId: customer.id,
    action: 'CUSTOMER_UPDATED',
    message: 'Customer contact corrected from self-service booking',
    metadata: {
      previous: {
        fullname: customer.fullname,
        telephone: customer.telephone,
        telephone2: customer.telephone2,
      },
      patch: { fullname: input.fullname, telephone: input.phone, telephone2: input.phone2 },
    },
  });
  return customer.id;
}

export async function updateSelfServiceDraftCustomersSvc(
  id: string,
  input: {
    sender: DraftContactInput;
    receiver: DraftContactInput;
    expectedUpdatedAt: string;
  },
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
  return db.transaction(async (tx) => {
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
    // Sequential: both roles may resolve to one customer; the receiver must see the sender correction.
    const senderCustomerId = await resolveContact(tx, actor.companyId!, actor, sender, {
      fullname: draft.senderFullname,
      phone: draft.senderPhone,
      phone2: draft.senderPhone2,
      customerId: draft.senderCustomerId,
    });
    const receiverCustomerId = await resolveContact(tx, actor.companyId!, actor, receiver, {
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
      message: 'Self-service sender and receiver details corrected',
      metadata: {
        previous: {
          senderFullname: draft.senderFullname,
          senderPhone: draft.senderPhone,
          senderPhone2: draft.senderPhone2,
          receiverFullname: draft.receiverFullname,
          receiverPhone: draft.receiverPhone,
          receiverPhone2: draft.receiverPhone2,
        },
        patch,
      },
    });
    return updated!;
  });
}
