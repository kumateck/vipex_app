import { describe, expect, mock, test } from 'bun:test';
import { ParcelStatus } from '@/db/schemas/enums';

const lookup = mock(async (_parcelId: string) => null as { id: string } | null);
const getParcel = mock(async (_parcelId: string) => ({ status: ParcelStatus.AWAITING_PICKUP }));
mock.module('./parcel-reconciliation-cases.repository', () => ({
  getOpenReconciliationCaseBlockingDeliveryRepo: lookup,
}));
mock.module('./parcels.repository', () => ({ getParcelRepo: getParcel }));

const { assertNoOpenParcelReconciliationCaseForDelivery } = await import(
  './parcel-delivery-reconciliation-guard'
);

describe('parcel delivery reconciliation hold', () => {
  test('allows delivery when there is no open case', async () => {
    lookup.mockResolvedValueOnce(null);
    await expect(
      assertNoOpenParcelReconciliationCaseForDelivery('parcel-1'),
    ).resolves.toBeUndefined();
    expect(lookup).toHaveBeenCalledWith('parcel-1', expect.anything());
  });

  test('returns a conflict for an open case', async () => {
    lookup.mockResolvedValueOnce({ id: 'case-1' });
    await expect(assertNoOpenParcelReconciliationCaseForDelivery('parcel-1')).rejects.toMatchObject(
      {
        status: 409,
        message: 'Parcel has an open reconciliation case; resolve it before delivery',
      },
    );
  });

  test('blocks delivery when the parcel is marked for return', async () => {
    getParcel.mockResolvedValueOnce({ status: ParcelStatus.RETURN_TO_SOURCE });
    await expect(assertNoOpenParcelReconciliationCaseForDelivery('parcel-1')).rejects.toMatchObject(
      {
        status: 409,
        message: 'Parcel is marked for return to its source branch',
      },
    );
  });
});
