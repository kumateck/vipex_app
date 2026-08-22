import type { SenderCashierParcel } from '../../api/parcel.api';
import type { ReceiptPrintData } from '../parcel-receipt.types';

type SenderPaymentTaxBreakdown = {
  vatCedis: number;
  getfundCedis: number;
  nhilCedis: number;
  covidCedis: number;
  taxTotalCedis: number;
};

type BuildSenderReceiptDataArgs = {
  parcel: SenderCashierParcel;
  senderDueCedis: number;
  amountValue: number;
  totalChargeCedis: number;
  receiverToPayCedis: number;
  destinationBranchName: string;
  destinationLocationName: string;
  taxBreakdown?: SenderPaymentTaxBreakdown;
};

export function buildSenderReceiptData({
  parcel,
  senderDueCedis,
  amountValue,
  totalChargeCedis,
  receiverToPayCedis,
  destinationBranchName,
  destinationLocationName,
  taxBreakdown,
}: BuildSenderReceiptDataArgs): ReceiptPrintData {
  const amountPaidCedis = senderDueCedis > 0 ? amountValue : 0;

  return {
    bookingCode: parcel.bookingCode,
    trackingCode: parcel.trackingCode,
    parcelDetails: parcel.parcelDetails,
    parcelContent: parcel.parcelContent,
    parcelValueCedis: Number(parcel.parcelValuePsw ?? 0) / 100,
    payerType: 'sender',
    payerName: parcel.senderName ?? '-',
    payerTelephone: parcel.senderPhone ?? '-',
    payerTelephone2: parcel.senderPhone2 ?? null,
    senderName: parcel.senderName ?? '-',
    senderTelephone: parcel.senderPhone ?? '-',
    senderTelephone2: parcel.senderPhone2 ?? null,
    receiverName: parcel.receiverName ?? '-',
    receiverTelephone: parcel.receiverPhone ?? '-',
    receiverTelephone2: parcel.receiverPhone2 ?? null,
    destinationBranchName,
    destinationLocationName,
    totalChargeCedis,
    senderPaidCedis: amountPaidCedis,
    receiverToPayCedis,
    amountPaidCedis,
    issuedAt: new Date().toISOString(),
    taxBreakdown,
  };
}
