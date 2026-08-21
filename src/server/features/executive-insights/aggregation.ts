import {
  getCashFlowStatementSvc,
  getIncomeStatementSvc,
} from '@/server/features/accounting/service';
import { getAuditAnalyticsSvc } from '@/server/features/audit/service';
import {
  getBranchProfitabilityReportSvc,
  getCreditExposureReportSvc,
} from '@/server/features/reporting/service';
import { safeCall } from '@/server/services/ai-briefs/safe-call';
import type { ExecutiveInsightsScope, GroundingSnapshot } from './dto';

function toCedis(psw: number | null | undefined): number {
  return Math.round((psw ?? 0) / 100);
}

export async function buildGroundingSnapshot(
  scope: ExecutiveInsightsScope,
): Promise<GroundingSnapshot> {
  const { companyId, branchId, from, to } = scope;

  const [income, cashFlow, branchProfitability, creditExposure, auditAnalytics] = await Promise.all(
    [
      safeCall('income statement', () =>
        getIncomeStatementSvc({ companyId, branchId, dateFrom: from, dateTo: to }),
      ),
      safeCall('cash flow', () =>
        getCashFlowStatementSvc({ companyId, branchId, dateFrom: from, dateTo: to }),
      ),
      safeCall('branch profitability', () =>
        getBranchProfitabilityReportSvc({ companyId, branchId, from, to }),
      ),
      safeCall('credit exposure', () => getCreditExposureReportSvc({ companyId, branchId })),
      safeCall('audit analytics', () => getAuditAnalyticsSvc({ companyId, from, to })),
    ],
  );

  return {
    periodFrom: from,
    periodTo: to,
    branchId: branchId ?? null,
    totalIncomeCedis: toCedis(income?.totals.totalIncomePsw),
    totalExpenseCedis: toCedis(income?.totals.totalExpensePsw),
    netProfitCedis: toCedis(income?.totals.netProfitPsw),
    netCashChangeCedis: toCedis(cashFlow?.totals.netChangeInCashPsw),
    operatingCashNetCedis: toCedis(cashFlow?.operating.netPsw),
    branches: (branchProfitability?.rows ?? []).map((row) => ({
      branchName: row.branchName,
      incomeCedis: toCedis(row.incomePsw),
      expenseCedis: toCedis(row.expensePsw),
      netProfitCedis: toCedis(row.netProfitPsw),
    })),
    creditOutstandingCedis: toCedis(creditExposure?.totals.outstandingPsw),
    creditBucket1To30Cedis: toCedis(creditExposure?.totals.bucket1To30Psw),
    creditBucket31To60Cedis: toCedis(creditExposure?.totals.bucket31To60Psw),
    creditBucket61To90Cedis: toCedis(creditExposure?.totals.bucket61To90Psw),
    creditBucket91PlusCedis: toCedis(creditExposure?.totals.bucket91PlusPsw),
    auditTotalEvents: auditAnalytics?.totalEvents ?? 0,
    auditSuspiciousActions: auditAnalytics?.suspiciousActions ?? 0,
    auditDeletedActions: auditAnalytics?.deletedActions ?? 0,
    auditSecuritySignals: auditAnalytics?.securitySignals ?? 0,
    dataCompleteness: {
      income: income !== null,
      cashFlow: cashFlow !== null,
      branchProfitability: branchProfitability !== null,
      creditExposure: creditExposure !== null,
      auditAnalytics: auditAnalytics !== null,
    },
  };
}
