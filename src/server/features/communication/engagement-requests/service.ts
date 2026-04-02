import { BadRequest, Forbidden, NotFound } from '@/server/utils/http-error';
import type {
  CommunicationEngagementRequestsCreateInput,
  CommunicationEngagementRequestsDecideInput,
  CommunicationEngagementRequestsItem,
  CommunicationEngagementRequestsListInput,
} from './dto';
import {
  createCommunicationEngagementRequestsRepo,
  decideCommunicationEngagementRequestRepo,
  getPendingEngagementRequestForDecisionRepo,
  listCommunicationEngagementRequestsRepo,
} from './repository';

export async function listCommunicationEngagementRequestsSvc(
  input: CommunicationEngagementRequestsListInput,
): Promise<CommunicationEngagementRequestsItem[]> {
  return listCommunicationEngagementRequestsRepo(input);
}

export async function createCommunicationEngagementRequestsSvc(
  input: CommunicationEngagementRequestsCreateInput,
): Promise<CommunicationEngagementRequestsItem> {
  if (input.requesterUserId === input.targetUserId) {
    throw BadRequest('You cannot create an engagement request for yourself');
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
  return decideCommunicationEngagementRequestRepo(input);
}
