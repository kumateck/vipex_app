import type {
  CommunicationMessagesCreateInput,
  CommunicationMessagesDeleteInput,
  CommunicationMeetingsListInput,
  CommunicationMessagesListInput,
  CommunicationMessagesToggleFlagInput,
  CommunicationMessagesUpdateInput,
} from './dto';
import {
  createCommunicationMessagesSvc,
  deleteCommunicationMessageSvc,
  listCommunicationMeetingsSvc,
  listCommunicationMessagesSvc,
  toggleCommunicationMessageFlagSvc,
  updateCommunicationMessageSvc,
} from './service';

export async function listCommunicationMessagesCtrl(input: CommunicationMessagesListInput) {
  return listCommunicationMessagesSvc(input);
}

export async function listCommunicationMeetingsCtrl(input: CommunicationMeetingsListInput) {
  return listCommunicationMeetingsSvc(input);
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
