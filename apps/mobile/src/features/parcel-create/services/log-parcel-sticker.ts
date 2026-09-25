import { mobileApiPost } from '@mobile/lib/api';
import type { MobileSticker } from './sticker-html';

export function logParcelSticker(token: string, sticker: MobileSticker) {
  return mobileApiPost({
    path: '/shipments/parcels/sticker-prints',
    token,
    body: {
      bookingCode: sticker.bookingCode,
      trackingCode: sticker.trackingCode,
      copies: sticker.copies,
    },
  });
}
