import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { csFeedback } from '@/db/schemas';
import type {
  CustomerServiceFeedbackCreateInput,
  CustomerServiceFeedbackItem,
  CustomerServiceFeedbackListInput,
} from './dto';

export async function listCustomerServiceFeedbackRepo(
  input: CustomerServiceFeedbackListInput,
): Promise<CustomerServiceFeedbackItem[]> {
  const where = [eq(csFeedback.companyId, input.companyId)];
  if (input.ticketId) where.push(eq(csFeedback.ticketId, input.ticketId));

  const rows = await db
    .select({
      id: csFeedback.id,
      companyId: csFeedback.companyId,
      ticketId: csFeedback.ticketId,
      customerId: csFeedback.customerId,
      score: csFeedback.score,
      comment: csFeedback.comment,
      createdAt: csFeedback.createdAt,
      updatedAt: csFeedback.updatedAt,
    })
    .from(csFeedback)
    .where(and(...where))
    .orderBy(desc(csFeedback.createdAt), desc(csFeedback.id));

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  }));
}

export async function createCustomerServiceFeedbackRepo(
  input: CustomerServiceFeedbackCreateInput,
): Promise<CustomerServiceFeedbackItem> {
  const [created] = await db
    .insert(csFeedback)
    .values({
      companyId: input.companyId,
      ticketId: input.ticketId,
      customerId: input.customerId ?? null,
      score: input.score,
      comment: input.comment ?? null,
    })
    .returning({
      id: csFeedback.id,
      companyId: csFeedback.companyId,
      ticketId: csFeedback.ticketId,
      customerId: csFeedback.customerId,
      score: csFeedback.score,
      comment: csFeedback.comment,
      createdAt: csFeedback.createdAt,
      updatedAt: csFeedback.updatedAt,
    });
  if (!created) throw new Error('Failed to create feedback');

  return {
    ...created,
    createdAt: created.createdAt ? created.createdAt.toISOString() : null,
    updatedAt: created.updatedAt ? created.updatedAt.toISOString() : null,
  };
}
