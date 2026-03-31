import type {
  CommunicationEngagementRequestsCreateInput,
  CommunicationEngagementRequestsDecideInput,
  CommunicationEngagementRequestsListInput,
} from './dto';
import {
  createCommunicationEngagementRequestsSvc,
  decideCommunicationEngagementRequestsSvc,
  listCommunicationEngagementRequestsSvc,
} from './service';

export async function listCommunicationEngagementRequestsCtrl(
  input: CommunicationEngagementRequestsListInput,
) {
  return listCommunicationEngagementRequestsSvc(input);
}

export async function createCommunicationEngagementRequestsCtrl(
  input: CommunicationEngagementRequestsCreateInput,
) {
  return createCommunicationEngagementRequestsSvc(input);
}

export async function approveCommunicationEngagementRequestsCtrl(
  input: Omit<CommunicationEngagementRequestsDecideInput, 'approve'>,
) {
  return decideCommunicationEngagementRequestsSvc({ ...input, approve: true });
}

export async function declineCommunicationEngagementRequestsCtrl(
  input: Omit<CommunicationEngagementRequestsDecideInput, 'approve'>,
) {
  return decideCommunicationEngagementRequestsSvc({ ...input, approve: false });
}
