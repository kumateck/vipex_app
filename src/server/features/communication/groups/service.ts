import type {
  CommunicationGroupsCreateInput,
  CommunicationGroupsItem,
  CommunicationGroupsListInput,
} from './dto';
import { createCommunicationGroupsRepo, listCommunicationGroupsRepo } from './repository';
import { BadRequest } from '@/server/utils/http-error';

export async function listCommunicationGroupsSvc(
  input: CommunicationGroupsListInput,
): Promise<CommunicationGroupsItem[]> {
  return listCommunicationGroupsRepo(input);
}

export async function createCommunicationGroupsSvc(
  input: CommunicationGroupsCreateInput,
): Promise<CommunicationGroupsItem> {
  if (!input.name.trim()) throw BadRequest('Group name is required');
  return createCommunicationGroupsRepo(input);
}
