import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { parsePositiveCedis } from '@/shared/customers/credit-settlement';
import { CustomerDebtSettlementView } from '@/features/customers/credit-settlement/components/customer-debt-settlement';
import type { CreditSettlementModel } from '@/features/customers/credit-settlement/hooks';

const noop = () => {};
function model(overrides: Partial<CreditSettlementModel> = {}): CreditSettlementModel {
  return {
    parcels: [
      {
        parcelId: 'parcel',
        bookingCode: 'BOOK123',
        trackingCode: 'TRACK123',
        createdAt: '2026-10-26T00:00:00Z',
        chargeAmountPsw: 5000,
        allocatedAmountPsw: 0,
        outstandingAmountPsw: 5000,
      },
    ],
    selectedIdSet: new Set(overrides.selectedIds ?? []),
    selectedIds: [],
    totalPsw: 0,
    amount: '',
    reference: '',
    notes: '',
    isLoading: false,
    isFetching: false,
    isError: false,
    canSubmit: false,
    exactAmount: false,
    refetch: noop,
    toggleParcel: noop,
    setAmount: noop,
    setReference: noop,
    setNotes: noop,
    submit: noop,
    ...overrides,
  } as unknown as CreditSettlementModel;
}
const render = (state: CreditSettlementModel) =>
  renderToStaticMarkup(<CustomerDebtSettlementView model={state} />);

describe('parcel credit settlement UI and money validation', () => {
  test('displays a selectable booking code and prevents unselected payment', () => {
    const html = render(model());
    expect(html).toContain('BOOK123');
    expect(html).toContain('TRACK123');
    expect(html).toContain('Settle BOOK123');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Pay selected parcels<\/button>/);
    expect(html).toContain('Each selected parcel is settled in full.');
  });
  test('displays the selected total and enables only the exact payment', () => {
    const html = render(
      model({
        selectedIds: ['parcel'],
        totalPsw: 5000,
        amount: '50.00',
        exactAmount: true,
        canSubmit: true,
      }),
    );
    expect(html).toContain('1 selected');
    expect(html).toContain('50.00');
    expect(html.match(/<button[^>]*>Pay selected parcels<\/button>/)?.[0]).not.toContain(
      'disabled=""',
    );
    const mismatch = render(model({ selectedIds: ['parcel'], totalPsw: 5000, amount: '49.00' }));
    expect(mismatch).toContain('Amount must match the selected total exactly.');
    expect(mismatch).toMatch(/<button[^>]*disabled=""[^>]*>Pay selected parcels<\/button>/);
  });
  test('makes loading, empty debt, failure recovery and saving visible', () => {
    expect(render(model({ isFetching: true }))).toContain('Loading outstanding parcels');
    expect(render(model({ parcels: [] }))).toContain('No outstanding parcel debt');
    expect(render(model({ isError: true }))).toContain('Retry');
    expect(render(model({ isLoading: true }))).toContain('Recording payment');
  });
  test('parses exact positive pesewas without silently rounding payments', () => {
    for (const value of [
      0,
      -1,
      '',
      '0.001',
      '50.001',
      'NaN',
      'Infinity',
      '1e2',
      '1,000',
      '9007199254740992',
    ])
      expect(parsePositiveCedis(value)).toBeNull();
    expect(parsePositiveCedis('0.01')).toBe(1);
    expect(parsePositiveCedis('19.99')).toBe(1999);
    expect(parsePositiveCedis(50)).toBe(5000);
  });
});
