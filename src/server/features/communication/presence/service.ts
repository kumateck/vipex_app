import type {
  CommunicationPresenceCreateInput,
  CommunicationPresenceItem,
  CommunicationPresenceListInput,
} from './dto';
import { createCommunicationPresenceRepo, listCommunicationPresenceRepo } from './repository';
import { emitCommunicationPresenceUpdated } from '../realtime';

export async function listCommunicationPresenceSvc(
  input: CommunicationPresenceListInput,
): Promise<CommunicationPresenceItem[]> {
  return listCommunicationPresenceRepo(input);
}

export async function createCommunicationPresenceSvc(
  input: CommunicationPresenceCreateInput,
): Promise<CommunicationPresenceItem> {
  const updated = await createCommunicationPresenceRepo(input);
  emitCommunicationPresenceUpdated(input.companyId, updated);
  return updated;
}
