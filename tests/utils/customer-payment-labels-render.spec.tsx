import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { CustomerTransactionsTab } from '@/features/customers/components/details';
import type { CustomerTransaction } from '@/features/customers/api';
import { ParcelCreditChargeAction } from '@/features/operations/parcel-credit-charge';
import { useAuthStore } from '@/stores/auth-store';

const noop = () => {};
function render(statuses: CustomerTransaction['paymentStatus'][]) {
  const data: CustomerTransaction[] = statuses.map((paymentStatus, index) => ({
    id: `parcel-${index}`,
    bookingCode: `BOOK${index}`,
    trackingCode: `TRACK${index}`,
    sourceId: 'source',
    destinationId: 'destination',
    status: 5,
    chargePsw: paymentStatus === 'CHARGE_MISSING' ? 0 : 5000,
    method: paymentStatus === 'CREDIT' ? 4 : 0,
    transactionRole: 'SENDER',
    createdAt: '2026-10-26T00:00:00Z',
    paymentStatus,
    paidPrincipalPsw: 0,
    creditPaidPsw: 0,
  }));
  return renderToStaticMarkup(
    <CustomerTransactionsTab
      isLoadingTransactions={false}
      transactions={{
        data,
        meta: {
          page: 1,
          pageSize: 20,
          totalRecords: data.length,
          totalPages: 1,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      }}
      branchNameById={new Map([['source', 'Source']])}
      txPage={1}
      onPrevPage={noop}
      onNextPage={noop}
      onViewParcel={noop}
    />,
  );
}
describe('customer transaction payment-status rendering', () => {
  test('shows all four payment labels beside operational status and role', () => {
    const html = render(['PAID', 'TO_BE_PAID', 'PARTIAL', 'CREDIT']);
    for (const label of ['Paid', 'To Be Paid', 'Partial', 'Credit', 'Sender', 'Awaiting Pickup'])
      expect(html).toContain(label);
  });
  test('zero charge shows a missing-charge label', () => {
    const html = render(['CHARGE_MISSING']);
    expect(html).toContain('Charge missing');
    expect(html).not.toContain('>Paid<');
  });
  test('correction action is hidden for nonzero charges and users without the dedicated grant', () => {
    const user = useAuthStore.getState().user;
    useAuthStore.setState({ user: null });
    try {
      expect(
        renderToStaticMarkup(
          <ParcelCreditChargeAction
            parcelId="parcel"
            bookingCode="BOOK"
            chargePsw={5000}
            senderName="Sender"
          />,
        ),
      ).toBe('');
      expect(
        renderToStaticMarkup(
          <ParcelCreditChargeAction
            parcelId="parcel"
            bookingCode="BOOK"
            chargePsw={0}
            senderName="Sender"
          />,
        ),
      ).toBe('');
    } finally {
      useAuthStore.setState({ user });
    }
  });
});
