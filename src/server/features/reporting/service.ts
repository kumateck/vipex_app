import { BadRequest } from '@/server/utils/http-error';
import { listCashierSessionsForDayRepo, listSessionTransactionsRepo } from './repository';

export async function getCashierDaySessionsReportSvc(input: {
  companyId: string;
  cashierId: string;
  date: string;
  branchId?: string | null;
  includeTransactions?: boolean;
}) {
  const reportDate = new Date(input.date);
  if (Number.isNaN(reportDate.getTime())) {
    throw BadRequest('Invalid date');
  }

  const sessions = await listCashierSessionsForDayRepo({
    companyId: input.companyId,
    cashierId: input.cashierId,
    date: reportDate,
    branchId: input.branchId ?? null,
  });

  const sessionIds = sessions.map((session) => session.id);
  const transactions =
    sessionIds.length && input.includeTransactions !== false
      ? await listSessionTransactionsRepo(sessionIds)
      : [];

  const transactionsBySession = new Map<string, typeof transactions>();
  for (const transaction of transactions) {
    if (!transaction.sessionId) continue;
    const current = transactionsBySession.get(transaction.sessionId) ?? [];
    current.push(transaction);
    transactionsBySession.set(transaction.sessionId, current);
  }

  return {
    cashierId: input.cashierId,
    date: input.date,
    sessions: sessions.map((session) => {
      const sessionTransactions = transactionsBySession.get(session.id) ?? [];
      const totalGrossPsw = sessionTransactions.reduce((sum, tx) => sum + tx.grossAmountPsw, 0);
      const totalNetPsw = sessionTransactions.reduce((sum, tx) => sum + tx.netAmountPsw, 0);
      const totalTaxPsw = sessionTransactions.reduce((sum, tx) => sum + tx.taxTotalPsw, 0);

      return {
        id: session.id,
        cashierId: session.cashierId,
        branchId: session.branchId,
        scheduledStartTime: session.scheduledStartTime.toISOString(),
        actualEndTime: session.actualEndTime ? session.actualEndTime.toISOString() : null,
        openingBalancePsw: session.openingBalancePsw,
        closingBalancePsw: session.closingBalancePsw,
        status: session.status,
        transactionCount: sessionTransactions.length,
        totalGrossPsw,
        totalNetPsw,
        totalTaxPsw,
        transactions: sessionTransactions.map((tx) => ({
          paymentId: tx.paymentId,
          parcelId: tx.parcelId,
          trackingCode: tx.trackingCode,
          method: tx.method,
          component: tx.component,
          payer: tx.payer,
          cashierType: tx.cashierType,
          grossAmountPsw: tx.grossAmountPsw,
          netAmountPsw: tx.netAmountPsw,
          taxTotalPsw: tx.taxTotalPsw,
          receivedAt: tx.receivedAt.toISOString(),
          receiptNo: tx.receiptNo,
        })),
      };
    }),
  };
}
