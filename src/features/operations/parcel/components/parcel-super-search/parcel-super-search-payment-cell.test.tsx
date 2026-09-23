import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { ParcelSuperSearchPaymentCell } from './parcel-super-search-payment-cell';

const baseParcel = {
  parcelValuePsw: 10_000,
  chargePsw: 5_000,
  paidPrincipalPsw: 0,
  plannedToBePaidPsw: 0,
};

describe('ParcelSuperSearchPaymentCell', () => {
  test('shows only Paid for a fully paid parcel', () => {
    const markup = renderToStaticMarkup(
      <ParcelSuperSearchPaymentCell parcel={{ ...baseParcel, paidPrincipalPsw: 5_000 }} />,
    );

    expect(markup).toContain('Paid:');
    expect(markup).not.toContain('To be paid:');
    expect(markup).toContain('bg-emerald-500');
  });

  test('shows only To be paid for a fully unpaid parcel', () => {
    const markup = renderToStaticMarkup(
      <ParcelSuperSearchPaymentCell parcel={{ ...baseParcel, plannedToBePaidPsw: 5_000 }} />,
    );

    expect(markup).not.toContain('Paid:');
    expect(markup).toContain('To be paid:');
    expect(markup).toContain('bg-amber-500');
  });

  test('shows Paid and To be paid for a partial parcel', () => {
    const markup = renderToStaticMarkup(
      <ParcelSuperSearchPaymentCell
        parcel={{ ...baseParcel, paidPrincipalPsw: 3_000, plannedToBePaidPsw: 2_000 }}
      />,
    );

    expect(markup).toContain('Paid:');
    expect(markup).toContain('To be paid:');
    expect(markup).toContain('bg-sky-500');
  });
});
