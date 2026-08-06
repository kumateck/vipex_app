import type {
  CommunicationMessagesCreateInput,
  CommunicationMessagesDeleteInput,
  CommunicationMessagesMarkThreadReadInput,
  CommunicationMeetingsListInput,
  CommunicationMessagesListInput,
  CommunicationMessagesUnreadCountsInput,
  CommunicationMessagesToggleFlagInput,
  CommunicationMessagesToggleReactionInput,
  CommunicationMessagesUpdateInput,
} from './dto';
import {
  createCommunicationMessagesSvc,
  deleteCommunicationMessageSvc,
  listCommunicationMeetingsSvc,
  listCommunicationMessagesSvc,
  listCommunicationMessagesUnreadCountsSvc,
  markCommunicationThreadReadSvc,
  toggleCommunicationMessageFlagSvc,
  toggleCommunicationMessageReactionSvc,
  updateCommunicationMessageSvc,
} from './service';

export async function listCommunicationMessagesCtrl(input: CommunicationMessagesListInput) {
  return listCommunicationMessagesSvc(input);
}

export async function listCommunicationMeetingsCtrl(input: CommunicationMeetingsListInput) {
  return listCommunicationMeetingsSvc(input);
}

export async function listCommunicationMessagesUnreadCountsCtrl(
  input: CommunicationMessagesUnreadCountsInput,
) {
  return listCommunicationMessagesUnreadCountsSvc(input);
}

export async function createCommunicationMessagesCtrl(input: CommunicationMessagesCreateInput) {
  return createCommunicationMessagesSvc(input);
}

export async function updateCommunicationMessageCtrl(input: CommunicationMessagesUpdateInput) {
  return updateCommunicationMessageSvc(input);
}

export async function deleteCommunicationMessageCtrl(input: CommunicationMessagesDeleteInput) {
  return deleteCommunicationMessageSvc(input);
}

export async function toggleCommunicationMessageFlagCtrl(
  input: CommunicationMessagesToggleFlagInput,
) {
  return toggleCommunicationMessageFlagSvc(input);
}

export async function toggleCommunicationMessageReactionCtrl(
  input: CommunicationMessagesToggleReactionInput,
) {
  return toggleCommunicationMessageReactionSvc(input);
}

export async function markCommunicationThreadReadCtrl(
  input: CommunicationMessagesMarkThreadReadInput,
) {
  return markCommunicationThreadReadSvc(input);
}
