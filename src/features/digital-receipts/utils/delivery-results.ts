import type { DigitalReceiptChannel, ReceiptSendResult } from '../types';

const CHANNEL_LABEL: Record<DigitalReceiptChannel, string> = {
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  email: 'email',
};

/** One-line staff feedback for a digital receipt send. */
export function summarizeDeliveryResults(results: ReceiptSendResult[]) {
  const sent = [
    ...new Set(results.filter((r) => r.status === 'sent').map((r) => CHANNEL_LABEL[r.channel])),
  ];
  const problems = results
    .filter((r) => r.status !== 'sent')
    .map((r) => `${CHANNEL_LABEL[r.channel]} to ${r.name}: ${r.detail ?? r.status}`);
  return {
    ok: sent.length > 0 && problems.length === 0,
    message: sent.length
      ? `Receipt sent by ${sent.join(', ')}${problems.length ? `. Not sent: ${problems.join('; ')}` : ''}`
      : `Receipt not sent: ${problems.join('; ') || 'no reachable channel'}`,
  };
}

export const RECEIPT_CHANNEL_LABEL = {
  physical: 'Physical',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  email: 'Email',
} as const;
