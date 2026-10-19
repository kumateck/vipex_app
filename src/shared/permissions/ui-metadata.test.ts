import { describe, expect, test } from 'bun:test';
import { PermissionCatalogUi } from './constants';
import { GROUP_DEFAULTS } from './ui-metadata-mapping';

describe('permission UI metadata', () => {
  test('maps every permission catalog group, so the role editor can load', async () => {
    const unmapped = [...new Set(PermissionCatalogUi.map((p) => p.group))].filter(
      (group) => !GROUP_DEFAULTS[group],
    );
    expect(unmapped).toEqual([]);

    // The module throws at import time when a group or tree entry is missing.
    const { PermissionUiCatalog } = await import('./ui-metadata');
    expect(PermissionUiCatalog).toHaveLength(PermissionCatalogUi.length);
  });

  test('places customer website messages under Commercial customer lifecycle', async () => {
    const { PermissionUiCatalog } = await import('./ui-metadata');
    const messages = PermissionUiCatalog.filter((p) => p.group === 'Customer Messages');
    expect(messages.map((p) => p.key).sort()).toEqual([
      'CanManageCustomerMessages',
      'CanReadCustomerMessages',
    ]);
    for (const permission of messages) {
      expect([permission.domain, permission.subdomain, permission.module]).toEqual([
        'Commercial',
        'Customer Lifecycle',
        'Customer Website Messages',
      ]);
    }
  });

  test('lists all storage clearance permissions together, including Finance execution', async () => {
    const { PermissionUiCatalog } = await import('./ui-metadata');
    const clearance = PermissionUiCatalog.filter((p) => p.key.includes('StorageClearance'));
    expect(clearance.map((p) => p.key).sort()).toEqual([
      'CanApproveParcelStorageClearance',
      'CanExecuteParcelStorageClearance',
      'CanReadParcelStorageClearances',
      'CanRequestParcelStorageClearance',
    ]);
    for (const permission of clearance) {
      expect([permission.domain, permission.subdomain, permission.module]).toEqual([
        'Operations',
        'Parcel Lifecycle',
        'Storage Fee Clearance',
      ]);
    }
  });
});
