import type { CommunicationChannelsCreateInput, CommunicationChannelsListInput } from './dto';
import { createCommunicationChannelsSvc, listCommunicationChannelsSvc } from './service';

export async function listCommunicationChannelsCtrl(input: CommunicationChannelsListInput) {
  return listCommunicationChannelsSvc(input);
}

export async function createCommunicationChannelsCtrl(input: CommunicationChannelsCreateInput) {
  return createCommunicationChannelsSvc(input);
}
