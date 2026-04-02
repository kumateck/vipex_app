import { BadRequest, Forbidden, NotFound } from '@/server/utils/http-error';
import type {
  CommunicationChannelsCreateInput,
  CommunicationChannelsGetByIdInput,
  CommunicationChannelsItem,
  CommunicationChannelsListInput,
  CommunicationChannelsMarkReadInput,
  CommunicationChannelsParticipantsInput,
  CommunicationChannelsRemoveParticipantInput,
  CommunicationChannelsUnreadCountItem,
  CommunicationChannelsUnreadCountsInput,
  CommunicationChannelsUpdateInput,
} from './dto';
import {
  addCommunicationChannelParticipantsRepo,
  createCommunicationChannelsRepo,
  ensureCommunicationChannelThreadRepo,
  getCommunicationChannelByIdRepo,
  listCommunicationChannelUnreadCountsRepo,
  listCommunicationChannelsRepo,
  listValidCompanyUserIdsRepo,
  markCommunicationChannelReadRepo,
  removeCommunicationChannelParticipantRepo,
  updateCommunicationChannelsRepo,
} from './repository';
import { canAccessChannelAccessRepo } from '../access/repository';

function normalizePrivateParticipantIds(userId: string, participantUserIds: string[]) {
  const unique = new Set(participantUserIds.map((id) => id.trim()).filter(Boolean));
  unique.add(userId);
  return [...unique];
}

async function ensureCanManageChannel(input: {
  companyId: string;
  userId: string;
  channelId: string;
}) {
  const channel = await getCommunicationChannelByIdRepo({
    companyId: input.companyId,
    userId: input.userId,
    id: input.channelId,
  });
  if (!channel) throw NotFound('Channel not found');
  if (channel.createdBy !== input.userId) {
    throw Forbidden('Only channel creator can update channel settings');
  }
  return channel;
}

export async function getCommunicationChannelByIdSvc(
  input: CommunicationChannelsGetByIdInput,
): Promise<CommunicationChannelsItem> {
  const channel = await getCommunicationChannelByIdRepo(input);
  if (!channel) throw NotFound('Channel not found');
  return channel;
}

export async function listCommunicationChannelsSvc(
  input: CommunicationChannelsListInput,
): Promise<CommunicationChannelsItem[]> {
  return listCommunicationChannelsRepo(input);
}

export async function listCommunicationChannelUnreadCountsSvc(
  input: CommunicationChannelsUnreadCountsInput,
): Promise<CommunicationChannelsUnreadCountItem[]> {
  return listCommunicationChannelUnreadCountsRepo(input);
}

export async function markCommunicationChannelReadSvc(
  input: CommunicationChannelsMarkReadInput,
): Promise<{ channelId: string; readAt: string | null }> {
  const canAccess = await canAccessChannelAccessRepo({
    companyId: input.companyId,
    channelId: input.id,
    userId: input.userId,
  });
  if (!canAccess) throw Forbidden('You do not have access to this channel');
  return markCommunicationChannelReadRepo(input);
}

export async function createCommunicationChannelsSvc(
  input: CommunicationChannelsCreateInput,
): Promise<CommunicationChannelsItem> {
  if (!input.name.trim()) throw BadRequest('Channel name is required');
  if (input.channelType !== 'text' && input.channelType !== 'voice') {
    throw BadRequest('Channel type must be text or voice');
  }
  if (input.visibility !== 'public' && input.visibility !== 'private') {
    throw BadRequest('Visibility must be public or private');
  }
  if (input.visibility === 'private') {
    const normalized = normalizePrivateParticipantIds(input.userId, input.participantUserIds ?? []);
    if (normalized.length < 2) {
      throw BadRequest('Private channel requires at least 2 participants');
    }
    const validUsers = await listValidCompanyUserIdsRepo({
      companyId: input.companyId,
      userIds: normalized,
    });
    if (validUsers.length !== normalized.length) {
      throw BadRequest('Some participants are not valid system users');
    }
    return createCommunicationChannelsRepo({
      ...input,
      participantUserIds: validUsers,
    });
  }

  return createCommunicationChannelsRepo({
    ...input,
    participantUserIds: [],
  });
}

export async function ensureCommunicationChannelThreadSvc(input: {
  companyId: string;
  userId: string;
  channelId: string;
}): Promise<string> {
  const canAccess = await canAccessChannelAccessRepo({
    companyId: input.companyId,
    channelId: input.channelId,
    userId: input.userId,
  });
  if (!canAccess) throw Forbidden('You do not have access to this channel');

  const threadId = await ensureCommunicationChannelThreadRepo(input);
  if (!threadId) throw NotFound('Channel not found');
  return threadId;
}

export async function updateCommunicationChannelsSvc(
  input: CommunicationChannelsUpdateInput,
): Promise<CommunicationChannelsItem> {
  if (input.name !== undefined && !(input.name ?? '').trim()) {
    throw BadRequest('Channel name cannot be empty');
  }
  await ensureCanManageChannel({
    companyId: input.companyId,
    userId: input.userId,
    channelId: input.id,
  });
  const updated = await updateCommunicationChannelsRepo(input);
  if (!updated) throw NotFound('Channel not found');
  return updated;
}

export async function addCommunicationChannelParticipantsSvc(
  input: CommunicationChannelsParticipantsInput,
): Promise<CommunicationChannelsItem> {
  const channel = await ensureCanManageChannel({
    companyId: input.companyId,
    userId: input.userId,
    channelId: input.id,
  });
  if (channel.visibility !== 'private') {
    throw BadRequest('Participants can only be managed on private channels');
  }

  const participantUserIds = normalizePrivateParticipantIds(input.userId, input.participantUserIds);
  const validUsers = await listValidCompanyUserIdsRepo({
    companyId: input.companyId,
    userIds: participantUserIds,
  });
  if (validUsers.length !== participantUserIds.length) {
    throw BadRequest('Some participants are not valid system users');
  }

  const updated = await addCommunicationChannelParticipantsRepo({
    ...input,
    participantUserIds: validUsers,
  });
  if (!updated) throw NotFound('Channel not found');
  return updated;
}

export async function removeCommunicationChannelParticipantSvc(
  input: CommunicationChannelsRemoveParticipantInput,
): Promise<CommunicationChannelsItem> {
  const channel = await ensureCanManageChannel({
    companyId: input.companyId,
    userId: input.userId,
    channelId: input.id,
  });
  if (channel.visibility !== 'private') {
    throw BadRequest('Participants can only be managed on private channels');
  }
  if (input.participantUserId === channel.createdBy) {
    throw BadRequest('Channel creator cannot be removed from channel');
  }

  const updated = await removeCommunicationChannelParticipantRepo(input);
  if (!updated) throw NotFound('Channel not found');
  return updated;
}
