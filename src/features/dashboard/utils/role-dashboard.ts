export type DashboardRoleKey =
  | 'admin'
  | 'cashier'
  | 'auditor'
  | 'it'
  | 'ceo'
  | 'accountant'
  | 'secretary'
  | 'hr-manager';

const ROLE_KEYWORDS: Record<DashboardRoleKey, string[]> = {
  admin: ['admin', 'administrator'],
  cashier: ['cashier'],
  auditor: ['auditor', 'audit'],
  it: ['it', 'tech', 'technical', 'informationtechnology'],
  ceo: ['ceo', 'chiefexecutiveofficer'],
  accountant: ['accountant', 'accounts', 'finance'],
  secretary: ['secretary', 'frontdesk', 'frontoffice'],
  'hr-manager': ['hrmanager', 'humanresourcesmanager', 'humanresources', 'hr'],
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function resolveDashboardRoleKey(roleName?: string | null): DashboardRoleKey | null {
  if (!roleName) return null;

  const value = normalize(roleName);
  for (const [key, keywords] of Object.entries(ROLE_KEYWORDS) as Array<
    [DashboardRoleKey, string[]]
  >) {
    if (keywords.some((keyword) => value.includes(normalize(keyword)))) {
      return key;
    }
  }

  return null;
}

export function dashboardPathForRole(roleKey: DashboardRoleKey): string {
  return `/dashboard/${roleKey}`;
}

export const DASHBOARD_ROLE_LABELS: Record<DashboardRoleKey, string> = {
  admin: 'Admin Dashboard',
  cashier: 'Cashier Dashboard',
  auditor: 'Auditor Dashboard',
  it: 'IT Dashboard',
  ceo: 'CEO Dashboard',
  accountant: 'Accountant Dashboard',
  secretary: 'Secretary Dashboard',
  'hr-manager': 'HR Manager Dashboard',
};
