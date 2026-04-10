import { Navigate, useParams } from 'react-router-dom';
import { fromDomainSlug, dashboardPathForDomain } from '../domain-slugs';
import { resolvePrimaryDomain } from '../primary-domain';
import { useAuthStore } from '@/stores/auth-store';
import { CommercialDashboardPage } from './commercial-dashboard-page';
import { FinanceDashboardPage } from './finance-dashboard-page';
import { GovernanceDashboardPage } from './governance-dashboard-page';
import { HumanCapitalDashboardPage } from './human-capital-dashboard-page';
import { InsightsDashboardPage } from './insights-dashboard-page';
import { OperationsDashboardPage } from './operations-dashboard-page';
import { SupplyChainDashboardPage } from './supply-chain-dashboard-page';
import { TechnologyDashboardPage } from './technology-dashboard-page';

export function DomainDashboardRoutePage() {
  const { domain: domainSlug } = useParams();
  const user = useAuthStore((state) => state.user);
  const resolvedFromRoute = fromDomainSlug(domainSlug);
  const fallbackDomain = resolvePrimaryDomain(user);
  const domain = resolvedFromRoute ?? fallbackDomain;

  if (!resolvedFromRoute && domainSlug) {
    return <Navigate to={dashboardPathForDomain(fallbackDomain)} replace />;
  }

  if (domain === 'Operations') return <OperationsDashboardPage />;
  if (domain === 'Commercial') return <CommercialDashboardPage />;
  if (domain === 'Finance') return <FinanceDashboardPage />;
  if (domain === 'Supply Chain') return <SupplyChainDashboardPage />;
  if (domain === 'Human Capital') return <HumanCapitalDashboardPage />;
  if (domain === 'Technology') return <TechnologyDashboardPage />;
  if (domain === 'Governance') return <GovernanceDashboardPage />;
  return <InsightsDashboardPage />;
}
