import {
  createDeliverySvc,
  doorToDoorAssignSvc,
  doorToDoorCallSvc,
  doorToDoorCompleteSvc,
  doorToDoorOutForDeliverySvc,
  markOfficePickupCompleteSvc,
} from './service';

export const createDeliveryCtrl = createDeliverySvc;
export const markOfficePickupCompleteCtrl = markOfficePickupCompleteSvc;
export const ddCallCtrl = doorToDoorCallSvc;
export const ddAssignCtrl = doorToDoorAssignSvc;
export const ddOutCtrl = doorToDoorOutForDeliverySvc;
export const ddCompleteCtrl = doorToDoorCompleteSvc;
