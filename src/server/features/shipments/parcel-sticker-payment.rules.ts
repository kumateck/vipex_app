import { PaymentMethod } from '@/db/schemas/enums';
import { Conflict } from '@/server/utils/http-error';
import type { VerifiedStickerPayment } from '@/shared/printing';

export type StickerPaymentRecord = {
  bookingCode: string;
  trackingCode: string;
  chargePsw: number;
  plannedToBePaidPsw: number;
  senderPaidPsw: number;
  receiverPaidPsw: number;
  creditPsw: number;
  method: number;
};

export function verifyStickerPaymentRecord(record: StickerPaymentRecord): VerifiedStickerPayment {
  const {
    chargePsw: charge,
    plannedToBePaidPsw: planned,
    senderPaidPsw: sender,
    receiverPaidPsw: receiver,
    creditPsw: credit,
  } = record;
  const blocked = () =>
    Conflict(
      'Sticker not printed: payment status is not confirmed. Complete sender payment or confirm the receiver amount or approved credit.',
    );
  if (
    ![charge, planned, sender, receiver, credit].every(
      (value) => Number.isSafeInteger(value) && value >= 0,
    ) ||
    charge <= 0 ||
    planned > charge
  )
    throw blocked();
  const outstanding = charge - sender - receiver;
  if (outstanding < 0) throw blocked();
  const base = { bookingCode: record.bookingCode, trackingCode: record.trackingCode };
  if (outstanding === 0) return { ...base, status: 'PAID', amountCedis: 0 };
  // Payment processing rewrites this field to the remaining receiver balance.
  // Receiver payments must not be counted again as a missing sender contribution.
  if (planned > 0 && outstanding <= planned) {
    return { ...base, status: 'TO BE PAID', amountCedis: outstanding / 100 };
  }
  if (record.method === PaymentMethod.CREDIT && planned === 0 && credit === charge) {
    return { ...base, status: 'CREDIT', amountCedis: 0 };
  }
  throw blocked();
}
