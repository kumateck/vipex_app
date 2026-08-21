import { getAuditAnalyticsSvc } from '@/server/features/audit/service';
import { getCreditExposureReportSvc } from '@/server/features/reporting/service';
import type { AiChatTool } from './types';

function toGhs(psw: number | null | undefined): number {
  return Math.round(((psw ?? 0) / 100) * 100) / 100;
}

export const getCreditExposureTool: AiChatTool<{ branchId?: string | null }> = {
  name: 'get_credit_exposure',
  description:
    'Returns customer credit/receivables exposure broken down by aging bucket (current, 1-30, 31-60, 61-90, 91+ days). Use this for questions about customer credit risk or outstanding receivables.',
  inputSchema: {
    type: 'object',
    properties: {
      branchId: {
        type: 'string',
        description: 'Optional branch id to scope the figures to a single branch.',
      },
    },
  },
  defaultChartType: 'donut',
  async handler(args, scope) {
    return getCreditExposureReportSvc({
      companyId: scope.companyId,
      branchId: args.branchId ?? null,
    });
  },
  toChartPoints(raw) {
    const totals = (
      raw as {
        totals?: {
          currentPsw: number;
          bucket1To30Psw: number;
          bucket31To60Psw: number;
          bucket61To90Psw: number;
          bucket91PlusPsw: number;
        };
      }
    )?.totals;
    if (!totals) return [];
    return [
      { label: 'Current', value: Math.round(totals.currentPsw / 100) },
      { label: '1-30 days', value: Math.round(totals.bucket1To30Psw / 100) },
      { label: '31-60 days', value: Math.round(totals.bucket31To60Psw / 100) },
      { label: '61-90 days', value: Math.round(totals.bucket61To90Psw / 100) },
      { label: '91+ days', value: Math.round(totals.bucket91PlusPsw / 100) },
    ];
  },
  toLlmSummary(raw) {
    const data = raw as {
      totals?: {
        customers: number;
        outstandingPsw: number;
        currentPsw: number;
        bucket1To30Psw: number;
        bucket31To60Psw: number;
        bucket61To90Psw: number;
        bucket91PlusPsw: number;
      };
    };
    return {
      currency: 'GHS',
      customerCount: data.totals?.customers ?? 0,
      totalOutstandingGhs: toGhs(data.totals?.outstandingPsw),
      currentGhs: toGhs(data.totals?.currentPsw),
      bucket1To30Ghs: toGhs(data.totals?.bucket1To30Psw),
      bucket31To60Ghs: toGhs(data.totals?.bucket31To60Psw),
      bucket61To90Ghs: toGhs(data.totals?.bucket61To90Psw),
      bucket91PlusGhs: toGhs(data.totals?.bucket91PlusPsw),
    };
  },
};

export const getAuditAnalyticsTool: AiChatTool<{ from?: string | null; to?: string | null }> = {
  name: 'get_audit_analytics',
  description:
    'Returns audit event counts: total events, actions flagged for review (keyword-matched, not verified fraud), deleted-record actions, role/permission changes, and security signals for a date range. Use this for questions about risk, compliance, or unusual activity.',
  inputSchema: {
    type: 'object',
    properties: {
      from: { type: 'string', description: 'Start date, ISO format (YYYY-MM-DD).' },
      to: { type: 'string', description: 'End date, ISO format (YYYY-MM-DD).' },
    },
  },
  defaultChartType: 'none',
  async handler(args, scope) {
    return getAuditAnalyticsSvc({
      companyId: scope.companyId,
      from: args.from ?? null,
      to: args.to ?? null,
    });
  },
  toChartPoints() {
    return [];
  },
  toLlmSummary(raw) {
    const data = raw as {
      totalEvents?: number;
      suspiciousActions?: number;
      deletedActions?: number;
      rolePermissionChanges?: number;
      moduleChanges?: number;
      securitySignals?: number;
    };
    return {
      totalEvents: data.totalEvents ?? 0,
      flaggedForReviewActions: data.suspiciousActions ?? 0,
      deletedRecordActions: data.deletedActions ?? 0,
      rolePermissionChanges: data.rolePermissionChanges ?? 0,
      moduleChanges: data.moduleChanges ?? 0,
      securitySignals: data.securitySignals ?? 0,
    };
  },
};
