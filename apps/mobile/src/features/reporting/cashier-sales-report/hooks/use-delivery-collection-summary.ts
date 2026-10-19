import { useMemo } from 'react';
import { CashierType } from '@/db/schemas/enums';
import { getDeliveryCashierCollections } from '@/shared/reporting';
import type { CashierSalesReport } from '../types';

export function useDeliveryCollectionSummary(report: CashierSalesReport | null) {
  const collections = useMemo(
    () => getDeliveryCashierCollections(report?.transactions),
    [report?.transactions],
  );
  return {
    ...collections,
    visible:
      collections.hasDeliveryPayments || report?.filters?.cashierType === CashierType.DELIVERY,
  };
}
