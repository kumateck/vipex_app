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

export function toLocalDateKey(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
