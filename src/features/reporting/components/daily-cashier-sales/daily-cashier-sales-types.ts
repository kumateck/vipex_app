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
