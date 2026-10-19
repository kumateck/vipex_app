import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { CallCenterAssignmentPaymentCell } from './call-center-assignment-payment-cell';

const base = { chargePsw: 5_000, paidPrincipalPsw: 0, plannedToBePaidPsw: 0 };

describe('CallCenterAssignmentPaymentCell', () => {
  test('shows paid only for a processed payment', () => {
    const markup = renderToStaticMarkup(
      <CallCenterAssignmentPaymentCell parcel={{ ...base, paidPrincipalPsw: 5_000 }} />,
    );
    expect(markup).toContain('Paid');
    expect(markup).not.toContain('To be paid:');
    expect(markup).toContain('bg-emerald-500');
  });

  test('shows to be paid only for an unpaid parcel', () => {
    const markup = renderToStaticMarkup(
      <CallCenterAssignmentPaymentCell parcel={{ ...base, plannedToBePaidPsw: 5_000 }} />,
    );
    expect(markup).toContain('To Be Paid');
    expect(markup).not.toContain('Paid:');
    expect(markup).toContain('bg-amber-500');
  });

  test('shows both balances for a partial payment', () => {
    const markup = renderToStaticMarkup(
      <CallCenterAssignmentPaymentCell
        parcel={{ ...base, paidPrincipalPsw: 3_000, plannedToBePaidPsw: 2_000 }}
      />,
    );
    expect(markup).toContain('Partial');
    expect(markup).toContain('Paid:');
    expect(markup).toContain('To be paid:');
    expect(markup).toContain('bg-sky-500');
  });
});
