import type { VerifiedStickerPayment } from '@/shared/printing';

/** Call only after the cashier's collect/confirm request succeeds. */
export function buildConfirmedCashierStickerPayment(input: {
  bookingCode: string;
  trackingCode: string;
  receiverToPayCedis: number;
}): VerifiedStickerPayment {
  return {
    bookingCode: input.bookingCode,
    trackingCode: input.trackingCode,
    status: input.receiverToPayCedis > 0 ? 'TO BE PAID' : 'PAID',
    amountCedis: input.receiverToPayCedis,
  };
}
