import type { CommunicationCallsCreateInput, CommunicationCallsListInput } from './dto';
import { createCommunicationCallsSvc, listCommunicationCallsSvc } from './service';

export async function listCommunicationCallsCtrl(input: CommunicationCallsListInput) {
  return listCommunicationCallsSvc(input);
}

export async function createCommunicationCallsCtrl(input: CommunicationCallsCreateInput) {
  return createCommunicationCallsSvc(input);
}
