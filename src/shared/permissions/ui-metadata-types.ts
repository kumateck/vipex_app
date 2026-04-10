import type { PermissionKey } from './constants';

export type MainPermissionTab =
  | 'Operations'
  | 'Commercial'
  | 'Finance'
  | 'Supply Chain'
  | 'Human Capital'
  | 'Technology'
  | 'Governance'
  | 'Insights';

export const MAIN_PERMISSION_TABS: MainPermissionTab[] = [
  'Operations',
  'Commercial',
  'Finance',
  'Supply Chain',
  'Human Capital',
  'Technology',
  'Governance',
  'Insights',
];

export type GroupDefault = {
  domain: MainPermissionTab;
  subdomain: string;
  module: string;
};

export type PermissionUiCatalogItem = {
  key: PermissionKey;
  group: string;
  domain: MainPermissionTab;
  subdomain: string;
  module: string;
  title: string;
  description: string;
  sortOrder: number;
  mainTab: MainPermissionTab;
};

export type PermissionTreeModule = {
  name: string;
  permissions: PermissionUiCatalogItem[];
};

export type PermissionTreeSubdomain = {
  name: string;
  modules: PermissionTreeModule[];
};

export type PermissionTreeNode = {
  domain: MainPermissionTab;
  subdomains: PermissionTreeSubdomain[];
};

export type PermissionTree = PermissionTreeNode[];

export function splitWords(value: string) {
  return value
    .replace(/^Can/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .trim();
}
