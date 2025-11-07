import {
  createPaymentSvc,
  listPaymentsForParcelSvc,
  sumPrincipalPaidForParcelSvc,
} from './service';

export const createPaymentCtrl = createPaymentSvc;
export const listPaymentsForParcelCtrl = listPaymentsForParcelSvc;
export const sumPrincipalPaidForParcelCtrl = sumPrincipalPaidForParcelSvc;
