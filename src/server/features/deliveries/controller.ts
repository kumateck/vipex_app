import {
  createDeliverySvc,
  doorToDoorAddressCollectedSvc,
  doorToDoorAssignSvc,
  doorToDoorCallSvc,
  doorToDoorCompleteSvc,
  doorToDoorDispatchBulkSvc,
  doorToDoorFinalizeAtOfficeSvc,
  doorToDoorOutForDeliverySvc,
  doorToDoorReturnToOfficeSvc,
  doorToDoorRiderGivenToCustomerSvc,
  listDoorstepByRiderSvc,
  markOfficePickupCompleteSvc,
} from './service';

export const createDeliveryCtrl = createDeliverySvc;
export const markOfficePickupCompleteCtrl = markOfficePickupCompleteSvc;
export const ddCallCtrl = doorToDoorCallSvc;
export const ddAssignCtrl = doorToDoorAssignSvc;
export const ddOutCtrl = doorToDoorOutForDeliverySvc;
export const ddCompleteCtrl = doorToDoorCompleteSvc;
export const ddAddressCollectedCtrl = doorToDoorAddressCollectedSvc;
export const ddDispatchBulkCtrl = doorToDoorDispatchBulkSvc;
export const ddListByRiderCtrl = listDoorstepByRiderSvc;
export const ddRiderGivenCtrl = doorToDoorRiderGivenToCustomerSvc;
export const ddReturnToOfficeCtrl = doorToDoorReturnToOfficeSvc;
export const ddFinalizeAtOfficeCtrl = doorToDoorFinalizeAtOfficeSvc;
