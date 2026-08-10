export type PaymentResponsibility = 'SENDER' | 'RECEIVER' | 'SPLIT';
export type SenderSettlementMode = 'PAY_NOW' | 'CREDIT';

export type CustomerFormValues = {
  telephone: string;
  telephone2: string;
  customerId: string;
  fullname: string;
};

export type ParcelFormValues = {
  destinationBranchId: string;
  destinationLocationId: string;
  destinationLocationName: string;
  parcelDetails: string;
  parcelContent: string;
  parcelValue: string;
  charge: string;
  paymentResponsibility: PaymentResponsibility;
  senderSettlementMode: SenderSettlementMode;
  senderPartialPayment: string;
  receiver: CustomerFormValues;
};

export type ParcelBookingFormValues = {
  sender: CustomerFormValues;
  status: number | null;
  parcels: ParcelFormValues[];
};

export type ReceiptSummary = {
  bookingId: string;
  parcels: Array<{
    parcelId?: string;
    bookingCode: string;
    trackingCode: string;
    parcelDetails: string;
    parcelContent?: string | null;
    parcelValueCedis?: number | null;
    senderName: string;
    senderTelephone: string;
    senderTelephone2?: string | null;
    receiverName: string;
    receiverTelephone: string;
    receiverTelephone2?: string | null;
    destinationBranchName: string;
    destinationLocationName: string;
    totalChargeCedis: number;
    senderPaidCedis: number;
    receiverToPayCedis: number;
    amountPaidCedis?: number;
    issuedAt: string;
    taxBreakdown?: {
      vatCedis: number;
      getfundCedis: number;
      nhilCedis: number;
      covidCedis?: number;
      taxTotalCedis: number;
    };
  }>;
};

export type PendingSenderPaymentParcel = ReceiptSummary['parcels'][number] & {
  parcelId: string;
  senderDueCedis: number;
};
