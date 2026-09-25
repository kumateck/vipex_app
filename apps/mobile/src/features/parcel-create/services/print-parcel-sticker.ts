import RNPrint from 'react-native-print';
import { buildMobileStickerHtml, type MobileSticker } from './sticker-html';

export async function printParcelSticker(sticker: MobileSticker) {
  const result: unknown = await RNPrint.print({
    html: buildMobileStickerHtml(sticker),
    jobName: `VIPEx ${sticker.bookingCode}`,
  });
  if (result == null) throw new Error('Printing was cancelled');
}
