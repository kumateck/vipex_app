import type { HomeDeliveryReceiptA5Props } from '@/features/printing/components/templates/home-delivery-receipt-a5-template';
import { formatDate } from '../components/parcel-receipt-formatters';
import { buildParcelTrackingUrl } from './tracking-url';

/** Home delivery receipt amounts and contacts as returned by the server. */
export type HomeDeliveryReceiptSource = {
  bookingCode: string;
  trackingCode: string;
  parcelDetails: string;
  parcelContent: string;
  dropoffAddress: string | null;
  senderName: string | null;
  senderPhone: string | null;
  senderPhone2: string | null;
  receiverName: string | null;
  receiverPhone: string | null;
  receiverPhone2: string | null;
  destinationName: string | null;
  chargePsw: number;
  deliveryFeePsw: number;
  paidPrincipalPsw: number;
  paidDeliveryFeePsw: number;
  principalDuePsw: number;
  deliveryFeeDuePsw: number;
  totalDuePsw: number;
  grossPsw: number;
  netPsw: number;
  taxRows: Array<{ label: string; amountPsw: number }>;
};

/**
 * Maps a home delivery receipt to the A5 template props. The printed receipt
 * and the online copy behind a digital receipt link both render from this.
 */
export function buildHomeDeliveryReceiptA5Props(
  receipt: HomeDeliveryReceiptSource,
  options: { cashierName?: string | null; issuedAt: string },
): HomeDeliveryReceiptA5Props {
  return {
    cashierName: options.cashierName,
    issuedAtLabel: formatDate(options.issuedAt),
    bookingCode: receipt.bookingCode,
    trackingCode: receipt.trackingCode,
    senderName: receipt.senderName ?? '',
    senderPhone: [receipt.senderPhone, receipt.senderPhone2].filter(Boolean).join(', '),
    receiverName: receipt.receiverName ?? '',
    receiverPhone: [receipt.receiverPhone, receipt.receiverPhone2].filter(Boolean).join(', '),
    parcelDetails: receipt.parcelDetails,
    parcelContent: receipt.parcelContent,
    destinationName: receipt.destinationName ?? '',
    dropoffAddress: receipt.dropoffAddress ?? '',
    chargePsw: receipt.chargePsw,
    deliveryFeePsw: receipt.deliveryFeePsw,
    paidPrincipalPsw: receipt.paidPrincipalPsw,
    paidDeliveryFeePsw: receipt.paidDeliveryFeePsw,
    principalDuePsw: receipt.principalDuePsw,
    deliveryFeeDuePsw: receipt.deliveryFeeDuePsw,
    totalDuePsw: receipt.totalDuePsw,
    grossPsw: receipt.grossPsw,
    netPsw: receipt.netPsw,
    taxRows: receipt.taxRows,
    qrValue: buildParcelTrackingUrl(receipt.trackingCode),
  };
}
