import {
  createPickupQueueSvc,
  getPickupQueueByParcelSvc,
  listActivePickupQueueCardsForBranchSvc,
  listActivePickupQueuesForBranchSvc,
} from './service';

export const createPickupQueueCtrl = createPickupQueueSvc;
export const getPickupQueueByParcelCtrl = getPickupQueueByParcelSvc;
export const listActivePickupQueuesForBranchCtrl = listActivePickupQueuesForBranchSvc;
export const listActivePickupQueueCardsForBranchCtrl = listActivePickupQueueCardsForBranchSvc;
