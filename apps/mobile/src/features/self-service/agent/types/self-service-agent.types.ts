export type SelfServiceDraft = {
  id: string;
  status: number;
  senderFullname: string;
  senderPhone: string;
  senderPhone2: string | null;
  receiverFullname: string;
  receiverPhone: string;
  receiverPhone2: string | null;
  destinationBranchId: string | null;
  destinationLocationId: string | null;
  parcelContent: string;
  parcelValuePsw: number;
  callSender: boolean;
  expiresAt: string;
  claimedBy: string | null;
  claimedAt: string | null;
  createdAt: string;
};

export type CompleteSelfServiceDraftInput = {
  id: string;
  destinationId: string;
  pickupLocationId: string | null;
  parcelDetails: string;
  chargeCedis: string;
  paymentResponsibility: 'SENDER' | 'RECEIVER' | 'SPLIT';
  senderSettlementMode: 'PAY_NOW';
  senderPartialPaymentCedis: string | null;
};

export type CompleteSelfServiceDraftResponse = {
  bookingId: string;
  parcels: Array<{ id: string; trackingCode: string; bookingCode: string }>;
};
