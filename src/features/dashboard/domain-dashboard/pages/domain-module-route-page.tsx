import { Navigate, useParams } from 'react-router-dom';
import { buildDashboard } from '../build-dashboard';
import { dashboardPathForDomain, fromDomainSlug } from '../domain-slugs';
import { useAuthStore } from '@/stores/auth-store';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export function DomainModuleRoutePage() {
  const { domain: domainSlug, subdomain: subdomainSlug, module: moduleSlug } = useParams();
  const user = useAuthStore((state) => state.user);
  const domain = fromDomainSlug(domainSlug);

  if (!domain) return <Navigate to="/dashboard" replace />;

  const model = buildDashboard(user, domain);
  const match = model.widgets.find(
    (widget) =>
      slugify(widget.subdomain) === (subdomainSlug ?? '') &&
      slugify(widget.module) === (moduleSlug ?? ''),
  );

  if (!match) return <Navigate to={dashboardPathForDomain(domain)} replace />;
  return <Navigate to={match.route} replace />;
}
