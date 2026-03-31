import type {
  CommunicationPresenceCreateInput,
  CommunicationPresenceItem,
  CommunicationPresenceListInput,
} from './dto';
import { createCommunicationPresenceRepo, listCommunicationPresenceRepo } from './repository';

export async function listCommunicationPresenceSvc(
  input: CommunicationPresenceListInput,
): Promise<CommunicationPresenceItem[]> {
  return listCommunicationPresenceRepo(input);
}

export async function createCommunicationPresenceSvc(
  input: CommunicationPresenceCreateInput,
): Promise<CommunicationPresenceItem> {
  return createCommunicationPresenceRepo(input);
}
