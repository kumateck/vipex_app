import type { ParcelSearchRow } from '../../api/parcel.api';
import type { ReceiptPrintData } from '../parcel-receipt.types';

type ReceiverTaxBreakdown = {
  vatCedis: number;
  getfundCedis: number;
  nhilCedis: number;
  covidCedis: number;
  taxTotalCedis: number;
};

type BuildReceiverReceiptDataArgs = {
  parcel: ParcelSearchRow;
  receivedByName: string;
  destinationBranchName: string;
  destinationLocationName: string;
  totalChargeCedis: number;
  senderPaidCedis: number;
  receiverPaidCedis: number;
  taxBreakdown?: ReceiverTaxBreakdown;
};

export function buildReceiverReceiptData({
  parcel,
  receivedByName,
  destinationBranchName,
  destinationLocationName,
  totalChargeCedis,
  senderPaidCedis,
  receiverPaidCedis,
  taxBreakdown,
}: BuildReceiverReceiptDataArgs): ReceiptPrintData {
  return {
    bookingCode: parcel.bookingCode,
    trackingCode: parcel.trackingCode,
    parcelDetails: parcel.parcelDetails,
    parcelContent: parcel.parcelContent,
    parcelValueCedis: Number(parcel.parcelValuePsw ?? 0) / 100,
    receivedByName,
    payerType: 'receiver',
    payerName: parcel.receiverName ?? '-',
    payerTelephone: parcel.receiverPhone ?? '-',
    payerTelephone2: parcel.receiverPhone2 ?? null,
    senderName: parcel.senderName ?? '-',
    senderTelephone: parcel.senderPhone ?? '-',
    senderTelephone2: parcel.senderPhone2 ?? null,
    receiverName: parcel.receiverName ?? '-',
    receiverTelephone: parcel.receiverPhone ?? '-',
    receiverTelephone2: parcel.receiverPhone2 ?? null,
    destinationBranchName,
    destinationLocationName,
    totalChargeCedis,
    senderPaidCedis,
    receiverToPayCedis: 0,
    amountPaidCedis: receiverPaidCedis,
    issuedAt: new Date().toISOString(),
    taxBreakdown,
  };
}
