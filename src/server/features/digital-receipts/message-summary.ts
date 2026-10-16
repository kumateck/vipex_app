import type { ReceiptKind } from '@/shared/digital-receipts/channels';
import type { ReceiptSummary } from './receipt-document.service';

export const SMS_EVENT_BY_KIND = {
  booking: 'digital_receipt_booking',
  sender_payment: 'digital_receipt_payment',
  receiver_payment: 'digital_receipt_payment',
  home_delivery: 'digital_receipt_home_delivery',
} as const satisfies Record<ReceiptKind, string>;

export const RECEIPT_KIND_LABEL: Record<ReceiptKind, string> = {
  booking: 'Booking receipt',
  sender_payment: 'Payment receipt',
  receiver_payment: 'Payment receipt',
  home_delivery: 'Home delivery receipt',
};

const money = (amount: number) => `GH₵ ${amount.toFixed(2)}`;

/**
 * Template variables for SMS/WhatsApp/email. Customers know their parcel by the
 * booking code printed on the receipt, so messages quote it (not the tracking code).
 */
export function buildReceiptMessageVariables(input: {
  recipientName: string;
  bookingCode: string;
  summary: ReceiptSummary;
  token: string;
  url: string;
}) {
  return {
    customerName: input.recipientName.trim() || 'Customer',
    bookingCode: input.bookingCode,
    amountPaid: money(input.summary.amountPaidCedis),
    balance: money(input.summary.balanceCedis),
    destination: input.summary.destinationBranch,
    branch: input.summary.destinationBranch,
    location: input.summary.destinationLocation,
    receiptToken: input.token,
    receiptUrl: input.url,
  };
}

export type ReceiptMessageVariables = ReturnType<typeof buildReceiptMessageVariables>;
