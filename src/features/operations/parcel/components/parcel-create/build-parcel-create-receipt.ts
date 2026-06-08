import type { CreateBookingWithParcelsResponse } from '../../api/parcel.api';
import type { ParcelBookingFormValues, ReceiptSummary } from './parcel-form.types';

type ParcelCreateAmount = {
  charge: number;
  value: number;
  partial: number;
};

type BranchOption = {
  id: string;
  name: string;
};

type BuildParcelCreateReceiptArgs = {
  response: CreateBookingWithParcelsResponse;
  values: ParcelBookingFormValues;
  amounts: ParcelCreateAmount[];
  branchOptions: BranchOption[];
};

export function buildParcelCreateReceipt({
  response,
  values,
  amounts,
  branchOptions,
}: BuildParcelCreateReceiptArgs): ReceiptSummary {
  return {
    bookingId: response.bookingId,
    parcels: response.parcels.map((parcel, index) => {
      const formParcel = values.parcels[index];
      const amount = amounts[index];
      const charge = amount?.charge ?? 0;
      const senderPaidCedis =
        formParcel?.paymentResponsibility === 'SENDER' &&
        formParcel.senderSettlementMode === 'PAY_NOW'
          ? charge
          : formParcel?.paymentResponsibility === 'SPLIT'
            ? (amount?.partial ?? 0)
            : 0;

      return {
        parcelId: parcel.id,
        bookingCode: parcel.bookingCode ?? response.bookingId,
        trackingCode: parcel.trackingCode ?? '-',
        parcelDetails: formParcel?.parcelDetails ?? '-',
        parcelContent: formParcel?.parcelContent ?? null,
        parcelValueCedis: amount?.value ?? 0,
        senderName: values.sender.fullname,
        senderTelephone: values.sender.telephone,
        receiverName: formParcel?.receiver.fullname ?? '-',
        receiverTelephone: formParcel?.receiver.telephone ?? '-',
        destinationBranchName:
          branchOptions.find((branch) => branch.id === formParcel?.destinationBranchId)?.name ??
          '-',
        destinationLocationName: formParcel?.destinationLocationId ?? '-',
        totalChargeCedis: charge,
        senderPaidCedis,
        receiverToPayCedis:
          formParcel?.paymentResponsibility === 'RECEIVER'
            ? charge
            : formParcel?.paymentResponsibility === 'SPLIT'
              ? Math.max(charge - (amount?.partial ?? 0), 0)
              : 0,
        issuedAt: new Date().toISOString(),
      };
    }),
  };
}
