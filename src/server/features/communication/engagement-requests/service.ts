import { BadRequest, Forbidden, NotFound } from '@/server/utils/http-error';
import type {
  CommunicationEngagementRequestsCreateInput,
  CommunicationEngagementRequestsDecideInput,
  CommunicationEngagementRequestTargetItem,
  CommunicationEngagementRequestsItem,
  CommunicationEngagementRequestsListInput,
} from './dto';
import {
  createCommunicationEngagementRequestsRepo,
  decideCommunicationEngagementRequestRepo,
  hasPendingEngagementRequestRepo,
  listCommunicationEngagementRequestTargetsRepo,
  getPendingEngagementRequestForDecisionRepo,
  requiresRequestForDirectThreadRepo,
  listCommunicationEngagementRequestsRepo,
} from './repository';
import { createCommunicationThreadRepo, findExistingDirectThreadRepo } from '../threads/repository';
import { emitCommunicationThreadCreated } from '../realtime';

export async function listCommunicationEngagementRequestsSvc(
  input: CommunicationEngagementRequestsListInput,
): Promise<CommunicationEngagementRequestsItem[]> {
  return listCommunicationEngagementRequestsRepo(input);
}

export async function listCommunicationEngagementRequestTargetsSvc(input: {
  companyId: string;
  requesterUserId: string;
}): Promise<CommunicationEngagementRequestTargetItem[]> {
  return listCommunicationEngagementRequestTargetsRepo(input);
}

export async function createCommunicationEngagementRequestsSvc(
  input: CommunicationEngagementRequestsCreateInput,
): Promise<CommunicationEngagementRequestsItem> {
  if (input.requesterUserId === input.targetUserId) {
    throw BadRequest('You cannot create an engagement request for yourself');
  }
  const needsApproval = await requiresRequestForDirectThreadRepo({
    companyId: input.companyId,
    requesterUserId: input.requesterUserId,
    targetUserId: input.targetUserId,
  });
  if (!needsApproval) {
    throw BadRequest('A chat request is only required for users outside your direct chat scope');
  }

  const hasPending = await hasPendingEngagementRequestRepo({
    companyId: input.companyId,
    requesterUserId: input.requesterUserId,
    targetUserId: input.targetUserId,
  });
  if (hasPending) {
    throw BadRequest('A pending chat request already exists for this user');
  }
  return createCommunicationEngagementRequestsRepo(input);
}

export async function decideCommunicationEngagementRequestsSvc(
  input: CommunicationEngagementRequestsDecideInput,
): Promise<CommunicationEngagementRequestsItem> {
  const request = await getPendingEngagementRequestForDecisionRepo({
    id: input.id,
    companyId: input.companyId,
  });
  if (!request) throw NotFound('Pending engagement request not found');
  if (request.targetUserId !== input.actingUserId) {
    throw Forbidden('Only the target user can approve or decline this request');
  }
  const decided = await decideCommunicationEngagementRequestRepo(input);
  if (!input.approve) return decided;

  const existing = await findExistingDirectThreadRepo({
    companyId: input.companyId,
    participantUserIds: [request.requesterUserId, request.targetUserId],
  });
  if (existing) return decided;

  const created = await createCommunicationThreadRepo({
    companyId: input.companyId,
    userId: input.actingUserId,
    threadType: 'direct',
    title: null,
    participantUserIds: [request.requesterUserId, request.targetUserId],
  });
  emitCommunicationThreadCreated({
    companyId: input.companyId,
    id: created.id,
    threadType: 'direct',
    userId: input.actingUserId,
  });
  return decided;
}
