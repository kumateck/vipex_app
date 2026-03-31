import { BadRequest, Forbidden } from '@/server/utils/http-error';
import type {
  CommunicationMessagesCreateInput,
  CommunicationMessagesItem,
  CommunicationMessagesListInput,
} from './dto';
import {
  createCommunicationMessagesRepo,
  isThreadParticipantRepo,
  listCommunicationMessagesRepo,
} from './repository';

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
  return createCommunicationMessagesRepo(input);
}
