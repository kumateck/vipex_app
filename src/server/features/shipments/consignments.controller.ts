import {
  addItemsToConsignmentSvc,
  createConsignmentSvc,
  removeItemFromConsignmentSvc,
} from './consignments.service';

export const createConsignmentCtrl = createConsignmentSvc;
export const addItemsToConsignmentCtrl = addItemsToConsignmentSvc;
export const removeItemFromConsignmentCtrl = removeItemFromConsignmentSvc;
