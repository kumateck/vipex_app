import type { SenderCashierParcel } from '../../api/parcel.api';
import type { ReceiptPrintData } from '../parcel-receipt-actions';
import { formatPhones } from './utils';

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
  return {
    bookingCode: parcel.bookingCode,
    trackingCode: parcel.trackingCode,
    parcelDetails: parcel.parcelDetails,
    parcelContent: parcel.parcelContent,
    parcelValueCedis: Number(parcel.parcelValuePsw ?? 0) / 100,
    senderName: parcel.senderName ?? '-',
    senderTelephone: formatPhones(parcel.senderPhone, parcel.senderPhone2),
    receiverName: parcel.receiverName ?? '-',
    receiverTelephone: formatPhones(parcel.receiverPhone, parcel.receiverPhone2),
    destinationBranchName,
    destinationLocationName,
    totalChargeCedis,
    senderPaidCedis: senderDueCedis > 0 ? amountValue : 0,
    receiverToPayCedis,
    issuedAt: new Date().toISOString(),
    taxBreakdown,
  };
}
