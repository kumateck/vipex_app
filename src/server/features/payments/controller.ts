import {
  collectReceiverPaymentAndDeliverSvc,
  collectSenderPaymentAndProcessSvc,
  createPaymentSvc,
  listPaymentsForParcelSvc,
  sumPrincipalPaidForParcelSvc,
} from './service';
import { requestReceiverOtpSvc, verifyReceiverOtpSvc } from '../parcel-receiver-otp/service';

export const createPaymentCtrl = createPaymentSvc;
export const collectSenderPaymentAndProcessCtrl = collectSenderPaymentAndProcessSvc;
export const collectReceiverPaymentAndDeliverCtrl = collectReceiverPaymentAndDeliverSvc;
export const listPaymentsForParcelCtrl = listPaymentsForParcelSvc;
export const sumPrincipalPaidForParcelCtrl = sumPrincipalPaidForParcelSvc;
export const requestReceiverOtpCtrl = requestReceiverOtpSvc;
export const verifyReceiverOtpCtrl = verifyReceiverOtpSvc;
