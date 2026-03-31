import type { CommunicationMessagesCreateInput, CommunicationMessagesListInput } from './dto';
import { createCommunicationMessagesSvc, listCommunicationMessagesSvc } from './service';

export async function listCommunicationMessagesCtrl(input: CommunicationMessagesListInput) {
  return listCommunicationMessagesSvc(input);
}

export async function createCommunicationMessagesCtrl(input: CommunicationMessagesCreateInput) {
  return createCommunicationMessagesSvc(input);
}
