import { useMemo } from 'react';
import type { ReceiptPrintData } from '../components/parcel-receipt.types';

export function useParcelReceiptTax(data: ReceiptPrintData) {
  return useMemo(() => {
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
  }, [data.amountPaidCedis, data.senderPaidCedis, data.taxBreakdown]);
}
