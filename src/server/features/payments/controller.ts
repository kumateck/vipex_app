import {
  collectReceiverPaymentAndDeliverSvc,
  collectSenderPaymentAndProcessSvc,
  createPaymentSvc,
  listPaymentsForParcelSvc,
  sumPrincipalPaidForParcelSvc,
} from './service';

export const createPaymentCtrl = createPaymentSvc;
export const collectSenderPaymentAndProcessCtrl = collectSenderPaymentAndProcessSvc;
export const collectReceiverPaymentAndDeliverCtrl = collectReceiverPaymentAndDeliverSvc;
export const listPaymentsForParcelCtrl = listPaymentsForParcelSvc;
export const sumPrincipalPaidForParcelCtrl = sumPrincipalPaidForParcelSvc;
