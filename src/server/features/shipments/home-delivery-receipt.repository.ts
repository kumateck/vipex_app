import { eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db/config';
import { branches, customers, parcels } from '@/db/schemas';

export async function getHomeDeliveryReceiptContactsRepo(parcelId: string) {
  const sender = alias(customers, 'receipt_sender');
  const receiver = alias(customers, 'receipt_receiver');
  const destination = alias(branches, 'receipt_destination');
  const [row] = await db
    .select({
      senderName: sender.fullname,
      senderPhone: sender.telephone,
      senderPhone2: sender.telephone2,
      receiverName: receiver.fullname,
      receiverPhone: receiver.telephone,
      receiverPhone2: receiver.telephone2,
      destinationName: destination.name,
    })
    .from(parcels)
    .leftJoin(sender, eq(sender.id, parcels.senderId))
    .leftJoin(receiver, eq(receiver.id, parcels.receiverId))
    .leftJoin(destination, eq(destination.id, parcels.destinationId))
    .where(eq(parcels.id, parcelId))
    .limit(1);
  return row;
}
