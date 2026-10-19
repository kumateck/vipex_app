import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { ParcelStatus } from '@/db/schemas/enums';
import { ParcelSuperSearchPaymentCell } from './parcel-super-search-payment-cell';

const baseParcel = {
  parcelValuePsw: 10_000,
  chargePsw: 5_000,
  paidPrincipalPsw: 0,
  plannedToBePaidPsw: 0,
  status: ParcelStatus.PROCESSED,
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

  test('shows a blue S badge for a delivered parcel paid by the sender', () => {
    const markup = renderToStaticMarkup(
      <ParcelSuperSearchPaymentCell
        parcel={{
          ...baseParcel,
          status: ParcelStatus.DELIVERED_BY_OFFICE,
          paidPrincipalPsw: 5_000,
          senderPaidPrincipalPsw: 5_000,
        }}
      />,
    );

    expect(markup).toContain('Paid by:');
    expect(markup).toContain('bg-blue-600');
    expect(markup).toContain('aria-label="Sender paid">S</span>');
    expect(markup).not.toContain('title="Receiver paid"');
  });

  test('shows a red R badge for a delivered parcel paid by the receiver', () => {
    const markup = renderToStaticMarkup(
      <ParcelSuperSearchPaymentCell
        parcel={{
          ...baseParcel,
          status: ParcelStatus.DELIVERED_AT_HOME,
          paidPrincipalPsw: 5_000,
          receiverPaidPrincipalPsw: 5_000,
        }}
      />,
    );

    expect(markup).toContain('bg-red-600');
    expect(markup).toContain('aria-label="Receiver paid">R</span>');
    expect(markup).not.toContain('title="Sender paid"');
  });

  test('shows both badges for split principal payments after delivery', () => {
    const markup = renderToStaticMarkup(
      <ParcelSuperSearchPaymentCell
        parcel={{
          ...baseParcel,
          status: ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
          paidPrincipalPsw: 5_000,
          senderPaidPrincipalPsw: 2_000,
          receiverPaidPrincipalPsw: 3_000,
        }}
      />,
    );

    expect(markup).toContain('aria-label="Sender paid">S</span>');
    expect(markup).toContain('aria-label="Receiver paid">R</span>');
  });

  test('does not show payer badges before delivery', () => {
    const markup = renderToStaticMarkup(
      <ParcelSuperSearchPaymentCell
        parcel={{ ...baseParcel, senderPaidPrincipalPsw: 5_000, paidPrincipalPsw: 5_000 }}
      />,
    );

    expect(markup).not.toContain('Paid by:');
  });

  test('shows no payer badge without a recorded principal payment', () => {
    const markup = renderToStaticMarkup(
      <ParcelSuperSearchPaymentCell
        parcel={{ ...baseParcel, status: ParcelStatus.DELIVERED_BY_OFFICE }}
      />,
    );

    expect(markup).toContain('Paid by:');
    expect(markup).not.toContain('title="Sender paid"');
    expect(markup).not.toContain('title="Receiver paid"');
  });

  test('does not show a historical payer badge after a parcel is returned', () => {
    const markup = renderToStaticMarkup(
      <ParcelSuperSearchPaymentCell
        parcel={{
          ...baseParcel,
          status: ParcelStatus.RETURNED_TO_OFFICE,
          senderPaidPrincipalPsw: 5_000,
        }}
      />,
    );

    expect(markup).not.toContain('Paid by:');
  });
});
