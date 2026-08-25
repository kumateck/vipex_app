import { mobileApiGet } from '@mobile/lib/api';
import type { CashierSalesReport } from '../types';

export function getCashierSalesReport(input: {
  accessToken: string;
  date: string;
  cashierUserId: string;
  cashierType?: number | null;
  locationId?: string | null;
}) {
  return mobileApiGet<CashierSalesReport>({
    path: '/reports/daily-cashier-sales',
    token: input.accessToken,
    query: {
      date: input.date,
      cashierUserId: input.cashierUserId,
      cashierType: input.cashierType,
      locationId: input.locationId,
    },
  });
}
