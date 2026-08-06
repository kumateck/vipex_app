import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { commGroups } from '@/db/schemas';
import type {
  CommunicationGroupsCreateInput,
  CommunicationGroupsItem,
  CommunicationGroupsListInput,
} from './dto';

export async function listCommunicationGroupsRepo(
  input: CommunicationGroupsListInput,
): Promise<CommunicationGroupsItem[]> {
  const rows = await db
    .select({
      id: commGroups.id,
      companyId: commGroups.companyId,
      branchId: commGroups.branchId,
      locationId: commGroups.locationId,
      name: commGroups.name,
      description: commGroups.description,
      createdBy: commGroups.createdBy,
      createdAt: commGroups.createdAt,
      updatedAt: commGroups.updatedAt,
    })
    .from(commGroups)
    .where(and(eq(commGroups.companyId, input.companyId), eq(commGroups.isDeleted, false)))
    .orderBy(desc(commGroups.createdAt), desc(commGroups.id));

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  }));
}

export async function createCommunicationGroupsRepo(
  input: CommunicationGroupsCreateInput,
): Promise<CommunicationGroupsItem> {
  const [created] = await db
    .insert(commGroups)
    .values({
      companyId: input.companyId,
      branchId: input.branchId ?? null,
      locationId: input.locationId ?? null,
      name: input.name,
      description: input.description ?? null,
      createdBy: input.userId,
    })
    .returning({
      id: commGroups.id,
      companyId: commGroups.companyId,
      branchId: commGroups.branchId,
      locationId: commGroups.locationId,
      name: commGroups.name,
      description: commGroups.description,
      createdBy: commGroups.createdBy,
      createdAt: commGroups.createdAt,
      updatedAt: commGroups.updatedAt,
    });
  if (!created) throw new Error('Failed to create group');

  return {
    ...created,
    createdAt: created.createdAt ? created.createdAt.toISOString() : null,
    updatedAt: created.updatedAt ? created.updatedAt.toISOString() : null,
  };
}
