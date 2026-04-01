import { BadRequest, Forbidden } from '@/server/utils/http-error';
import type {
  CommunicationMessagesCreateInput,
  CommunicationMessagesDeleteInput,
  CommunicationMessagesMarkThreadReadInput,
  CommunicationMeetingItem,
  CommunicationMeetingsListInput,
  CommunicationMessagesItem,
  CommunicationMessagesListInput,
  CommunicationMessagesUnreadCountItem,
  CommunicationMessagesUnreadCountsInput,
  CommunicationMessagesToggleFlagInput,
  CommunicationMessagesToggleReactionInput,
  CommunicationMessagesUpdateInput,
} from './dto';
import {
  createCommunicationMessagesRepo,
  getCommunicationMessageByIdRepo,
  listCommunicationMessagesUnreadCountsRepo,
  listCommunicationMeetingsRepo,
  listCommunicationMessagesRepo,
  markCommunicationThreadReadRepo,
  softDeleteCommunicationMessageRepo,
  toggleCommunicationMessageFlagRepo,
  toggleCommunicationMessageReactionRepo,
  updateCommunicationMessageRepo,
} from './repository';
import { emitCommunicationMessageCreated } from '../realtime';
import { isThreadParticipantAccessRepo } from '../access/repository';

const EDIT_DELETE_WINDOW_MS = 5 * 60 * 1000;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function isReactionOnlyMetadataPatch(existingMetadata: unknown, nextMetadata: unknown): boolean {
  const current = asRecord(existingMetadata) ?? {};
  const next = asRecord(nextMetadata);
  if (!next) return false;

  const keys = new Set([...Object.keys(current), ...Object.keys(next)]);
  for (const key of keys) {
    if (key === 'reactions') continue;
    if (JSON.stringify(current[key]) !== JSON.stringify(next[key])) {
      return false;
    }
  }
  return true;
}

export async function listCommunicationMessagesSvc(
  input: CommunicationMessagesListInput,
): Promise<CommunicationMessagesItem[]> {
  const isParticipant = await isThreadParticipantAccessRepo({
    threadId: input.threadId,
    userId: input.userId,
    companyId: input.companyId,
  });
  if (!isParticipant) throw Forbidden('You do not have access to this thread');
  return listCommunicationMessagesRepo(input);
}

export async function listCommunicationMessagesUnreadCountsSvc(
  input: CommunicationMessagesUnreadCountsInput,
): Promise<CommunicationMessagesUnreadCountItem[]> {
  return listCommunicationMessagesUnreadCountsRepo(input);
}

export async function markCommunicationThreadReadSvc(
  input: CommunicationMessagesMarkThreadReadInput,
): Promise<{ threadId: string; readAt: string | null }> {
  const isParticipant = await isThreadParticipantAccessRepo({
    threadId: input.threadId,
    userId: input.userId,
    companyId: input.companyId,
  });
  if (!isParticipant) throw Forbidden('You do not have access to this thread');
  return markCommunicationThreadReadRepo(input);
}

export async function listCommunicationMeetingsSvc(
  input: CommunicationMeetingsListInput,
): Promise<CommunicationMeetingItem[]> {
  return listCommunicationMeetingsRepo(input);
}

export async function createCommunicationMessagesSvc(
  input: CommunicationMessagesCreateInput,
): Promise<CommunicationMessagesItem> {
  const isParticipant = await isThreadParticipantAccessRepo({
    threadId: input.threadId,
    userId: input.userId,
    companyId: input.companyId,
  });
  if (!isParticipant) throw Forbidden('You do not have access to this thread');

  if (!input.body && !input.metadataJson) {
    throw BadRequest('Message body or metadata is required');
  }
  const created = await createCommunicationMessagesRepo(input);
  emitCommunicationMessageCreated(input.companyId, created);
  return created;
}

function ensureWithinEditableWindow(createdAt: string | null) {
  if (!createdAt) throw BadRequest('Message timestamp is missing');
  const createdTime = new Date(createdAt).getTime();
  if (!Number.isFinite(createdTime)) throw BadRequest('Message timestamp is invalid');
  if (Date.now() - createdTime > EDIT_DELETE_WINDOW_MS) {
    throw BadRequest('You can only edit or delete messages within 5 minutes.');
  }
}

export async function updateCommunicationMessageSvc(
  input: CommunicationMessagesUpdateInput,
): Promise<CommunicationMessagesItem> {
  const existing = await getCommunicationMessageByIdRepo({
    id: input.id,
    companyId: input.companyId,
  });
  if (!existing) throw BadRequest('Message not found');
  const isParticipant = await isThreadParticipantAccessRepo({
    threadId: existing.threadId,
    userId: input.userId,
    companyId: input.companyId,
  });
  if (!isParticipant) throw Forbidden('You do not have access to this thread');
  const hasBodyUpdate = input.body !== undefined;
  const hasMetadataUpdate = input.metadataJson !== undefined;
  if (!hasBodyUpdate && !hasMetadataUpdate) {
    throw BadRequest('Message body or metadata is required');
  }

  const isReactionOnlyUpdate =
    !hasBodyUpdate &&
    hasMetadataUpdate &&
    isReactionOnlyMetadataPatch(existing.metadataJson, input.metadataJson);

  if (existing.senderUserId !== input.userId && !isReactionOnlyUpdate) {
    throw Forbidden('Only the sender can edit this message');
  }

  if (hasBodyUpdate) {
    ensureWithinEditableWindow(existing.createdAt);
  }

  return updateCommunicationMessageRepo(input);
}

export async function deleteCommunicationMessageSvc(
  input: CommunicationMessagesDeleteInput,
): Promise<CommunicationMessagesItem> {
  const existing = await getCommunicationMessageByIdRepo({
    id: input.id,
    companyId: input.companyId,
  });
  if (!existing) throw BadRequest('Message not found');
  const isParticipant = await isThreadParticipantAccessRepo({
    threadId: existing.threadId,
    userId: input.userId,
    companyId: input.companyId,
  });
  if (!isParticipant) throw Forbidden('You do not have access to this thread');
  if (existing.senderUserId !== input.userId) {
    throw Forbidden('Only the sender can delete this message');
  }
  ensureWithinEditableWindow(existing.createdAt);
  return softDeleteCommunicationMessageRepo(input);
}

export async function toggleCommunicationMessageFlagSvc(
  input: CommunicationMessagesToggleFlagInput,
): Promise<CommunicationMessagesItem> {
  const existing = await getCommunicationMessageByIdRepo({
    id: input.id,
    companyId: input.companyId,
  });
  if (!existing) throw BadRequest('Message not found');
  const isParticipant = await isThreadParticipantAccessRepo({
    threadId: existing.threadId,
    userId: input.userId,
    companyId: input.companyId,
  });
  if (!isParticipant) throw Forbidden('You do not have access to this thread');
  return toggleCommunicationMessageFlagRepo(input);
}

export async function toggleCommunicationMessageReactionSvc(
  input: CommunicationMessagesToggleReactionInput,
): Promise<CommunicationMessagesItem> {
  const existing = await getCommunicationMessageByIdRepo({
    id: input.id,
    companyId: input.companyId,
  });
  if (!existing) throw BadRequest('Message not found');
  const isParticipant = await isThreadParticipantAccessRepo({
    threadId: existing.threadId,
    userId: input.userId,
    companyId: input.companyId,
  });
  if (!isParticipant) throw Forbidden('You do not have access to this thread');
  return toggleCommunicationMessageReactionRepo(input);
}
