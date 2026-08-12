import type { ReceiptSummary } from './parcel-form.types';

export function getParcelCreationPrintSelection(
  parcel: ReceiptSummary['parcels'][number],
): 'sticker' | 'both' {
  const senderPaidCedis = parcel.amountPaidCedis ?? parcel.senderPaidCedis;
  return senderPaidCedis > 0 ? 'both' : 'sticker';
}

export function mergePaidParcelsIntoReceipt(
  receipt: ReceiptSummary,
  paidParcels: ReceiptSummary['parcels'],
): ReceiptSummary {
  const paidParcelById = new Map(
    paidParcels.flatMap((parcel) => (parcel.parcelId ? [[parcel.parcelId, parcel]] : [])),
  );

  return {
    ...receipt,
    parcels: receipt.parcels.map((parcel) =>
      parcel.parcelId ? (paidParcelById.get(parcel.parcelId) ?? parcel) : parcel,
    ),
  };
}
