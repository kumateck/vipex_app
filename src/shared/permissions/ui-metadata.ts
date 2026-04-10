import { PermissionCatalogUi } from './constants';
import {
  GROUP_DEFAULTS,
  KEY_OVERRIDES,
  resolveModule,
  resolveSubdomain,
} from './ui-metadata-mapping';
import { buildPermissionTree as buildPermissionTreeImpl } from './ui-metadata-tree';
import { splitWords } from './ui-metadata-types';
import type { PermissionUiCatalogItem } from './ui-metadata-types';

export type {
  GroupDefault,
  MainPermissionTab,
  PermissionTree,
  PermissionTreeModule,
  PermissionTreeNode,
  PermissionTreeSubdomain,
  PermissionUiCatalogItem,
} from './ui-metadata-types';
export { MAIN_PERMISSION_TABS } from './ui-metadata-types';
export { buildPermissionTreeImpl as buildPermissionTree };

const unknownGroups = [
  ...new Set(PermissionCatalogUi.map((permission) => permission.group)),
].filter((group) => !GROUP_DEFAULTS[group]);

if (unknownGroups.length > 0) {
  throw new Error(`Permission UI metadata missing group mappings for: ${unknownGroups.join(', ')}`);
}

export const PermissionUiCatalog: PermissionUiCatalogItem[] = PermissionCatalogUi.map(
  (permission, index) => {
    const groupDefault = GROUP_DEFAULTS[permission.group]!;
    const override = KEY_OVERRIDES[permission.key];
    const domain = override?.domain ?? groupDefault.domain;
    const subdomain = resolveSubdomain(permission, override?.subdomain ?? groupDefault.subdomain);
    const module = resolveModule(permission, override?.module ?? groupDefault.module);

    return {
      key: permission.key,
      group: permission.group,
      domain,
      subdomain,
      module,
      mainTab: domain,
      title: splitWords(permission.key),
      description: permission.description,
      sortOrder: index,
    };
  },
);

export const PermissionTreeCatalog = buildPermissionTreeImpl(PermissionUiCatalog);

const flattenedTreePermissions = PermissionTreeCatalog.flatMap((domain) =>
  domain.subdomains.flatMap((subdomain) =>
    subdomain.modules.flatMap((module) =>
      module.permissions.map((permission: PermissionUiCatalogItem) => permission.key),
    ),
  ),
);

if (flattenedTreePermissions.length !== PermissionUiCatalog.length) {
  throw new Error(
    `Permission tree mismatch: expected ${PermissionUiCatalog.length}, got ${flattenedTreePermissions.length}`,
  );
}
