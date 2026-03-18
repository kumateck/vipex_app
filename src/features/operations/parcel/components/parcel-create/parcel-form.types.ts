export type PaymentResponsibility = 'SENDER' | 'RECEIVER';

export type CustomerFormValues = {
  telephone: string;
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
    trackingCode: string;
    paymentResponsibility: PaymentResponsibility;
    amountCedis: number;
  }>;
};
