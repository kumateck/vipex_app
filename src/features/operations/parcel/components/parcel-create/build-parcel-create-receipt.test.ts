import { describe, expect, test } from 'bun:test';
import { buildParcelCreateReceipt } from './build-parcel-create-receipt';
import { createInitialFormValues } from './parcel-create-form.utils';

describe('buildParcelCreateReceipt', () => {
  test('prints the selected location name and never its identifier', () => {
    const values = createInitialFormValues();
    const parcel = values.parcels[0];
    if (!parcel) throw new Error('Expected an initial parcel');

    values.sender = {
      customerId: 'sender-id',
      fullname: 'Sender Name',
      telephone: '0200000000',
      telephone2: '',
    };
    Object.assign(parcel, {
      destinationBranchId: 'branch-id',
      destinationLocationId: 'mkz8khnnkc6wpdnv61mrsxun',
      destinationLocationName: 'VIP Bus Terminal',
      parcelDetails: '1 bag',
      parcelContent: 'Clothes',
      charge: '100',
      receiver: {
        customerId: 'receiver-id',
        fullname: 'Receiver Name',
        telephone: '0240000000',
        telephone2: '',
      },
    });

    const receipt = buildParcelCreateReceipt({
      response: {
        bookingId: 'booking-id',
        parcels: [{ id: 'parcel-id', trackingCode: 'TRACK-1', bookingCode: 'BOOK-1' }],
        payments: [],
      },
      values,
      amounts: [{ charge: 100, value: 0, partial: 0 }],
      branchOptions: [{ id: 'branch-id', name: 'Accra' }],
    });

    expect(receipt.parcels[0]?.destinationLocationName).toBe('VIP Bus Terminal');
    expect(JSON.stringify(receipt)).not.toContain('mkz8khnnkc6wpdnv61mrsxun');
  });
});
