import { useMemo } from 'react';
import { CashierType } from '@/db/schemas/enums';
import { getDeliveryCashierCollections } from '@/shared/reporting';
import type { DailyCashierSalesReport } from '../../api/reporting.api';

export function useDeliveryCashierCollections(report?: DailyCashierSalesReport) {
  const collections = useMemo(
    () => getDeliveryCashierCollections(report?.transactions),
    [report?.transactions],
  );
  return {
    ...collections,
    visible:
      collections.hasDeliveryPayments ||
      report?.filters.cashierType === CashierType.DELIVERY ||
      report?.filters.cashierModule === 'delivery',
  };
}
