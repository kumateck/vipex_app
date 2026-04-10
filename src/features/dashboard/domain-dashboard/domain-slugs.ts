import type { MainPermissionTab } from '@/shared/permissions/ui-metadata';
import type { DomainSlug } from './types';

const DOMAIN_TO_SLUG: Record<MainPermissionTab, DomainSlug> = {
  Operations: 'operations',
  Commercial: 'commercial',
  Finance: 'finance',
  'Supply Chain': 'supply-chain',
  'Human Capital': 'human-capital',
  Technology: 'technology',
  Governance: 'governance',
  Insights: 'insights',
};

const SLUG_TO_DOMAIN: Record<DomainSlug, MainPermissionTab> = {
  operations: 'Operations',
  commercial: 'Commercial',
  finance: 'Finance',
  'supply-chain': 'Supply Chain',
  'human-capital': 'Human Capital',
  technology: 'Technology',
  governance: 'Governance',
  insights: 'Insights',
};

export function toDomainSlug(domain: MainPermissionTab): DomainSlug {
  return DOMAIN_TO_SLUG[domain];
}

export function fromDomainSlug(value?: string | null): MainPermissionTab | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase() as DomainSlug;
  return SLUG_TO_DOMAIN[normalized] ?? null;
}

export function dashboardPathForDomain(domain: MainPermissionTab) {
  return `/app/${toDomainSlug(domain)}/dashboard`;
}
