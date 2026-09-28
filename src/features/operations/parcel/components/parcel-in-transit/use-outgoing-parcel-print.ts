import { useCallback, useMemo, useState } from 'react';
import { useListTaxComponentsQuery } from '@/features/accounting/api';
import { useLazyListPaymentsForParcelQuery, type ParcelSearchRow } from '../../api/parcel.api';
import type { ReceiptPrintData } from '../parcel-receipt.types';

function toReceiptData(
  parcel: ParcelSearchRow,
  taxBreakdown?: ReceiptPrintData['taxBreakdown'],
): ReceiptPrintData {
  const totalChargeCedis = Math.max(parcel.chargePsw ?? 0, 0) / 100;
  const receiverToPayCedis = Math.max(parcel.plannedToBePaidPsw ?? 0, 0) / 100;
  const senderPaidCedis = Math.max(totalChargeCedis - receiverToPayCedis, 0);
  return {
    bookingCode: parcel.bookingCode,
    trackingCode: parcel.trackingCode,
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
    taxBreakdown,
  };
}

export function useOutgoingParcelPrint(companyId: string | null) {
  const [printData, setPrintData] = useState<ReceiptPrintData | null>(null);
  const [selection, setSelection] = useState<'sticker' | 'invoice'>('sticker');
  const [stickerCopies, setStickerCopies] = useState(1);
  const [loadPayments] = useLazyListPaymentsForParcelQuery();
  const { data: taxComponents = [] } = useListTaxComponentsQuery(
    { companyId: companyId ?? '', active: true },
    { skip: !companyId },
  );
  const taxComponentKeys = useMemo(
    () => taxComponents.map((component) => component.key),
    [taxComponents],
  );

  const print = useCallback(
    async (parcel: ParcelSearchRow, nextSelection: 'sticker' | 'invoice', copies = 1) => {
      let taxBreakdown: ReceiptPrintData['taxBreakdown'];
      if (nextSelection === 'invoice') {
        try {
          const payments = await loadPayments({ parcelId: parcel.id }).unwrap();
          const principal = payments.find((payment) => payment.component === 0);
          if (principal && principal.taxTotalPsw > 0) {
            taxBreakdown = {
              vatCedis: principal.vatPsw / 100,
              getfundCedis: principal.getfundPsw / 100,
              nhilCedis: principal.nhilPsw / 100,
              covidCedis: principal.covidPsw / 100,
              taxTotalCedis: principal.taxTotalPsw / 100,
              taxComponentKeys,
            };
          }
        } catch {
          // Follow the consignment reprint fallback when payment details are unavailable.
        }
      }
      setSelection(nextSelection);
      setStickerCopies(copies);
      setPrintData(toReceiptData(parcel, taxBreakdown));
    },
    [loadPayments, taxComponentKeys],
  );

  const clear = useCallback(() => setPrintData(null), []);
  return { printData, selection, stickerCopies, print, clear };
}
