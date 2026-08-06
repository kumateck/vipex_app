import { desc, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { csConversations } from '@/db/schemas';
import type {
  CustomerServiceConversationsCreateInput,
  CustomerServiceConversationsItem,
  CustomerServiceConversationsListInput,
} from './dto';

export async function listCustomerServiceConversationsRepo(
  input: CustomerServiceConversationsListInput,
): Promise<CustomerServiceConversationsItem[]> {
  const rows = await db
    .select({
      id: csConversations.id,
      companyId: csConversations.companyId,
      customerId: csConversations.customerId,
      ticketId: csConversations.ticketId,
      channel: csConversations.channel,
      branchId: csConversations.branchId,
      locationId: csConversations.locationId,
      createdBy: csConversations.createdBy,
      createdAt: csConversations.createdAt,
      updatedAt: csConversations.updatedAt,
    })
    .from(csConversations)
    .where(eq(csConversations.companyId, input.companyId))
    .orderBy(desc(csConversations.createdAt), desc(csConversations.id));

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  }));
}

export async function createCustomerServiceConversationsRepo(
  input: CustomerServiceConversationsCreateInput,
): Promise<CustomerServiceConversationsItem> {
  const [created] = await db
    .insert(csConversations)
    .values({
      companyId: input.companyId,
      customerId: input.customerId ?? null,
      channel: input.channel ?? 'portal_chat',
      branchId: input.branchId ?? null,
      locationId: input.locationId ?? null,
      createdBy: input.userId,
    })
    .returning({
      id: csConversations.id,
      companyId: csConversations.companyId,
      customerId: csConversations.customerId,
      ticketId: csConversations.ticketId,
      channel: csConversations.channel,
      branchId: csConversations.branchId,
      locationId: csConversations.locationId,
      createdBy: csConversations.createdBy,
      createdAt: csConversations.createdAt,
      updatedAt: csConversations.updatedAt,
    });
  if (!created) throw new Error('Failed to create conversation');

  return {
    ...created,
    createdAt: created.createdAt ? created.createdAt.toISOString() : null,
    updatedAt: created.updatedAt ? created.updatedAt.toISOString() : null,
  };
}
