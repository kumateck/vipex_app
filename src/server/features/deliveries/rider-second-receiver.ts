import { and, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { customers, auditLogs } from '@/db/schemas';
import { BadRequest, Conflict } from '@/server/utils/http-error';

type Executor = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Parcel = {
  id: string;
  companyId: string;
  receiverId: string;
  secondReceiverId: string | null;
  secondReceiverNameSnapshot: string | null;
  bookingCode: string;
};

export async function validateRiderSecondReceiver(
  tx: Executor,
  parcel: Parcel,
  secondReceiverId?: string | null,
  handoverTarget?: 'main' | 'second',
) {
  if (handoverTarget === 'main' && secondReceiverId)
    throw BadRequest('Main receiver handover cannot include a second receiver');
  if (
    handoverTarget === 'second' &&
    (!secondReceiverId || secondReceiverId !== parcel.secondReceiverId)
  )
    throw Conflict('Second receiver changed; refresh the delivery and select the receiver again');
  if (!secondReceiverId) return null;
  if (secondReceiverId === parcel.receiverId)
    throw BadRequest('The main receiver cannot also be the second receiver');
  const [receiver] = await tx
    .select({ id: customers.id, fullname: customers.fullname, telephone: customers.telephone })
    .from(customers)
    .where(
      and(
        eq(customers.id, secondReceiverId),
        eq(customers.companyId, parcel.companyId),
        eq(customers.isDeleted, false),
      ),
    )
    .limit(1);
  if (!receiver)
    throw BadRequest('Second receiver must be an active customer in the parcel company');
  return receiver;
}

export async function auditRiderSecondReceiver(
  tx: Executor,
  parcel: Parcel,
  riderUserId: string,
  receiver: Awaited<ReturnType<typeof validateRiderSecondReceiver>>,
  handoverTarget?: 'main' | 'second',
) {
  if (handoverTarget) {
    await tx.insert(auditLogs).values({
      companyId: parcel.companyId,
      actorUserId: riderUserId,
      entityType: 'parcel',
      entityId: parcel.id,
      action: 'RIDER_HANDOVER_RECEIVER_SELECTED',
      message: `Rider handed ${parcel.bookingCode} to the ${handoverTarget} receiver`,
      metadata: {
        handoverTarget,
        receiverId: receiver?.id ?? parcel.receiverId,
        secondReceiverId: parcel.secondReceiverId,
        source: 'rider-handover',
      },
    });
    return;
  }
  if (!receiver || receiver.id === parcel.secondReceiverId) return;
  await tx.insert(auditLogs).values({
    companyId: parcel.companyId,
    actorUserId: riderUserId,
    entityType: 'parcel',
    entityId: parcel.id,
    action: 'PARCEL_SECOND_RECEIVER_SET',
    message: `Second receiver set at rider handover for ${parcel.bookingCode}`,
    metadata: {
      previousSecondReceiverId: parcel.secondReceiverId,
      previousSecondReceiverName: parcel.secondReceiverNameSnapshot,
      secondReceiverId: receiver.id,
      telephone: receiver.telephone,
      source: 'rider-handover',
    },
  });
}
