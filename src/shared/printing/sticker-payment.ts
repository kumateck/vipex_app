export type StickerPaymentStatus = 'PAID' | 'TO BE PAID' | 'CREDIT' | 'EXEMPT';

export type VerifiedStickerPayment = {
  relatedStaffNameSnapshot?: string | null;
  bookingCode: string;
  trackingCode: string;
  status: StickerPaymentStatus;
  amountCedis: number;
};

/** Keep every sticker renderer on the same payment labels, including legacy print payloads. */
export function resolveStickerPayment(amountCedis: number | undefined, status: unknown) {
  if (amountCedis !== undefined && (!Number.isFinite(amountCedis) || amountCedis < 0)) {
    throw new Error('Sticker payment amount must be a finite, non-negative number');
  }
  if (!['PAID', 'TO BE PAID', 'CREDIT', 'EXEMPT'].includes(String(status))) {
    throw new Error('Sticker printing requires a verified PAID, TO BE PAID or CREDIT status');
  }
  const hasToBePaid = status === 'TO BE PAID';
  if (amountCedis === undefined || (hasToBePaid ? amountCedis <= 0 : amountCedis !== 0)) {
    throw new Error('Sticker payment status and amount do not match');
  }
  const statusLabel = status as StickerPaymentStatus;
  return { hasToBePaid, statusLabel } as const;
}

export function assertVerifiedStickerPayment(
  payment: VerifiedStickerPayment,
  expected: { bookingCode: string; trackingCode: string },
) {
  if (
    !payment ||
    payment.bookingCode !== expected.bookingCode ||
    payment.trackingCode !== expected.trackingCode
  ) {
    throw new Error('Sticker payment verification does not match this parcel');
  }
  resolveStickerPayment(payment.amountCedis, payment.status);
  return payment;
}

/** Never run a print/preparation callback using a previous response or a form-selected label. */
export async function withVerifiedStickerPayment<Result>(
  expected: { bookingCode: string; trackingCode: string },
  load: () => Promise<VerifiedStickerPayment>,
  ready: (payment: VerifiedStickerPayment) => Result | Promise<Result>,
): Promise<Result> {
  return ready(assertVerifiedStickerPayment(await load(), expected));
}
