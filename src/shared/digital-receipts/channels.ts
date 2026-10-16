/** How a customer receives a receipt. `physical` is the printed copy; the rest are digital. */
export const RECEIPT_DELIVERY_CHANNELS = ['physical', 'sms', 'whatsapp', 'email'] as const;
export type ReceiptDeliveryChannel = (typeof RECEIPT_DELIVERY_CHANNELS)[number];

export const DIGITAL_RECEIPT_CHANNELS = ['sms', 'whatsapp', 'email'] as const;
export type DigitalReceiptChannel = (typeof DIGITAL_RECEIPT_CHANNELS)[number];

export const RECEIPT_KINDS = [
  'booking',
  'sender_payment',
  'receiver_payment',
  'home_delivery',
] as const;
export type ReceiptKind = (typeof RECEIPT_KINDS)[number];

export const DEFAULT_RECEIPT_DELIVERY_CHANNELS: ReceiptDeliveryChannel[] = ['physical'];

const KNOWN = new Set<string>(RECEIPT_DELIVERY_CHANNELS);

/** De-duplicates, drops unknown values, and keeps the canonical order. */
export function normalizeReceiptChannels(input: readonly string[] | null | undefined) {
  const chosen = new Set((input ?? []).filter((value) => KNOWN.has(value)));
  return RECEIPT_DELIVERY_CHANNELS.filter((channel) => chosen.has(channel));
}

export function isDigitalReceiptChannel(value: string): value is DigitalReceiptChannel {
  return (DIGITAL_RECEIPT_CHANNELS as readonly string[]).includes(value);
}
