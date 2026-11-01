import { ParcelStatus, PaymentMethod, PaymentResponsibility } from '@/db/schemas';

export type CreateBookingWithParcelsBody = {
  senderId: string;
  companyId: string;
  sourceId: string;
  sourceLocationId?: string | null;
  status: number;
  createdBy: string;
  cashierSessionId?: string | null;
  bookingCode?: string | null;
  requireActiveCashierSession?: boolean;
  parcels: Array<{
    destinationId: string;
    pickupLocationId?: string | null;
    receiverId: string;
    status: number;
    parcelDetails: string;
    parcelContent: string;
    parcelValueCedis?: number | string | null;
    chargeCedis?: number | string | null;
    plannedToBePaidCedis?: number | string | null;
    method: PaymentMethod;
    trackingCode?: string | null;
    senderPaymentCedis?: number | string | null;
    senderPaymentMethod?: PaymentMethod;
    paymentResponsibility?: PaymentResponsibility;
    cashierUserId: string;
    chargeAgentUserId?: string | null;
    relatedStaffId?: string | null;
    branchId: string;
    callSender?: boolean;
  }>;
};

export function deferBookingToSenderCashier(
  body: CreateBookingWithParcelsBody,
): CreateBookingWithParcelsBody {
  return {
    ...body,
    status: ParcelStatus.CREATED,
    cashierSessionId: null,
    requireActiveCashierSession: false,
    parcels: body.parcels.map((parcel) => ({
      ...parcel,
      status: ParcelStatus.CREATED,
      method: PaymentMethod.CASH,
      senderPaymentCedis: 0,
      senderPaymentMethod: undefined,
    })),
  };
}
