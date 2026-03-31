import type {
  CommunicationChannelsCreateInput,
  CommunicationChannelsItem,
  CommunicationChannelsListInput,
} from './dto';
import { createCommunicationChannelsRepo, listCommunicationChannelsRepo } from './repository';
import { BadRequest } from '@/server/utils/http-error';

export async function listCommunicationChannelsSvc(
  input: CommunicationChannelsListInput,
): Promise<CommunicationChannelsItem[]> {
  return listCommunicationChannelsRepo(input);
}

export async function createCommunicationChannelsSvc(
  input: CommunicationChannelsCreateInput,
): Promise<CommunicationChannelsItem> {
  if (!input.name.trim()) throw BadRequest('Channel name is required');
  return createCommunicationChannelsRepo(input);
}
