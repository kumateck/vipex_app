import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { ParcelStatus } from '@/db/schemas/enums';
import { ReturnToSourceAction } from './return-to-source-action';

const parcel = {
  id: 'parcel-1',
  bookingCode: 'BOOK-1',
  destinationId: 'destination-1',
  status: ParcelStatus.ARRIVED_AT_DESTINATION,
  isDeleted: false,
};

describe('return to source action', () => {
  test('shows for authorized destination staff with an eligible parcel', () => {
    const html = renderToStaticMarkup(
      <ReturnToSourceAction
        parcel={parcel}
        branchId="destination-1"
        sourceName="Source"
        canRecordReturn
        onReturnToSource={() => {}}
      />,
    );
    expect(html).toContain('Return to Source');
  });

  test.each([
    { branchId: 'another-branch', canRecordReturn: true, status: ParcelStatus.AWAITING_PICKUP },
    { branchId: 'destination-1', canRecordReturn: false, status: ParcelStatus.AWAITING_PICKUP },
    { branchId: 'destination-1', canRecordReturn: true, status: ParcelStatus.DELIVERED_BY_OFFICE },
  ])('hides for ineligible context %#', ({ branchId, canRecordReturn, status }) => {
    const html = renderToStaticMarkup(
      <ReturnToSourceAction
        parcel={{ ...parcel, status }}
        branchId={branchId}
        sourceName="Source"
        canRecordReturn={canRecordReturn}
        onReturnToSource={() => {}}
      />,
    );
    expect(html).toBe('');
  });
});
