import { desc, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { csSlaPolicies } from '@/db/schemas';
import type {
  CustomerServiceSlaCreateInput,
  CustomerServiceSlaItem,
  CustomerServiceSlaListInput,
} from './dto';

export async function listCustomerServiceSlaRepo(
  input: CustomerServiceSlaListInput,
): Promise<CustomerServiceSlaItem[]> {
  const rows = await db
    .select({
      id: csSlaPolicies.id,
      companyId: csSlaPolicies.companyId,
      name: csSlaPolicies.name,
      firstResponseMinutes: csSlaPolicies.firstResponseMinutes,
      resolutionMinutes: csSlaPolicies.resolutionMinutes,
      escalationMinutes: csSlaPolicies.escalationMinutes,
      isActive: csSlaPolicies.isActive,
      createdBy: csSlaPolicies.createdBy,
      createdAt: csSlaPolicies.createdAt,
      updatedAt: csSlaPolicies.updatedAt,
    })
    .from(csSlaPolicies)
    .where(eq(csSlaPolicies.companyId, input.companyId))
    .orderBy(desc(csSlaPolicies.createdAt), desc(csSlaPolicies.id));

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  }));
}

export async function createCustomerServiceSlaRepo(
  input: CustomerServiceSlaCreateInput,
): Promise<CustomerServiceSlaItem> {
  const [created] = await db
    .insert(csSlaPolicies)
    .values({
      companyId: input.companyId,
      name: input.name,
      firstResponseMinutes: input.firstResponseMinutes ?? 30,
      resolutionMinutes: input.resolutionMinutes ?? 240,
      escalationMinutes: input.escalationMinutes ?? 120,
      isActive: input.isActive ?? true,
      createdBy: input.userId,
    })
    .returning({
      id: csSlaPolicies.id,
      companyId: csSlaPolicies.companyId,
      name: csSlaPolicies.name,
      firstResponseMinutes: csSlaPolicies.firstResponseMinutes,
      resolutionMinutes: csSlaPolicies.resolutionMinutes,
      escalationMinutes: csSlaPolicies.escalationMinutes,
      isActive: csSlaPolicies.isActive,
      createdBy: csSlaPolicies.createdBy,
      createdAt: csSlaPolicies.createdAt,
      updatedAt: csSlaPolicies.updatedAt,
    });

  if (!created) throw new Error('Failed to create SLA policy');

  return {
    ...created,
    createdAt: created.createdAt ? created.createdAt.toISOString() : null,
    updatedAt: created.updatedAt ? created.updatedAt.toISOString() : null,
  };
}
