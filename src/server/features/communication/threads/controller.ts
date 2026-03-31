import type { CommunicationThreadsCreateInput, CommunicationThreadsListInput } from './dto';
import { createCommunicationThreadsSvc, listCommunicationThreadsSvc } from './service';

export async function listCommunicationThreadsCtrl(input: CommunicationThreadsListInput) {
  return listCommunicationThreadsSvc(input);
}

export async function createCommunicationThreadsCtrl(input: CommunicationThreadsCreateInput) {
  return createCommunicationThreadsSvc(input);
}
