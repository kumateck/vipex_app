import { and, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db/config';
import { customers, parcels, receiptShareLinks } from '@/db/schemas';
import type { ReceiptDeliveryChannel } from '@/shared/digital-receipts/channels';
import { listParcelsRepo } from '../shipments/parcels.repository';

export async function createReceiptShareLinkRepo(values: typeof receiptShareLinks.$inferInsert) {
  const [row] = await db
    .insert(receiptShareLinks)
    .values(values)
    .returning({ id: receiptShareLinks.id, expiresAt: receiptShareLinks.expiresAt });
  return row ?? null;
}

export async function findReceiptShareLinkByTokenHashRepo(tokenHash: string) {
  const [row] = await db
    .select()
    .from(receiptShareLinks)
    .where(eq(receiptShareLinks.tokenHash, tokenHash))
    .limit(1);
  return row ?? null;
}

export async function recordReceiptShareLinkViewRepo(id: string) {
  await db
    .update(receiptShareLinks)
    .set({ viewCount: sql`${receiptShareLinks.viewCount} + 1`, lastViewedAt: new Date() })
    .where(eq(receiptShareLinks.id, id));
}

/** The parcel row the printed receipts are built from (same query as parcel search). */
export async function getParcelReceiptRowRepo(companyId: string, parcelId: string) {
  const { data } = await listParcelsRepo({ companyId, ids: [parcelId], limit: 1, offset: 0 });
  return data[0] ?? null;
}

/** Sender/receiver customers with the contact details digital receipts need. */
export async function getParcelReceiptPartiesRepo(companyId: string, parcelId: string) {
  const sender = alias(customers, 'dr_sender');
  const receiver = alias(customers, 'dr_receiver');
  const [row] = await db
    .select({
      senderId: sender.id,
      senderName: parcels.senderNameSnapshot,
      senderPhone: sender.telephone,
      senderEmail: sender.email,
      receiverId: receiver.id,
      receiverName: parcels.receiverNameSnapshot,
      receiverPhone: receiver.telephone,
      receiverEmail: receiver.email,
      chargePsw: parcels.chargePsw,
      plannedToBePaidPsw: parcels.plannedToBePaidPsw,
    })
    .from(parcels)
    .leftJoin(sender, eq(sender.id, parcels.senderId))
    .leftJoin(receiver, eq(receiver.id, parcels.receiverId))
    .where(and(eq(parcels.id, parcelId), eq(parcels.companyId, companyId)))
    .limit(1);
  return row ?? null;
}

export async function getCustomerReceiptChannelsRepo(companyId: string, customerId: string) {
  const [row] = await db
    .select({
      id: customers.id,
      email: customers.email,
      telephone: customers.telephone,
      receiptDeliveryChannels: customers.receiptDeliveryChannels,
    })
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.companyId, companyId)))
    .limit(1);
  return row ?? null;
}

export async function updateCustomerReceiptChannelsRepo(
  companyId: string,
  customerId: string,
  channels: ReceiptDeliveryChannel[],
) {
  await db
    .update(customers)
    .set({ receiptDeliveryChannels: channels, updatedAt: new Date() })
    .where(and(eq(customers.id, customerId), eq(customers.companyId, companyId)));
}
