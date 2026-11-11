import type { PickupQueueCard } from '@mobile/types/parcels';

export function formatCedis(psw: number | null | undefined) {
  return `GH₵ ${((psw ?? 0) / 100).toFixed(2)}`;
}

export function formatQueueDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

export function isQueueDateToday(
  queueDate?: string | null,
  queuedAt?: string | null,
  now = new Date(),
) {
  const issuedAt = queuedAt ? new Date(queuedAt) : null;
  const queueDay =
    queueDate?.slice(0, 10) ??
    (issuedAt && Number.isFinite(issuedAt.getTime()) ? issuedAt.toISOString().slice(0, 10) : null);
  return queueDay === now.toISOString().slice(0, 10);
}

type QueueShareContext = {
  queueCode: string;
  bookingCode?: string | null;
  receiverName?: string | null;
  receiverPhone?: string | null;
  branchName?: string;
  branchContact?: string;
  branchLocation?: string;
  companyName?: string;
};

export function buildQueueShareMessages(input: QueueShareContext) {
  const branchContact = input.branchContact?.trim();
  const branchLocation = input.branchLocation?.trim();
  const branchName = input.branchName ?? '-';
  const bookingCode = input.bookingCode ?? '-';
  const receiverName = input.receiverName ?? '-';
  const receiverPhone = input.receiverPhone ?? '-';

  const shortLines = [
    `${input.companyName ?? 'Vipex'} Queue Ticket`,
    `Code: ${input.queueCode}`,
    `Booking: ${bookingCode}`,
    `Receiver: ${receiverName}`,
    `Branch: ${branchName}`,
  ];
  const fullLines = [
    `Queue Ticket: ${input.queueCode}`,
    `Booking Code: ${bookingCode}`,
    `Receiver: ${receiverName} (${receiverPhone})`,
    `Branch: ${branchName}`,
  ];

  if (branchContact) {
    shortLines.push(`Branch Contact: ${branchContact}`);
    fullLines.push(`Branch Contact: ${branchContact}`);
  }
  if (branchLocation) {
    shortLines.push(`Branch Location: ${branchLocation}`);
    fullLines.push(`Branch Location: ${branchLocation}`);
  }
  fullLines.push('Please present this queue code at pickup.');

  return { short: shortLines.join('\n'), full: fullLines.join('\n') };
}

export function queueCardShareContext(card: PickupQueueCard): QueueShareContext {
  return {
    queueCode: card.queueCode,
    bookingCode: card.bookingCode,
    receiverName: card.receiverName,
    receiverPhone: card.receiverPhone,
  };
}
