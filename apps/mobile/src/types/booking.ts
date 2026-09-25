export type CustomerLookupResult = {
  id: string;
  fullname: string;
  telephone?: string | null;
  telephone2?: string | null;
};

export type BranchOption = {
  id: string;
  name: string;
  type: number;
};

export type LocationOption = {
  id: string;
  name: string;
  branchId: string;
};

export type CreateBookingWithParcelsInput = {
  senderId: string;
  status: number;
  deferSenderCashierCompletion?: boolean;
  completeToBePaid?: boolean;
  parcels: Array<{
    destinationId: string;
    pickupLocationId?: string | null;
    receiverId: string;
    status: number;
    parcelDetails: string;
    parcelContent: string;
    method: number;
    parcelValueCedis?: number;
    chargeCedis?: number;
    plannedToBePaidCedis?: number;
    senderPaymentCedis?: number;
    paymentResponsibility?: number;
  }>;
};

export type CreateBookingWithParcelsResponse = {
  bookingId: string;
  parcels: Array<{ id: string; trackingCode: string; bookingCode: string }>;
  payments: Array<{ id: string }>;
};
