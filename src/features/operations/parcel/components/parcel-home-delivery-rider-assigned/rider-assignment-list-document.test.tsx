import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import type { RiderDoorstepRecord } from '../../api/parcel.api';
import { RiderAssignmentListDocument } from './rider-assignment-list-document';

describe('rider assignment list document', () => {
  test('prints every supplied parcel with rider, view, and totals', () => {
    const rows = [
      {
        deliveryId: 'delivery-1',
        bookingCode: 'KS9612492L',
        trackingCode: 'TRACK-1',
        parcelDetails: 'Box',
        receiverName: 'Ada',
        receiverPhone: '0500000000',
        dropoffAddress: 'House 12, Adum Road, Kumasi',
        outstandingPrincipalPsw: 1200,
        deliveryFeePsw: 500,
        deliveryStatus: 'Dispatched',
      },
      {
        deliveryId: 'delivery-2',
        bookingCode: 'KS9612493L',
        trackingCode: 'TRACK-2',
        parcelDetails: 'Bag',
        receiverName: 'Ben',
        receiverPhone: '0500000001',
        outstandingPrincipalPsw: 800,
        deliveryFeePsw: 300,
        deliveryStatus: 'Dispatched',
      },
    ] as RiderDoorstepRecord[];

    const html = renderToStaticMarkup(
      <RiderAssignmentListDocument
        payload={{
          riderName: 'Kwame Rider',
          mode: 'current',
          rows,
          printedAt: '2026-09-29T12:00:00Z',
        }}
      />,
    );

    expect(html).toContain('Kwame Rider');
    expect(html).toContain('Current');
    expect(html).toContain('KS9612492L');
    expect(html).toContain('KS9612493L');
    expect(html).toContain('GHS 20.00');
    expect(html).toContain('GHS 8.00');
  });

  test('prints booking code, home address, and a blank delivered checkbox per parcel', () => {
    const rows = [
      {
        deliveryId: 'delivery-1',
        bookingCode: 'KS9612492L',
        trackingCode: 'TRACK-1',
        dropoffAddress: 'House 12, Adum Road, Kumasi',
        deliveryFeePsw: 500,
        plannedToBePaidPsw: 0,
        deliveryStatus: 'Dispatched',
      },
      {
        deliveryId: 'delivery-2',
        bookingCode: 'KS9612493L',
        trackingCode: 'TRACK-2',
        dropoffAddress: null,
        deliveryFeePsw: 300,
        plannedToBePaidPsw: 0,
        deliveryStatus: 'Dispatched',
      },
    ] as RiderDoorstepRecord[];

    const html = renderToStaticMarkup(
      <RiderAssignmentListDocument
        payload={{ riderName: 'Kwame Rider', mode: 'all', rows, printedAt: '2026-09-29T12:00:00Z' }}
      />,
    );

    expect(html).toContain('Booking Code');
    expect(html).toContain('Home Address');
    expect(html).toContain('House 12, Adum Road, Kumasi');
    expect(html).toContain('Delivered');
    expect(html.match(/rider-assignment-list-checkbox/g)).toHaveLength(2);
    expect(html).not.toContain('TRACK-1');
    expect(html).not.toContain('Tracking');
    expect(html).not.toContain('Status');
    expect(html).not.toContain('Dispatched');
  });

  test('includes assignments beyond the table default page size', () => {
    const rows = Array.from({ length: 12 }, (_, index) => ({
      deliveryId: `delivery-${index}`,
      bookingCode: `BOOKING-${index + 1}`,
      trackingCode: `TRACK-${index + 1}`,
      deliveryFeePsw: 0,
      plannedToBePaidPsw: 0,
      deliveryStatus: 'Dispatched',
    })) as RiderDoorstepRecord[];

    const html = renderToStaticMarkup(
      <RiderAssignmentListDocument
        payload={{ riderName: 'Kwame Rider', mode: 'all', rows, printedAt: '2026-09-29T12:00:00Z' }}
      />,
    );

    expect(html).toContain('BOOKING-12');
    expect(html).toContain('Parcels:</strong> 12');
  });
});
