import { assertVerifiedStickerPayment, type VerifiedStickerPayment } from '@/shared/printing';

/** A completed cashier transaction already confirms the first post-payment print. */
export async function loadStickerPaymentForPrint(
  expected: { bookingCode: string; trackingCode: string },
  confirmed: VerifiedStickerPayment | undefined,
  loadCurrent: () => Promise<VerifiedStickerPayment>,
) {
  return assertVerifiedStickerPayment(confirmed ?? (await loadCurrent()), expected);
}
