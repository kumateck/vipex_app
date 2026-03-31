import type { CommunicationPresenceCreateInput, CommunicationPresenceListInput } from './dto';
import { createCommunicationPresenceSvc, listCommunicationPresenceSvc } from './service';

export async function listCommunicationPresenceCtrl(input: CommunicationPresenceListInput) {
  return listCommunicationPresenceSvc(input);
}

export async function createCommunicationPresenceCtrl(input: CommunicationPresenceCreateInput) {
  return createCommunicationPresenceSvc(input);
}
