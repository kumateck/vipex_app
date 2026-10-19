import { describe, expect, test } from 'bun:test';
import { PermissionKeys } from '@/shared/permissions/constants';
import { getParcelInformationEditorAccess } from './parcel-information-editor-access';

const parcel = { sourceId: 'source' };
const permissions = [PermissionKeys.CanUpdateParcels, PermissionKeys.CanUpdateCustomers];
describe('sender parcel edit permissions', () => {
  test('allows source parcel updates and receiver corrections with both grants', () => {
    expect(getParcelInformationEditorAccess(parcel, { branchId: 'source', permissions })).toEqual({
      canEdit: true,
      canEditReceiver: true,
    });
  });
  test('permits details-only edits without customer update permission', () => {
    expect(
      getParcelInformationEditorAccess(parcel, {
        branchId: 'source',
        permissions: [PermissionKeys.CanUpdateParcels],
      }),
    ).toEqual({ canEdit: true, canEditReceiver: false });
  });
  test('does not expose sender edits at another or missing branch or on deleted parcels', () => {
    for (const branchId of ['destination', 'other', undefined])
      expect(getParcelInformationEditorAccess(parcel, { branchId, permissions }).canEdit).toBe(
        false,
      );
    expect(
      getParcelInformationEditorAccess(
        { ...parcel, isDeleted: true },
        { branchId: 'source', permissions },
      ).canEdit,
    ).toBe(false);
  });
  test('read workflow or customer permission alone does not expose outgoing edits', () => {
    for (const permission of [
      PermissionKeys.CanReadParcelScan,
      PermissionKeys.CanReadParcelIncoming,
      PermissionKeys.CanUpdateCustomers,
    ])
      expect(
        getParcelInformationEditorAccess(parcel, { branchId: 'source', permissions: [permission] })
          .canEdit,
      ).toBe(false);
  });
});
