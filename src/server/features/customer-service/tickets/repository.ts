import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { csTicketEvents, csTickets } from '@/db/schemas';
import type {
  CustomerServiceTicketsCreateInput,
  CustomerServiceTicketsItem,
  CustomerServiceTicketsListInput,
} from './dto';

export async function listCustomerServiceTicketsRepo(
  input: CustomerServiceTicketsListInput,
): Promise<CustomerServiceTicketsItem[]> {
  const where = [eq(csTickets.companyId, input.companyId), eq(csTickets.isDeleted, false)];
  if (input.status) where.push(eq(csTickets.status, input.status));
  if (input.priority) where.push(eq(csTickets.priority, input.priority));

  const rows = await db
    .select({
      id: csTickets.id,
      companyId: csTickets.companyId,
      conversationId: csTickets.conversationId,
      status: csTickets.status,
      priority: csTickets.priority,
      channel: csTickets.channel,
      subject: csTickets.subject,
      description: csTickets.description,
      trackingCode: csTickets.trackingCode,
      bookingCode: csTickets.bookingCode,
      parcelId: csTickets.parcelId,
      ownerUserId: csTickets.ownerUserId,
      ownerQueue: csTickets.ownerQueue,
      branchId: csTickets.branchId,
      locationId: csTickets.locationId,
      createdBy: csTickets.createdBy,
      createdAt: csTickets.createdAt,
      updatedAt: csTickets.updatedAt,
    })
    .from(csTickets)
    .where(and(...where))
    .orderBy(desc(csTickets.createdAt), desc(csTickets.id));

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  }));
}

export async function createCustomerServiceTicketsRepo(
  input: CustomerServiceTicketsCreateInput,
): Promise<CustomerServiceTicketsItem> {
  const [created] = await db
    .insert(csTickets)
    .values({
      companyId: input.companyId,
      conversationId: input.conversationId ?? null,
      status: 'new',
      priority: input.priority ?? 'medium',
      channel: input.channel ?? 'portal_chat',
      subject: input.subject ?? null,
      description: input.description ?? null,
      trackingCode: input.trackingCode ?? null,
      bookingCode: input.bookingCode ?? null,
      parcelId: input.parcelId ?? null,
      branchId: input.branchId ?? null,
      locationId: input.locationId ?? null,
      createdBy: input.userId,
    })
    .returning({
      id: csTickets.id,
      companyId: csTickets.companyId,
      conversationId: csTickets.conversationId,
      status: csTickets.status,
      priority: csTickets.priority,
      channel: csTickets.channel,
      subject: csTickets.subject,
      description: csTickets.description,
      trackingCode: csTickets.trackingCode,
      bookingCode: csTickets.bookingCode,
      parcelId: csTickets.parcelId,
      ownerUserId: csTickets.ownerUserId,
      ownerQueue: csTickets.ownerQueue,
      branchId: csTickets.branchId,
      locationId: csTickets.locationId,
      createdBy: csTickets.createdBy,
      createdAt: csTickets.createdAt,
      updatedAt: csTickets.updatedAt,
    });
  if (!created) throw new Error('Failed to create ticket');

  await db.insert(csTicketEvents).values({
    ticketId: created.id,
    eventType: 'ticket_created',
    eventNote: 'Ticket created',
    toStatus: created.status,
    performedBy: input.userId,
  });

  return {
    ...created,
    createdAt: created.createdAt ? created.createdAt.toISOString() : null,
    updatedAt: created.updatedAt ? created.updatedAt.toISOString() : null,
  };
}
