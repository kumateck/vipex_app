import { CashierType } from '@/db/schemas/enums';

export function getDailyCashierSalesPaymentTypes(cashierType?: number | null) {
  if (cashierType === null || cashierType === undefined) return null;
  if (cashierType === CashierType.FULL) {
    return [CashierType.SENDING, CashierType.TOBEPAID, CashierType.DELIVERY];
  }
  return [cashierType];
}
