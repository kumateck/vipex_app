import { getSelfServiceStickerPayment } from '@/shared/self-service';
import type { MobileSticker } from '@mobile/features/parcel-create/services';
import type { CompletedSelfServiceBooking } from '../types';

export function buildCompletedBookingSticker(
  { draft, input, result }: CompletedSelfServiceBooking,
  destinationBranch: string,
  destinationLocation: string,
  copies: number,
): MobileSticker | null {
  const parcel = result.parcels[0];
  if (!parcel) return null;
  const payment = getSelfServiceStickerPayment(input);
  return {
    bookingCode: parcel.bookingCode,
    trackingCode: parcel.trackingCode,
    senderName: draft.senderFullname,
    senderPhone: [draft.senderPhone, draft.senderPhone2].filter(Boolean).join(' / '),
    receiverName: draft.receiverFullname,
    receiverPhone: [draft.receiverPhone, draft.receiverPhone2].filter(Boolean).join(' / '),
    destinationBranch,
    destinationLocation,
    parcelDetails: input.parcelDetails,
    callSender: input.callSender ?? draft.callSender,
    amountCedis: payment.receiverToPayCedis,
    paymentStatusLabel: payment.statusLabel,
    copies,
  };
}
