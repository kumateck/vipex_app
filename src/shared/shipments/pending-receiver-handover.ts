import type { DeliveryConfirmationSnapshot } from './delivery-confirmation-snapshot';

import type { ReceiverCashierSignature } from './receiver-cashier-signature';
import type { PaymentMethod } from '@/db/schemas/enums';

export type ReceiverHandoverPaymentPlan = {
  method: PaymentMethod;
  principalPsw: number;
  storagePsw: number;
  chargePsw: number;
  existingPaymentIds: string[];
  momoTransactionId: string | null;
};

export type ReceiverHandoverCapture = ReceiverCashierSignature & {
  capturedAt: string;
  capturedBy: string;
};

export type PendingReceiverHandover = {
  id: string;
  companyId: string;
  branchId: string;
  requestedAt: string;
  requestedBy: string;
  receiverId: string;
  collectorId: string;
  collectorName: string;
  handoverTarget: 'main' | 'second';
  associateId: string;
  associateName: string;
  storageAccruedPsw: number;
  otpVerified: boolean;
  /** Absent on legacy handovers whose payments were already posted. */
  paymentPlan?: ReceiverHandoverPaymentPlan;
  capture?: ReceiverHandoverCapture;
  snapshot: DeliveryConfirmationSnapshot;
};
