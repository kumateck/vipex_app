import {
  MAIN_PERMISSION_TABS,
  type MainPermissionTab,
  type PermissionUiCatalogItem,
} from './ui-metadata-types';

export function buildPermissionTree(catalog: PermissionUiCatalogItem[]) {
  const domainMap = new Map<
    MainPermissionTab,
    Map<string, Map<string, PermissionUiCatalogItem[]>>
  >();

  for (const permission of catalog) {
    const domainBucket = domainMap.get(permission.domain) ?? new Map();
    const subdomainBucket = domainBucket.get(permission.subdomain) ?? new Map();
    const moduleBucket = subdomainBucket.get(permission.module) ?? [];
    moduleBucket.push(permission);
    subdomainBucket.set(permission.module, moduleBucket);
    domainBucket.set(permission.subdomain, subdomainBucket);
    domainMap.set(permission.domain, domainBucket);
  }

  return MAIN_PERMISSION_TABS.map((domain) => {
    const subdomains = domainMap.get(domain) ?? new Map();
    return {
      domain,
      subdomains: [...subdomains.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([subdomainName, modules]) => ({
          name: subdomainName,
          modules: [...modules.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([moduleName, permissions]) => ({
              name: moduleName,
              permissions: permissions.sort((a, b) => a.title.localeCompare(b.title)),
            })),
        })),
    };
  });
}
