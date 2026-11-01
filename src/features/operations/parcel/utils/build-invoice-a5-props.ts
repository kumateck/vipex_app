import type { InvoiceA5TemplateProps } from '@/features/printing/components/templates/invoice-a5-template.types';
import type { ReceiptPrintData } from '../components/parcel-receipt.types';
import {
  formatDate,
  formatMoney,
  getPaymentModeLabel,
  toAmountWords,
} from '../components/parcel-receipt-formatters';

/**
 * Pure tax figures for a receipt. Shared by the print dialog and the server
 * renderer behind digital receipt links so both always show the same numbers.
 */
export function computeParcelReceiptTax(
  data: Pick<ReceiptPrintData, 'amountPaidCedis' | 'senderPaidCedis' | 'taxBreakdown'>,
) {
  const amountPaid = data.amountPaidCedis ?? data.senderPaidCedis;
  if (data.taxBreakdown) {
    return {
      principal: amountPaid,
      net: amountPaid - data.taxBreakdown.taxTotalCedis,
      vat: data.taxBreakdown.vatCedis,
      getfund: data.taxBreakdown.getfundCedis,
      nhil: data.taxBreakdown.nhilCedis,
      covid: data.taxBreakdown.covidCedis ?? 0,
      totalTax: data.taxBreakdown.taxTotalCedis,
      taxComponentKeys: data.taxBreakdown.taxComponentKeys,
      residual: 0,
    };
  }
  // Sticker printing and unpaid acknowledgement notes do not use payment tax.
  // All paid receipt prints are guarded by ParcelReceiptActions.
  return {
    principal: amountPaid,
    net: amountPaid,
    vat: 0,
    getfund: 0,
    nhil: 0,
    covid: 0,
    totalTax: 0,
    residual: 0,
  };
}

function formatTelephonePair(primary: string, secondary?: string | null) {
  return secondary ? `${primary}, ${secondary}` : primary;
}

/**
 * Maps receipt data to the A5 receipt template props. The printed receipt and
 * the online copy behind a digital receipt link both render from this.
 */
export function buildInvoiceA5Props(
  data: ReceiptPrintData,
  options: {
    amountPaidCedis: number;
    tax: InvoiceA5TemplateProps['tax'];
    qrUrl: string;
    cashierName?: string | null;
    isDuplicate?: boolean;
  },
): InvoiceA5TemplateProps {
  const payerTelephone = formatTelephonePair(
    data.payerTelephone ?? data.senderTelephone,
    data.payerType ? data.payerTelephone2 : data.senderTelephone2,
  );
  return {
    isChargeExempt: data.chargeExemptCustomerType != null || data.stickerStatusLabel === 'EXEMPT',
    settlementMode: data.settlementMode,
    bookingCode: data.bookingCode,
    issuedAtLabel: formatDate(data.issuedAt),
    cashierName: options.cashierName,
    duplicate: options.isDuplicate ?? false,
    parcelDetails: data.parcelDetails,
    parcelContent: data.parcelContent,
    parcelValueCedis: data.parcelValueCedis,
    receivedByName: data.receivedByName,
    destinationBranchName: data.destinationBranchName,
    destinationLocationName: data.destinationLocationName,
    payerLabel: data.payerType === 'receiver' ? 'Receiver Info' : 'Sender Info',
    payerName: data.payerName ?? data.senderName,
    payerTelephone,
    senderName: data.senderName,
    senderTelephone: formatTelephonePair(data.senderTelephone, data.senderTelephone2),
    receiverName: data.relatedStaffNameSnapshot
      ? `${data.receiverName} — ${data.relatedStaffNameSnapshot}`
      : data.receiverName,
    receiverTelephone: formatTelephonePair(data.receiverTelephone, data.receiverTelephone2),
    paymentModeLabel:
      data.chargeExemptCustomerType != null || data.stickerStatusLabel === 'EXEMPT'
        ? 'Exempt'
        : data.settlementMode === 'CREDIT'
          ? 'Credit'
          : getPaymentModeLabel(data.senderPaidCedis, data.receiverToPayCedis),
    totalChargeCedis: data.totalChargeCedis,
    senderPaidCedis: data.senderPaidCedis,
    receiverToPayCedis: data.receiverToPayCedis,
    amountPaidCedis: options.amountPaidCedis,
    storageChargeCedis: data.storageChargeCedis,
    amountInWords: toAmountWords(options.amountPaidCedis),
    tax: options.tax,
    qrValue: options.qrUrl,
    formatMoney,
  };
}
