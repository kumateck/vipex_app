export type DeliveryConfirmationSnapshot = {
  parcelStatus: number;
  confirmedAt: string | null;
  confirmedBy: string | null;
  plannedToBePaidPsw: number;
  paymentIds: string[];
  creditChargeIds: string[];
  pickupQueueId: string | null;
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
