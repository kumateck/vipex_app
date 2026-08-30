import { CashierType, Payer, PaymentMethod } from '@/db/schemas/enums';
import type {
  DailyCashierSalesReport,
  DailyCashierSalesTransactionRow,
} from '@/features/reporting/api/reporting.api';
import type { DailyCashierSalesModuleFilter } from './daily-cashier-sales-types';

export const CASHIER_MODULE_LABELS: Record<DailyCashierSalesModuleFilter, string> = {
  all: 'All cashier modules',
  sender: 'Sender only',
  receiver: 'Receiver only',
  delivery: 'Delivery cashier only',
};

export function getTransactionCashierModule(
  transaction: DailyCashierSalesTransactionRow,
): Exclude<DailyCashierSalesModuleFilter, 'all'> {
  if (transaction.cashierType === CashierType.DELIVERY) return 'delivery';
  if (transaction.cashierType === CashierType.SENDING) return 'sender';
  if (transaction.cashierType === CashierType.TOBEPAID) return 'receiver';
  return transaction.payer === Payer.SENDER ? 'sender' : 'receiver';
}

function aggregateTransactions(transactions: DailyCashierSalesTransactionRow[]) {
  const totals = { transactions: transactions.length, grossPsw: 0, netPsw: 0, taxPsw: 0 };
  const paymentModeTotals = {
    cashPsw: 0,
    mtnPsw: 0,
    telecelPsw: 0,
    airtelPsw: 0,
    creditPsw: 0,
  };
  const cashierTypeTotals = { senderPsw: 0, receiverPsw: 0, deliveryPsw: 0 };

  for (const transaction of transactions) {
    totals.grossPsw += transaction.grossAmountPsw;
    totals.netPsw += transaction.netAmountPsw;
    totals.taxPsw += transaction.taxTotalPsw;
    if (transaction.method === PaymentMethod.CASH)
      paymentModeTotals.cashPsw += transaction.grossAmountPsw;
    if (transaction.method === PaymentMethod.MTN)
      paymentModeTotals.mtnPsw += transaction.grossAmountPsw;
    if (transaction.method === PaymentMethod.TELECEL)
      paymentModeTotals.telecelPsw += transaction.grossAmountPsw;
    if (transaction.method === PaymentMethod.AIRTEL)
      paymentModeTotals.airtelPsw += transaction.grossAmountPsw;
    if (transaction.method === PaymentMethod.CREDIT)
      paymentModeTotals.creditPsw += transaction.grossAmountPsw;

    const module = getTransactionCashierModule(transaction);
    if (module === 'sender') cashierTypeTotals.senderPsw += transaction.grossAmountPsw;
    if (module === 'receiver') cashierTypeTotals.receiverPsw += transaction.grossAmountPsw;
    if (module === 'delivery') cashierTypeTotals.deliveryPsw += transaction.grossAmountPsw;
  }

  return { totals, paymentModeTotals, cashierTypeTotals };
}

export function filterDailyCashierSalesReport(
  report: DailyCashierSalesReport | undefined,
  moduleFilter: DailyCashierSalesModuleFilter,
) {
  if (!report || moduleFilter === 'all') return report;

  const transactions = report.transactions.filter(
    (transaction) => getTransactionCashierModule(transaction) === moduleFilter,
  );
  const toBePaidRows = moduleFilter === 'sender' ? report.toBePaidRows : [];
  const transactionsBySession = new Map<string, DailyCashierSalesTransactionRow[]>();
  for (const transaction of transactions) {
    if (!transaction.sessionId) continue;
    const sessionTransactions = transactionsBySession.get(transaction.sessionId) ?? [];
    sessionTransactions.push(transaction);
    transactionsBySession.set(transaction.sessionId, sessionTransactions);
  }
  const toBePaidSessionIds = new Set(
    toBePaidRows.flatMap((row) => (row.sessionId ? [row.sessionId] : [])),
  );
  const reportTotals = aggregateTransactions(transactions);
  const sessions = report.sessions.flatMap((session) => {
    const sessionTransactions = transactionsBySession.get(session.id) ?? [];
    if (sessionTransactions.length === 0 && !toBePaidSessionIds.has(session.id)) return [];
    const { totals, paymentModeTotals } = aggregateTransactions(sessionTransactions);
    const { transactions: transactionCount, ...financialTotals } = totals;
    return [
      {
        ...session,
        totals: { transactionCount, ...financialTotals, ...paymentModeTotals },
      },
    ];
  });
  const toBePaidPsw = toBePaidRows.reduce(
    (sum, row) => sum + Number(row.plannedToBePaidPsw ?? 0),
    0,
  );

  return {
    ...report,
    filters: { ...report.filters, cashierModule: moduleFilter },
    totals: { sessions: sessions.length, toBePaidPsw, ...reportTotals.totals },
    paymentModeTotals: reportTotals.paymentModeTotals,
    cashierTypeTotals: reportTotals.cashierTypeTotals,
    sessions,
    transactions,
    toBePaidRows,
  };
}
