import { BadRequest, Forbidden } from '@/server/utils/http-error';
import type {
  CommunicationThreadsCreateInput,
  CommunicationThreadsItem,
  CommunicationThreadsListInput,
} from './dto';
import {
  createCommunicationThreadRepo,
  findExistingDirectThreadRepo,
  listCommunicationThreadsRepo,
} from './repository';
import { emitCommunicationThreadCreated } from '../realtime';
import {
  hasApprovedEngagementAccessRepo,
  requiresRequestForDirectThreadRepo,
} from '../engagement-requests/repository';

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
  if (input.threadType === 'direct') {
    const peerUserId = participantUserIds.find((id) => id !== input.userId);
    if (!peerUserId) throw BadRequest('Direct thread requires a peer user');
    const needsApproval = await requiresRequestForDirectThreadRepo({
      companyId: input.companyId,
      requesterUserId: input.userId,
      targetUserId: peerUserId,
    });
    if (needsApproval) {
      const hasApprovedAccess = await hasApprovedEngagementAccessRepo({
        companyId: input.companyId,
        requesterUserId: input.userId,
        targetUserId: peerUserId,
      });
      if (!hasApprovedAccess) {
        throw Forbidden('Chat request approval is required before starting this direct thread');
      }
    }

    const existing = await findExistingDirectThreadRepo({
      companyId: input.companyId,
      participantUserIds: [participantUserIds[0]!, participantUserIds[1]!],
    });
    if (existing) return existing;
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
