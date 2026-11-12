import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Customer } from '@/features/customers/api';
import { DebtStatementPrint } from './debt-statement-print';

test('the customer copy includes the original parcel time, references, contents and net amount due', () => {
  const markup = renderToStaticMarkup(
    <DebtStatementPrint
      printRef={{ current: null }}
      companyName="Vipex"
      customer={{ fullname: 'Test Business', telephone: '0240000000' } as Customer}
      statement={{
        generatedAt: '2026-11-12T14:00:00.000Z',
        summary: {
          parcelCount: 1,
          oldestParcelCreatedAt: '2025-01-04T09:25:00.000Z',
          parcelOutstandingPsw: 7500,
          otherCreditActivityPsw: -500,
          accountBalancePsw: 7000,
        },
        parcels: [
          {
            parcelId: 'parcel',
            bookingCode: 'BOOK-123',
            trackingCode: 'TRACK-456',
            parcelDetails: 'Two cartons',
            parcelContent: 'Books',
            createdAt: '2025-01-04T09:25:00.000Z',
            chargeAmountPsw: 7500,
            allocatedAmountPsw: 0,
            outstandingAmountPsw: 7500,
          },
        ],
      }}
    />,
  );
  for (const expected of [
    'Outstanding Debt Statement',
    'Test Business',
    '0240000000',
    '04 Jan 2025, 09:25',
    '12 Nov 2026, 14:00 GMT',
    'BOOK-123',
    'TRACK-456',
    'Two cartons',
    'Books',
    'Total amount due',
    '70.00',
    '75.00',
    'Other credit account activity',
  ])
    expect(markup).toContain(expected);
});
