import { useMemo } from 'react';
import type { ReceiptPrintData } from '../components/parcel-receipt.types';
import { computeParcelReceiptTax } from '../utils/build-invoice-a5-props';

export function useParcelReceiptTax(data: ReceiptPrintData) {
  const { amountPaidCedis, senderPaidCedis, taxBreakdown } = data;
  return useMemo(
    () => computeParcelReceiptTax({ amountPaidCedis, senderPaidCedis, taxBreakdown }),
    [amountPaidCedis, senderPaidCedis, taxBreakdown],
  );
}
