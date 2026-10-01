import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { type ParcelSearchRow } from '../../api/parcel.api';
import { useReceiptReprintTax } from '../../hooks';
import type { ReceiptPrintData } from '../parcel-receipt.types';

function toReceiptData(parcel: ParcelSearchRow): ReceiptPrintData {
  const totalChargeCedis = Math.max(parcel.chargePsw ?? 0, 0) / 100;
  const receiverToPayCedis = Math.max(parcel.plannedToBePaidPsw ?? 0, 0) / 100;
  const senderPaidCedis = Math.max(totalChargeCedis - receiverToPayCedis, 0);
  return {
    bookingCode: parcel.bookingCode,
    trackingCode: parcel.trackingCode,
    callSender: parcel.callSender,
    parcelDetails: parcel.parcelDetails,
    parcelContent: parcel.parcelContent,
    parcelValueCedis: Math.max(parcel.parcelValuePsw ?? 0, 0) / 100,
    senderName: parcel.senderName ?? '-',
    senderTelephone: parcel.senderPhone ?? '-',
    senderTelephone2: parcel.senderPhone2 ?? null,
    receiverName: parcel.receiverName ?? '-',
    receiverTelephone: parcel.receiverPhone ?? '-',
    receiverTelephone2: parcel.receiverPhone2 ?? null,
    destinationBranchName: parcel.destinationName ?? '-',
    destinationLocationName: parcel.pickupLocationName ?? '-',
    totalChargeCedis,
    senderPaidCedis,
    receiverToPayCedis,
    amountPaidCedis: senderPaidCedis,
    issuedAt: parcel.createdAt,
  };
}

export function useOutgoingParcelPrint() {
  const [printData, setPrintData] = useState<ReceiptPrintData | null>(null);
  const [selection, setSelection] = useState<'sticker' | 'invoice'>('sticker');
  const [stickerCopies, setStickerCopies] = useState(1);
  const loadReceiptReprintTax = useReceiptReprintTax();

  const print = useCallback(
    async (parcel: ParcelSearchRow, nextSelection: 'sticker' | 'invoice', copies = 1) => {
      let receipt = toReceiptData(parcel);
      if (nextSelection === 'invoice') {
        try {
          receipt = await loadReceiptReprintTax(parcel.id, receipt);
        } catch {
          toast.error('Could not load recorded tax breakdown; receipt reprint cancelled');
          return;
        }
      }
      setSelection(nextSelection);
      setStickerCopies(copies);
      setPrintData(receipt);
    },
    [loadReceiptReprintTax],
  );

  const clear = useCallback(() => setPrintData(null), []);
  return { printData, selection, stickerCopies, print, clear };
}
