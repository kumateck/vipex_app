import type { ParcelSearchRow } from '../../api/parcel.api';
import type { ReceiptPrintData } from '../parcel-receipt-actions';

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
    senderName: parcel.senderName ?? '-',
    senderTelephone: parcel.senderPhone ?? '-',
    receiverName: parcel.receiverName ?? '-',
    receiverTelephone: parcel.receiverPhone ?? '-',
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
