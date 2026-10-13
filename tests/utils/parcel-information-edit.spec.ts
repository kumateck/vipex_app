import { describe, expect, test } from 'bun:test';
import { buildParcelInformationEdit } from '@/shared/shipments/parcel-information-edit';

const original = {
  id: 'parcel',
  receiverId: 'receiver',
  receiverName: 'Recorded Name',
  receiverPhone: '0240000001',
  parcelDetails: 'Box',
  parcelContent: 'Clothes',
};
const values = { receiverName: 'Recorded Name', receiverPhone: '0240000001', parcelDetails: 'Box' };

describe('parcel information edit request', () => {
  test('only a deliberate rename includes the parcel receiver and corrected name', () => {
    expect(
      buildParcelInformationEdit(original, { ...values, receiverName: ' Corrected Name ' }),
    ).toEqual({
      id: 'parcel',
      receiver: { id: 'receiver', fullname: 'Corrected Name' },
    });
  });
  test('telephone-only edits cannot overwrite a later customer profile rename', () => {
    expect(
      buildParcelInformationEdit(original, { ...values, receiverPhone: '050 000 0002' }),
    ).toEqual({
      id: 'parcel',
      receiver: { id: 'receiver', telephone: '0500000002' },
    });
  });
  test('details/content-only edits omit customer writes and normalize whitespace', () => {
    expect(
      buildParcelInformationEdit(original, {
        ...values,
        parcelDetails: ' Large Box ',
        parcelContent: ' Books ',
      }),
    ).toEqual({
      id: 'parcel',
      parcelDetails: 'Large Box',
      parcelContent: 'Books',
    });
  });
  test('unchanged normalized input sends no request', () => {
    expect(
      buildParcelInformationEdit(original, { ...values, receiverPhone: '024 000 0001' }),
    ).toBeNull();
  });
  test('clearing telephone explicitly writes null', () => {
    expect(
      buildParcelInformationEdit(original, { ...values, receiverPhone: '' })?.receiver,
    ).toEqual({ id: 'receiver', telephone: null });
  });
  test('a missing linked receiver rejects a receiver edit', () => {
    expect(() =>
      buildParcelInformationEdit(
        { ...original, receiverId: undefined },
        { ...values, receiverName: 'New' },
      ),
    ).toThrow('Receiver customer could not be identified');
  });
});
