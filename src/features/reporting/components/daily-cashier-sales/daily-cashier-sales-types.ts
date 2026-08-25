export type DailyCashierSalesFilterState = {
  date: string;
  branchId: string | null;
  locationId: string | null;
  cashierType: number | null;
  cashierUserId: string | null;
};

export type DailyCashierSalesFilterLabel = {
  label: string;
  value: string;
};

export type DailyCashierSalesReportTab = 'payments' | 'tobepaid';

export type CashierSalesOption = {
  id: string;
  name: string;
};

export type DailyCashierSalesDisplayTransaction = DailyCashierSalesTransactionRow & {
  paymentIds: string[];
  isDeliveryCashierGroup: boolean;
  toBePaidAmountPsw: number;
  deliveryFeeAmountPsw: number;
};
import type { DailyCashierSalesTransactionRow } from '@/features/reporting/api/reporting.api';
