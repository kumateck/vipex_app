import type { CommunicationGroupsCreateInput, CommunicationGroupsListInput } from './dto';
import { createCommunicationGroupsSvc, listCommunicationGroupsSvc } from './service';

export async function listCommunicationGroupsCtrl(input: CommunicationGroupsListInput) {
  return listCommunicationGroupsSvc(input);
}

export async function createCommunicationGroupsCtrl(input: CommunicationGroupsCreateInput) {
  return createCommunicationGroupsSvc(input);
}
