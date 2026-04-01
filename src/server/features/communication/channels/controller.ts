import type {
  CommunicationChannelsCreateInput,
  CommunicationChannelsGetByIdInput,
  CommunicationChannelsListInput,
  CommunicationChannelsMarkReadInput,
  CommunicationChannelsParticipantsInput,
  CommunicationChannelsRemoveParticipantInput,
  CommunicationChannelsUnreadCountsInput,
  CommunicationChannelsUpdateInput,
} from './dto';
import {
  addCommunicationChannelParticipantsSvc,
  createCommunicationChannelsSvc,
  getCommunicationChannelByIdSvc,
  listCommunicationChannelUnreadCountsSvc,
  listCommunicationChannelsSvc,
  markCommunicationChannelReadSvc,
  removeCommunicationChannelParticipantSvc,
  updateCommunicationChannelsSvc,
} from './service';

export async function listCommunicationChannelsCtrl(input: CommunicationChannelsListInput) {
  return listCommunicationChannelsSvc(input);
}

export async function listCommunicationChannelUnreadCountsCtrl(
  input: CommunicationChannelsUnreadCountsInput,
) {
  return listCommunicationChannelUnreadCountsSvc(input);
}

export async function getCommunicationChannelByIdCtrl(input: CommunicationChannelsGetByIdInput) {
  return getCommunicationChannelByIdSvc(input);
}

export async function createCommunicationChannelsCtrl(input: CommunicationChannelsCreateInput) {
  return createCommunicationChannelsSvc(input);
}

export async function updateCommunicationChannelsCtrl(input: CommunicationChannelsUpdateInput) {
  return updateCommunicationChannelsSvc(input);
}

export async function addCommunicationChannelParticipantsCtrl(
  input: CommunicationChannelsParticipantsInput,
) {
  return addCommunicationChannelParticipantsSvc(input);
}

export async function removeCommunicationChannelParticipantCtrl(
  input: CommunicationChannelsRemoveParticipantInput,
) {
  return removeCommunicationChannelParticipantSvc(input);
}

export async function markCommunicationChannelReadCtrl(input: CommunicationChannelsMarkReadInput) {
  return markCommunicationChannelReadSvc(input);
}
