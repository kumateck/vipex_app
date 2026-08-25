import { getSelfServiceBranchInfoSvc, submitSelfServiceDraftSvc } from './public-draft.service';
import { issueSelfServiceSessionSvc } from './session.service';
import { lookupSelfServiceCustomerByPhoneSvc } from './customer-lookup.service';
import {
  listSelfServiceDestinationBranchesSvc,
  listSelfServiceDestinationLocationsSvc,
} from './destination.service';

export const getSelfServiceBranchInfoCtrl = getSelfServiceBranchInfoSvc;
export const issueSelfServiceSessionCtrl = issueSelfServiceSessionSvc;
export const submitSelfServiceDraftCtrl = submitSelfServiceDraftSvc;
export const lookupSelfServiceCustomerCtrl = lookupSelfServiceCustomerByPhoneSvc;
export const listSelfServiceDestinationBranchesCtrl = listSelfServiceDestinationBranchesSvc;
export const listSelfServiceDestinationLocationsCtrl = listSelfServiceDestinationLocationsSvc;
