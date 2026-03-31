import { BadRequest, Forbidden } from '@/server/utils/http-error';
import type {
  CommunicationMessagesCreateInput,
  CommunicationMessagesDeleteInput,
  CommunicationMeetingItem,
  CommunicationMeetingsListInput,
  CommunicationMessagesItem,
  CommunicationMessagesListInput,
  CommunicationMessagesToggleFlagInput,
  CommunicationMessagesUpdateInput,
} from './dto';
import {
  createCommunicationMessagesRepo,
  getCommunicationMessageByIdRepo,
  isThreadParticipantRepo,
  listCommunicationMeetingsRepo,
  listCommunicationMessagesRepo,
  softDeleteCommunicationMessageRepo,
  toggleCommunicationMessageFlagRepo,
  updateCommunicationMessageRepo,
} from './repository';
import { emitCommunicationMessageCreated } from '../realtime';

const EDIT_DELETE_WINDOW_MS = 5 * 60 * 1000;

export async function listCommunicationMessagesSvc(
  input: CommunicationMessagesListInput,
): Promise<CommunicationMessagesItem[]> {
  const isParticipant = await isThreadParticipantRepo({
    threadId: input.threadId,
    userId: input.userId,
    companyId: input.companyId,
  });
  if (!isParticipant) throw Forbidden('You do not have access to this thread');
  return listCommunicationMessagesRepo(input);
}

export async function listCommunicationMeetingsSvc(
  input: CommunicationMeetingsListInput,
): Promise<CommunicationMeetingItem[]> {
  return listCommunicationMeetingsRepo(input);
}

export async function createCommunicationMessagesSvc(
  input: CommunicationMessagesCreateInput,
): Promise<CommunicationMessagesItem> {
  const isParticipant = await isThreadParticipantRepo({
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
  const isParticipant = await isThreadParticipantRepo({
    threadId: existing.threadId,
    userId: input.userId,
    companyId: input.companyId,
  });
  if (!isParticipant) throw Forbidden('You do not have access to this thread');
  if (existing.senderUserId !== input.userId) {
    throw Forbidden('Only the sender can edit this message');
  }
  ensureWithinEditableWindow(existing.createdAt);
  if (!input.body && !input.metadataJson) {
    throw BadRequest('Message body or metadata is required');
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
  const isParticipant = await isThreadParticipantRepo({
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
  const isParticipant = await isThreadParticipantRepo({
    threadId: existing.threadId,
    userId: input.userId,
    companyId: input.companyId,
  });
  if (!isParticipant) throw Forbidden('You do not have access to this thread');
  return toggleCommunicationMessageFlagRepo(input);
}
