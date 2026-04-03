import { BadRequest } from '@/server/utils/http-error';
import { ensureCompanyModuleEnabledSvc } from '../company-modules/service';
import { getModuleWorkspaceMetricsRepo } from './repository';

const SUPPORTED_MODULE_CODES = new Set([
  'procurement',
  'fleet_transport',
  'customer_wallet_credit',
  'sla_claims',
  'reconciliation',
  'document_compliance',
  'dispatch_optimization',
  'notification_hub',
  'bi_executive_dashboard',
  'partner_agent_portal',
]);

const MODULE_CHECKPOINTS: Record<string, string[]> = {
  procurement: [
    'Purchase requests with approvals',
    'Supplier ledger and onboarding',
    'PO-to-payment workflow',
  ],
  fleet_transport: [
    'Vehicle assignment by branch',
    'Fuel and trip logs',
    'Maintenance schedule tracking',
  ],
  customer_wallet_credit: [
    'Wallet top-up and deductions',
    'Credit limit enforcement',
    'Aging and auto-block rules',
  ],
  sla_claims: ['SLA breach tracking', 'Claims intake and triage', 'Compensation workflow'],
  reconciliation: [
    'Cashier/session reconciliation',
    'Branch vs HQ variance checks',
    'Bank settlement matching',
  ],
  document_compliance: [
    'KYC and contract document hub',
    'Retention policy controls',
    'Audit-ready document trail',
  ],
  dispatch_optimization: ['Route batching', 'Rider load balancing', 'ETA prediction'],
  notification_hub: [
    'Template management (SMS/WhatsApp/email)',
    'Delivery and exception alerts',
    'Retry and delivery logs',
  ],
  bi_executive_dashboard: [
    'Cross-branch KPI dashboards',
    'Profitability analytics',
    'Tax and settlement views',
  ],
  partner_agent_portal: [
    'Partner booking workspace',
    'External tracking access',
    'Webhook and settlement integration',
  ],
};

export async function getModuleWorkspaceOverviewSvc(input: {
  companyId: string;
  moduleCode: string;
}) {
  if (!SUPPORTED_MODULE_CODES.has(input.moduleCode)) {
    throw BadRequest(`Unsupported module workspace: ${input.moduleCode}`);
  }

  await ensureCompanyModuleEnabledSvc(input.companyId, input.moduleCode);

  const metrics = await getModuleWorkspaceMetricsRepo(input.companyId);

  return {
    moduleCode: input.moduleCode,
    snapshotAt: new Date().toISOString(),
    checkpoints: MODULE_CHECKPOINTS[input.moduleCode] ?? [],
    metrics,
  };
}
