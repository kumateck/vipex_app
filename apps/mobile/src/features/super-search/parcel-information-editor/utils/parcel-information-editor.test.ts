import { describe, expect, test } from 'bun:test';
import type { ParcelFullDetails, ParcelSearchRow } from '@mobile/types/parcels';
import type { EditableParcelInformation } from '../types';
import {
  buildSuperSearchInformationEdit,
  getParcelInformationAccess,
  resolveEditableParcel,
} from './parcel-information-editor';

const original: EditableParcelInformation = {
  id: 'parcel',
  sourceId: 'source',
  destinationId: 'destination',
  receiverId: 'receiver',
  bookingCode: 'BK1',
  parcelDetails: 'Box',
  receiverName: 'Recorded name',
  receiverAvailable: true,
};
const values = { parcelDetails: 'Box', receiverName: 'Recorded name' };
const permissions = ['CanReadParcels', 'CanUpdateParcels'];

describe('mobile Super Search information editing', () => {
  test.each(['source', 'destination'])(
    'permits details-only edits at the %s branch',
    (branchId) => {
      expect(getParcelInformationAccess(original, { branchId, permissions })).toEqual({
        canEdit: true,
        canEditReceiver: false,
      });
      expect(
        getParcelInformationAccess(original, {
          branchId,
          permissions: [...permissions, 'CanUpdateCustomers'],
        }).canEditReceiver,
      ).toBe(true);
    },
  );

  test.each([
    { branchId: 'other', permissions },
    { branchId: null, permissions },
    { branchId: 'source', permissions: ['CanReadParcels', 'CanUpdateCustomers'] },
    { branchId: 'source', permissions: ['CanUpdateParcels'] },
    { branchId: 'source', permissions: ['CanReadParcels', 'CanReadParcelScan'] },
  ])('rejects insufficient scope or grants (%j)', (user) => {
    expect(getParcelInformationAccess(original, user).canEdit).toBe(false);
  });

  test('deleted parcels remain read-only and unavailable receivers cannot be renamed', () => {
    const user = { branchId: 'source', permissions: [...permissions, 'CanUpdateCustomers'] };
    expect(getParcelInformationAccess({ ...original, isDeleted: true }, user).canEdit).toBe(false);
    expect(getParcelInformationAccess({ ...original, receiverAvailable: false }, user)).toEqual({
      canEdit: true,
      canEditReceiver: false,
    });
  });

  test('details-only editing omits all customer writes', () => {
    expect(
      buildSuperSearchInformationEdit(original, { ...values, parcelDetails: ' Large box ' }, false),
    ).toEqual({ id: 'parcel', parcelDetails: 'Large box' });
  });

  test('renaming sends only the selected parcel and linked receiver name', () => {
    expect(
      buildSuperSearchInformationEdit(
        original,
        { parcelDetails: ' Bag ', receiverName: ' Corrected name ' },
        true,
      ),
    ).toEqual({
      id: 'parcel',
      parcelDetails: 'Bag',
      receiver: { id: 'receiver', fullname: 'Corrected name' },
    });
  });

  test('telephone fields from a future details response cannot be cleared or changed', () => {
    const parcelWithPhone = { ...original, receiverPhone: '0240000001' };
    const patch = buildSuperSearchInformationEdit(
      parcelWithPhone,
      { ...values, receiverName: 'New name' },
      true,
    );
    expect(patch?.receiver).toEqual({ id: 'receiver', fullname: 'New name' });
    expect(buildSuperSearchInformationEdit(parcelWithPhone, values, true)).toBeNull();
  });

  test('unchanged trimmed input sends no update', () => {
    expect(
      buildSuperSearchInformationEdit(
        original,
        { parcelDetails: ' Box ', receiverName: ' Recorded name ' },
        true,
      ),
    ).toBeNull();
  });

  test.each(['', ' ', 'x'.repeat(256)])('rejects invalid parcel details (%j)', (parcelDetails) => {
    expect(() =>
      buildSuperSearchInformationEdit(original, { ...values, parcelDetails }, true),
    ).toThrow('Parcel details');
  });

  test.each(['', ' ', 'x'.repeat(256)])(
    'rejects an invalid receiver correction (%j)',
    (receiverName) => {
      expect(() =>
        buildSuperSearchInformationEdit(original, { ...values, receiverName }, true),
      ).toThrow('Receiver name');
    },
  );

  test('rejects receiver changes after customer permission is revoked', () => {
    expect(() =>
      buildSuperSearchInformationEdit(original, { ...values, receiverName: 'New' }, false),
    ).toThrow('Update Customers');
  });

  test('uses the selected parcel summary and never another parcel receiver', () => {
    const details = {
      parcel: original,
      summary: { ...original, receiverName: 'Saved name' },
    } as unknown as ParcelFullDetails;
    const row = { ...original, receiverName: 'Search name' } as unknown as ParcelSearchRow;
    expect(resolveEditableParcel({ details, row }).receiverName).toBe('Saved name');
    expect(
      resolveEditableParcel({ details: { ...details, summary: null }, row }).receiverName,
    ).toBe('Search name');
    expect(
      resolveEditableParcel({
        details: { ...details, summary: null },
        row: { ...row, id: 'different' },
      }).receiverAvailable,
    ).toBe(false);
    expect(
      resolveEditableParcel({
        details: { ...details, summary: null },
        row: { ...row, receiverId: 'changed' },
      }).receiverAvailable,
    ).toBe(false);
    expect(
      resolveEditableParcel({ details: { ...details, summary: null }, row: null })
        .receiverAvailable,
    ).toBe(false);
  });
});
