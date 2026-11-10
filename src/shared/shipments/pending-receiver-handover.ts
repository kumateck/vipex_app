import type { DeliveryConfirmationSnapshot } from './delivery-confirmation-snapshot';

import type { ReceiverCashierSignature } from './receiver-cashier-signature';

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
  capture?: ReceiverHandoverCapture;
  snapshot: DeliveryConfirmationSnapshot;
};
