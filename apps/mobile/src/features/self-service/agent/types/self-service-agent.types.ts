export type SelfServiceDraft = {
  id: string;
  branchId: string;
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
  updatedAt: string;
};

export type CompleteSelfServiceDraftInput = {
  id: string;
  destinationId: string;
  pickupLocationId: string | null;
  parcelDetails: string;
  chargeCedis: string;
  chargeAgentUserId?: string | null;
  paymentResponsibility: 'SENDER' | 'RECEIVER' | 'SPLIT';
  senderSettlementMode: 'PAY_NOW';
  senderPartialPaymentCedis: string | null;
  callSender?: boolean;
};

export type CompleteSelfServiceDraftResponse = {
  bookingId: string;
  parcels: Array<{ id: string; trackingCode: string; bookingCode: string }>;
};

export type SelfServiceContactInput = { fullname: string; phone: string; phone2: string | null };

export type UpdateSelfServiceDraftInput = {
  id: string;
  expectedUpdatedAt: string;
  sender: SelfServiceContactInput;
  receiver: SelfServiceContactInput;
  destinationBranchId: string;
  destinationLocationId: string | null;
  parcelContent: string;
  parcelValueCedis: string;
};
