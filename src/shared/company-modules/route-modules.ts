export const MODULE_ROUTE_PREFIXES: ReadonlyArray<{ moduleCode: string; prefix: string }> = [
  { moduleCode: 'accounting', prefix: '/accounting' },
  { moduleCode: 'payroll', prefix: '/payroll' },
  { moduleCode: 'hr', prefix: '/hr' },
  { moduleCode: 'procurement', prefix: '/procurement' },
  { moduleCode: 'fleet_transport', prefix: '/fleet-transport' },
  { moduleCode: 'customer_wallet_credit', prefix: '/customer-wallet-credit' },
  { moduleCode: 'sla_claims', prefix: '/sla-claims' },
  { moduleCode: 'reconciliation', prefix: '/reconciliation' },
  { moduleCode: 'document_compliance', prefix: '/document-compliance' },
  { moduleCode: 'dispatch_optimization', prefix: '/dispatch-optimization' },
  { moduleCode: 'notification_hub', prefix: '/notification-hub' },
  { moduleCode: 'communication_calls_livekit', prefix: '/communication/calls' },
  { moduleCode: 'communication_internal', prefix: '/communication' },
  { moduleCode: 'it_support', prefix: '/it-support' },
  { moduleCode: 'bi_executive_dashboard', prefix: '/bi-executive-dashboard' },
  { moduleCode: 'partner_agent_portal', prefix: '/partner-agent-portal' },
];

export function inferRequiredModuleByPath(pathname?: string): string | undefined {
  if (!pathname) return undefined;
  return MODULE_ROUTE_PREFIXES.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )?.moduleCode;
}
