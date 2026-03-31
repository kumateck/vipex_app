import type {
  CommunicationCallsCreateLivekitTokenInput,
  CommunicationCallsCreateInput,
  CommunicationCallsListInput,
  CommunicationCallsUpdateStatusInput,
} from './dto';
import {
  createCommunicationCallLivekitTokenSvc,
  createCommunicationCallsSvc,
  listCommunicationCallsSvc,
  updateCommunicationCallStatusSvc,
} from './service';

export async function listCommunicationCallsCtrl(input: CommunicationCallsListInput) {
  return listCommunicationCallsSvc(input);
}

export async function createCommunicationCallsCtrl(input: CommunicationCallsCreateInput) {
  return createCommunicationCallsSvc(input);
}

export async function updateCommunicationCallStatusCtrl(
  input: CommunicationCallsUpdateStatusInput,
) {
  return updateCommunicationCallStatusSvc(input);
}

export async function createCommunicationCallLivekitTokenCtrl(
  input: CommunicationCallsCreateLivekitTokenInput,
) {
  return createCommunicationCallLivekitTokenSvc(input);
}
