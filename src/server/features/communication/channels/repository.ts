import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { commChannels } from '@/db/schemas';
import type {
  CommunicationChannelsCreateInput,
  CommunicationChannelsItem,
  CommunicationChannelsListInput,
} from './dto';

export async function listCommunicationChannelsRepo(
  input: CommunicationChannelsListInput,
): Promise<CommunicationChannelsItem[]> {
  const rows = await db
    .select({
      id: commChannels.id,
      companyId: commChannels.companyId,
      branchId: commChannels.branchId,
      locationId: commChannels.locationId,
      name: commChannels.name,
      description: commChannels.description,
      isCallEnabled: commChannels.isCallEnabled,
      isAnnouncementOnly: commChannels.isAnnouncementOnly,
      createdBy: commChannels.createdBy,
      createdAt: commChannels.createdAt,
      updatedAt: commChannels.updatedAt,
    })
    .from(commChannels)
    .where(and(eq(commChannels.companyId, input.companyId), eq(commChannels.isDeleted, false)))
    .orderBy(desc(commChannels.createdAt), desc(commChannels.id));

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  }));
}

export async function createCommunicationChannelsRepo(
  input: CommunicationChannelsCreateInput,
): Promise<CommunicationChannelsItem> {
  const [created] = await db
    .insert(commChannels)
    .values({
      companyId: input.companyId,
      branchId: input.branchId ?? null,
      locationId: input.locationId ?? null,
      name: input.name,
      description: input.description ?? null,
      isCallEnabled: Boolean(input.isCallEnabled),
      isAnnouncementOnly: Boolean(input.isAnnouncementOnly),
      createdBy: input.userId,
    })
    .returning({
      id: commChannels.id,
      companyId: commChannels.companyId,
      branchId: commChannels.branchId,
      locationId: commChannels.locationId,
      name: commChannels.name,
      description: commChannels.description,
      isCallEnabled: commChannels.isCallEnabled,
      isAnnouncementOnly: commChannels.isAnnouncementOnly,
      createdBy: commChannels.createdBy,
      createdAt: commChannels.createdAt,
      updatedAt: commChannels.updatedAt,
    });
  if (!created) throw new Error('Failed to create channel');

  return {
    ...created,
    createdAt: created.createdAt ? created.createdAt.toISOString() : null,
    updatedAt: created.updatedAt ? created.updatedAt.toISOString() : null,
  };
}
