import { BadRequest } from '@/server/utils/http-error';
import type {
  CommunicationThreadsCreateInput,
  CommunicationThreadsItem,
  CommunicationThreadsListInput,
} from './dto';
import { createCommunicationThreadRepo, listCommunicationThreadsRepo } from './repository';
import { emitCommunicationThreadCreated } from '../realtime';

export async function listCommunicationThreadsSvc(
  input: CommunicationThreadsListInput,
): Promise<CommunicationThreadsItem[]> {
  return listCommunicationThreadsRepo(input);
}

export async function createCommunicationThreadsSvc(
  input: CommunicationThreadsCreateInput,
): Promise<{ id: string }> {
  const uniqueParticipants = new Set(input.participantUserIds);
  uniqueParticipants.add(input.userId);
  const participantUserIds = [...uniqueParticipants];

  if (input.threadType === 'direct' && participantUserIds.length !== 2) {
    throw BadRequest('Direct thread must contain exactly 2 participants');
  }
  if (
    (input.threadType === 'group' || input.threadType === 'channel') &&
    participantUserIds.length < 2
  ) {
    throw BadRequest('Group or channel thread requires at least 2 participants');
  }

  const created = await createCommunicationThreadRepo({ ...input, participantUserIds });
  emitCommunicationThreadCreated({
    companyId: input.companyId,
    id: created.id,
    threadType: input.threadType,
    userId: input.userId,
  });
  return created;
}
