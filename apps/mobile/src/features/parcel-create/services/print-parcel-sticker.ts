import RNPrint from 'react-native-print';
import { buildMobileStickerHtml, type MobileSticker } from './sticker-html';
import { assertVerifiedStickerPayment, type VerifiedStickerPayment } from '@/shared/printing';

export async function printParcelSticker(
  sticker: MobileSticker,
  verification: VerifiedStickerPayment,
) {
  const payment = assertVerifiedStickerPayment(verification, sticker);
  const result: unknown = await RNPrint.print({
    html: buildMobileStickerHtml({
      ...sticker,
      receiverName: payment.relatedStaffNameSnapshot
        ? `${sticker.receiverName} — ${payment.relatedStaffNameSnapshot}`
        : sticker.receiverName,
      paymentStatusLabel: payment.status,
      amountCedis: payment.amountCedis,
    }),
    jobName: `VIPEx ${sticker.bookingCode}`,
  });
  if (result == null) throw new Error('Printing was cancelled');
}
