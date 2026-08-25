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
  listDoorstepByRiderSvc,
  markOfficePickupCompleteSvc,
  riderBranchBenchmarkSvc,
} from './service';
import { doorToDoorRiderGivenToCustomerSvc } from './rider-handover.service';
import { getRiderDailyAnalyticsSvc } from './rider-daily-analytics.service';

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
export const ddRiderBranchBenchmarkCtrl = riderBranchBenchmarkSvc;
export const ddRiderDailyAnalyticsCtrl = getRiderDailyAnalyticsSvc;
