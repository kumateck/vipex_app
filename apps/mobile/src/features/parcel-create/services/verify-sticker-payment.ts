import { mobileApiGet } from '@mobile/lib/api';
import { assertVerifiedStickerPayment, type VerifiedStickerPayment } from '@/shared/printing';
import type { MobileSticker } from './sticker-html';

export async function verifyMobileStickerPayment(token: string, sticker: MobileSticker) {
  const payment = await mobileApiGet<VerifiedStickerPayment>({
    path: '/shipments/parcels/sticker-payment',
    token,
    query: { trackingCode: sticker.trackingCode, bookingCode: sticker.bookingCode },
  });
  return assertVerifiedStickerPayment(payment, sticker);
}
