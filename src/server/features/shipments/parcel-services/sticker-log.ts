import { BadRequest } from '../../../utils/http-error';
import { createParcelStickerPrintRepo } from '../parcel-sticker-prints.repository';

export async function logParcelStickerPrintSvc(input: {
  companyId: string;
  branchId?: string | null;
  printedBy?: string | null;
  bookingCode: string;
  trackingCode: string;
  copies?: number | null;
}) {
  const copies = input.copies ?? 1;
  if (!Number.isSafeInteger(copies) || copies < 1) {
    throw BadRequest('Sticker copies must be a positive whole number');
  }
  return createParcelStickerPrintRepo({
    companyId: input.companyId,
    branchId: input.branchId ?? null,
    bookingCode: input.bookingCode,
    trackingCode: input.trackingCode,
    copies,
    printedBy: input.printedBy ?? null,
  });
}
