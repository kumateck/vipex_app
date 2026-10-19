import { PaymentMethod } from '@/db/schemas/enums';
import type { DailyCashierSalesTransactionRow } from '@/features/reporting/api/reporting.api';
import { getTransactionCashierModule } from './daily-cashier-sales-module-filter';

export type CashierSalesRouteSummary = {
  sourceBranchId: string;
  sourceBranchName: string;
  destinationBranchId: string;
  destinationBranchName: string;
  transactions: number;
  senderPsw: number;
  receiverPsw: number;
  deliveryPsw: number;
  cashPsw: number;
  nonCashPsw: number;
  grossPsw: number;
};

export function summarizeCashierSalesByRoute(
  transactions: DailyCashierSalesTransactionRow[],
): CashierSalesRouteSummary[] {
  const routes = new Map<string, CashierSalesRouteSummary>();
  for (const transaction of transactions) {
    const key = `${transaction.sourceBranchId}:${transaction.destinationBranchId}`;
    let route = routes.get(key);
    if (!route) {
      route = {
        sourceBranchId: transaction.sourceBranchId,
        sourceBranchName: transaction.sourceBranchName || transaction.sourceBranchId,
        destinationBranchId: transaction.destinationBranchId,
        destinationBranchName: transaction.destinationBranchName || transaction.destinationBranchId,
        transactions: 0,
        senderPsw: 0,
        receiverPsw: 0,
        deliveryPsw: 0,
        cashPsw: 0,
        nonCashPsw: 0,
        grossPsw: 0,
      };
      routes.set(key, route);
    }
    const amount = Number(transaction.grossAmountPsw ?? 0);
    route.transactions += 1;
    route.grossPsw += amount;
    if (transaction.method === PaymentMethod.CASH) route.cashPsw += amount;
    else route.nonCashPsw += amount;

    const module = getTransactionCashierModule(transaction);
    if (module === 'sender') route.senderPsw += amount;
    if (module === 'receiver') route.receiverPsw += amount;
    if (module === 'delivery') route.deliveryPsw += amount;
  }

  return [...routes.values()].sort(
    (a, b) =>
      a.sourceBranchName.localeCompare(b.sourceBranchName) ||
      a.destinationBranchName.localeCompare(b.destinationBranchName),
  );
}
