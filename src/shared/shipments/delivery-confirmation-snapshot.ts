import type { ReceiverCashierSignature } from './receiver-cashier-signature';

export type DeliveryConfirmationSnapshot = {
  parcelStatus: number;
  confirmedAt: string | null;
  confirmedBy: string | null;
  plannedToBePaidPsw: number;
  paymentIds: string[];
  creditChargeIds: string[];
  pickupQueueId: string | null;
  receiverCashierReceiptTax?: {
    vatPsw: number;
    getfundPsw: number;
    nhilPsw: number;
    covidPsw: number;
    taxTotalPsw: number;
    taxComponentKeys: string[];
  };
  receiverCashierSignature?: ReceiverCashierSignature & {
    handoverId: string;
    collectorId: string;
    collectorName: string;
    handoverTarget: 'main' | 'second';
    capturedBy: string;
    capturedAt: string;
  };
  officePickupSignature?: {
    signatureImage: string;
    handoverTarget: 'main' | 'second';
    customerId: string;
    capturedBy: string;
  };
  handover: {
    secondReceiverId: string | null;
    secondReceiverNameSnapshot: string | null;
    cardId: string | null;
    cardNumber: string | null;
    secondCardId: string | null;
    secondCardNumber: string | null;
  };
  delivery: {
    status: string;
    amountPaidPsw: number;
    deliveredAt: string | null;
    confirmedAt: string | null;
    confirmedBy: string | null;
  } | null;
};
