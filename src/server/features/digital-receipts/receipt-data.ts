import type { ReceiptPrintData } from '@/features/operations/parcel/components/parcel-receipt.types';
import { buildReceiverReceiptData } from '@/features/operations/parcel/utils/build-receiver-receipt-data';
import { PaymentMethod } from '@/db/schemas/enums';

/** Fields of the parcel search row that printed receipts are built from. */
export type ReceiptParcelRow = {
  bookingCode: string;
  trackingCode: string;
  callSender: boolean;
  parcelDetails: string;
  parcelContent: string;
  parcelValuePsw: number | null;
  chargeExemptCustomerType?: number | null;
  relatedStaffNameSnapshot?: string | null;
  chargePsw: number;
  plannedToBePaidPsw: number;
  method?: number;
  senderName: string | null;
  senderPhone: string | null;
  senderPhone2: string | null;
  receiverName: string | null;
  receiverPhone: string | null;
  receiverPhone2: string | null;
  destinationName: string | null;
  pickupLocationName: string | null;
  createdAt: Date;
};

export type RecordedReceiptTax = {
  grossAmountPsw: number;
  vatPsw: number;
  getfundPsw: number;
  nhilPsw: number;
  covidPsw: number;
  taxTotalPsw: number;
  taxComponentKeys: string[];
};

const toTaxBreakdown = (recorded: RecordedReceiptTax) => ({
  vatCedis: recorded.vatPsw / 100,
  getfundCedis: recorded.getfundPsw / 100,
  nhilCedis: recorded.nhilPsw / 100,
  covidCedis: recorded.covidPsw / 100,
  taxTotalCedis: recorded.taxTotalPsw / 100,
  taxComponentKeys: recorded.taxComponentKeys,
});

/**
 * Sender (booking) receipt — mirrors the outgoing-parcel reprint: amounts come
 * from the parcel, and paid amounts/tax from the recorded sender payment.
 * Unpaid bookings produce the "to be paid" acknowledgement note.
 */
export function buildSenderReceiptData(
  row: ReceiptParcelRow,
  recorded: RecordedReceiptTax | null,
): ReceiptPrintData {
  const totalChargeCedis = Math.max(row.chargePsw ?? 0, 0) / 100;
  const receiverToPayCedis = Math.max(row.plannedToBePaidPsw ?? 0, 0) / 100;
  const isCredit =
    row.method === PaymentMethod.CREDIT && (!recorded || recorded.grossAmountPsw <= 0);
  const plannedSenderPaidCedis = isCredit ? 0 : Math.max(totalChargeCedis - receiverToPayCedis, 0);
  const base: ReceiptPrintData = {
    chargeExemptCustomerType: row.chargeExemptCustomerType,
    relatedStaffNameSnapshot: row.relatedStaffNameSnapshot,
    bookingCode: row.bookingCode,
    trackingCode: row.trackingCode,
    callSender: row.callSender,
    parcelDetails: row.parcelDetails,
    parcelContent: row.parcelContent,
    parcelValueCedis: Math.max(row.parcelValuePsw ?? 0, 0) / 100,
    senderName: row.senderName ?? '-',
    senderTelephone: row.senderPhone ?? '-',
    senderTelephone2: row.senderPhone2 ?? null,
    receiverName: row.receiverName ?? '-',
    receiverTelephone: row.receiverPhone ?? '-',
    receiverTelephone2: row.receiverPhone2 ?? null,
    destinationBranchName: row.destinationName ?? '-',
    destinationLocationName: row.pickupLocationName ?? '-',
    totalChargeCedis,
    senderPaidCedis: plannedSenderPaidCedis,
    receiverToPayCedis,
    amountPaidCedis: plannedSenderPaidCedis,
    settlementMode: isCredit ? 'CREDIT' : undefined,
    issuedAt: row.createdAt.toISOString(),
  };
  if (plannedSenderPaidCedis === 0 || !recorded || recorded.grossAmountPsw <= 0) return base;

  const amountPaidCedis = recorded.grossAmountPsw / 100;
  return {
    ...base,
    amountPaidCedis,
    senderPaidCedis: amountPaidCedis,
    taxBreakdown: toTaxBreakdown(recorded),
  };
}

/** Receiver cashier receipt — mirrors the receiver receipt reprint. */
export function buildReceiverPaymentReceiptData(
  row: ReceiptParcelRow,
  recorded: RecordedReceiptTax & {
    receiverPrincipalPsw: number;
    storageChargePsw: number;
    senderPaidPsw: number;
  },
  options: { issuedAt: string; receivedByName: string | null },
): ReceiptPrintData {
  const receipt = buildReceiverReceiptData({
    parcel: {
      ...row,
      parcelValuePsw: row.parcelValuePsw ?? 0,
    } as Parameters<typeof buildReceiverReceiptData>[0]['parcel'],
    receivedByName: options.receivedByName ?? '-',
    destinationBranchName: row.destinationName ?? '-',
    destinationLocationName: row.pickupLocationName ?? '-',
    totalChargeCedis: row.chargePsw / 100,
    senderPaidCedis: recorded.senderPaidPsw / 100,
    receiverPaidCedis: recorded.receiverPrincipalPsw / 100,
    storageChargeCedis: recorded.storageChargePsw / 100,
    taxBreakdown: toTaxBreakdown(recorded),
  });
  return { ...receipt, issuedAt: options.issuedAt };
}

/** Figures quoted in the SMS/WhatsApp/email text accompanying the link. */
export function summarizeReceiptData(data: ReceiptPrintData) {
  return {
    amountPaidCedis: data.amountPaidCedis ?? data.senderPaidCedis,
    balanceCedis: data.receiverToPayCedis,
    destinationBranch: data.destinationBranchName,
    destinationLocation: data.destinationLocationName,
  };
}
