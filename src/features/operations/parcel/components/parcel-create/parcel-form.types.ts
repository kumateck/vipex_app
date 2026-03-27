export type PaymentResponsibility = 'SENDER' | 'RECEIVER';
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
  parcelDetails: string;
  parcelContent: string;
  parcelValue: string;
  charge: string;
  paymentResponsibility: PaymentResponsibility;
  senderSettlementMode: SenderSettlementMode;
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
    bookingCode: string;
    trackingCode: string;
    parcelDetails: string;
    senderName: string;
    senderTelephone: string;
    receiverName: string;
    receiverTelephone: string;
    destinationBranchName: string;
    destinationLocationName: string;
    totalChargeCedis: number;
    senderPaidCedis: number;
    receiverToPayCedis: number;
    issuedAt: string;
  }>;
};
