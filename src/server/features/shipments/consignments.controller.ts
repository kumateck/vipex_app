import {
  addItemsToConsignmentSvc,
  closeConsignmentSvc,
  createConsignmentSvc,
  getConsignmentDetailSvc,
  listConsignmentItemsSvc,
  listIncomingConsignmentsSvc,
  receiveConsignmentItemSvc,
  removeItemFromConsignmentSvc,
} from './consignments.service';

export const createConsignmentCtrl = createConsignmentSvc;
export const addItemsToConsignmentCtrl = addItemsToConsignmentSvc;
export const removeItemFromConsignmentCtrl = removeItemFromConsignmentSvc;
export const getConsignmentDetailCtrl = getConsignmentDetailSvc;
export const listConsignmentItemsCtrl = listConsignmentItemsSvc;
export const listIncomingConsignmentsCtrl = listIncomingConsignmentsSvc;
export const receiveConsignmentItemCtrl = receiveConsignmentItemSvc;
export const closeConsignmentCtrl = closeConsignmentSvc;
