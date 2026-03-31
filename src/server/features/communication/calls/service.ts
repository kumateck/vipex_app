import type {
  CommunicationCallsCreateInput,
  CommunicationCallsItem,
  CommunicationCallsListInput,
} from './dto';
import { createCommunicationCallsRepo, listCommunicationCallsRepo } from './repository';
import { BadRequest } from '@/server/utils/http-error';

export async function listCommunicationCallsSvc(
  input: CommunicationCallsListInput,
): Promise<CommunicationCallsItem[]> {
  return listCommunicationCallsRepo(input);
}

export async function createCommunicationCallsSvc(
  input: CommunicationCallsCreateInput,
): Promise<CommunicationCallsItem> {
  if (!input.threadId && !input.channelId) {
    throw BadRequest('A call requires either threadId or channelId');
  }
  return createCommunicationCallsRepo(input);
}
