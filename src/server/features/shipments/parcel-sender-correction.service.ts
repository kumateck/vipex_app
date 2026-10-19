import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/config';
import { auditLogs, customers, customerCreditTransactions, parcels } from '@/db/schemas';
import { CustomerCreditSourceType } from '@/db/schemas/enums';
import { BadRequest, Conflict, NotFound } from '@/server/utils/http-error';
import { findCustomersByTelephoneRepo } from '../customers/repository';

type Context = { parcelId: string; companyId: string; branchId: string; actorUserId: string };
type Candidate = { companyId: string; sourceId: string; isDeleted: boolean };
function assertSourceParcel(
  parcel: Candidate | undefined,
  context: Context,
): asserts parcel is Candidate {
  if (
    !context.companyId ||
    !context.branchId ||
    !parcel ||
    parcel.isDeleted ||
    parcel.companyId !== context.companyId ||
    parcel.sourceId !== context.branchId
  )
    throw NotFound('Parcel not found at your sending branch');
}
function phone(value: string) {
  const number = value.replace(/\D/g, '');
  if (!/^\d{10}$/.test(number)) throw BadRequest('Sender telephone must be exactly 10 digits');
  return number;
}

export async function findParcelSenderCandidatesSvc(input: Context & { telephone: string }) {
  const telephone = phone(input.telephone);
  const [parcel] = await db.select().from(parcels).where(eq(parcels.id, input.parcelId)).limit(1);
  assertSourceParcel(parcel, input);
  const rows = await findCustomersByTelephoneRepo({
    companyId: input.companyId,
    telephone,
    limit: 10,
  });
  return rows.map(({ id, fullname, telephone, telephone2 }) => ({
    id,
    fullname,
    telephone,
    telephone2,
  }));
}

export async function correctParcelSenderSvc(
  input: Context & {
    expectedSenderId: string;
    customerId: string;
    telephone: string;
    reason: string;
  },
) {
  const telephone = phone(input.telephone);
  const reason = input.reason.trim();
  if (reason.length < 5 || reason.length > 1000)
    throw BadRequest('Enter a correction reason between 5 and 1000 characters');
  return db.transaction(async (tx) => {
    const [parcel] = await tx
      .select()
      .from(parcels)
      .where(eq(parcels.id, input.parcelId))
      .for('update');
    assertSourceParcel(parcel, input);
    if (parcel!.senderId !== input.expectedSenderId)
      throw Conflict('Sender changed; reload this parcel before correcting it');
    const [customer] = await tx
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.id, input.customerId),
          eq(customers.companyId, input.companyId),
          eq(customers.isDeleted, false),
        ),
      )
      .for('update');
    if (!customer || ![customer.telephone, customer.telephone2].includes(telephone))
      throw BadRequest('Select an active customer matching the correct telephone');
    if (customer.id === parcel!.senderId) return { id: parcel!.id, changed: false };
    const [credit] = await tx
      .select({ id: customerCreditTransactions.id })
      .from(customerCreditTransactions)
      .where(
        and(
          eq(customerCreditTransactions.companyId, input.companyId),
          eq(customerCreditTransactions.customerId, parcel!.senderId),
          eq(customerCreditTransactions.referenceId, parcel!.id),
          inArray(customerCreditTransactions.sourceType, [
            CustomerCreditSourceType.PARCEL,
            CustomerCreditSourceType.DELIVERY,
          ]),
        ),
      )
      .limit(1);
    if (credit)
      throw Conflict(
        'This parcel has sender credit history. Accounts must reconcile it before the sender can be changed.',
      );
    const [saved] = await tx
      .update(parcels)
      .set({ senderId: customer.id, updatedAt: new Date() })
      .where(eq(parcels.id, parcel!.id))
      .returning({ senderName: parcels.senderNameSnapshot });
    if (saved?.senderName !== customer.fullname)
      throw Conflict('Sender correction could not be saved; contact support');
    await tx.insert(auditLogs).values({
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      entityType: 'parcel',
      entityId: parcel!.id,
      action: 'PARCEL_SENDER_CHANGED',
      message: `Sender customer corrected for ${parcel!.bookingCode}`,
      metadata: {
        previousSenderId: parcel!.senderId,
        previousSenderName: parcel!.senderNameSnapshot,
        senderId: customer.id,
        senderName: customer.fullname,
        telephone,
        reason,
      },
    });
    return { id: parcel!.id, changed: true };
  });
}
