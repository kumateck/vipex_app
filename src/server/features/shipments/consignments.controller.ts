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
import {
  getConsignmentPrintPayloadSvc,
  listConsignmentHistorySvc,
} from './consignment-history.service';

export const createConsignmentCtrl = createConsignmentSvc;
export const addItemsToConsignmentCtrl = addItemsToConsignmentSvc;
export const removeItemFromConsignmentCtrl = removeItemFromConsignmentSvc;
export const getConsignmentDetailCtrl = getConsignmentDetailSvc;
export const listConsignmentItemsCtrl = listConsignmentItemsSvc;
export const listIncomingConsignmentsCtrl = listIncomingConsignmentsSvc;
export const receiveConsignmentItemCtrl = receiveConsignmentItemSvc;
export const closeConsignmentCtrl = closeConsignmentSvc;
export const listConsignmentHistoryCtrl = listConsignmentHistorySvc;
export const getConsignmentPrintPayloadCtrl = getConsignmentPrintPayloadSvc;
