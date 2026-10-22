import { describe, expect, test } from 'bun:test';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { renderToStaticMarkup } from 'react-dom/server';
import { ParcelStatus } from '@/db/schemas/enums';
import type { ParcelSearchRow } from '../../api/parcel.api';
import { useCashierSecondReceiverColumns } from './index';

const parcel = {
  id: 'handover-1',
  bookingCode: 'BOOK-123',
  trackingCode: 'TRACK-123',
  consignmentCode: 'CON-123',
  senderName: 'Sender Adom',
  senderPhone: '0201111111',
  senderPhone2: '0202222222',
  receiverName: 'Main Ama',
  receiverPhone: '0241111111',
  receiverPhone2: '0242222222',
  secondReceiverName: 'Second Kofi',
  secondReceiverPhone: '0271111111',
  secondReceiverPhone2: '0272222222',
  parcelDetails: '2 boxes',
  parcelContent: 'Household items',
  sourceName: 'Kumasi',
  sourceLocationName: 'Adum',
  destinationName: 'Accra',
  pickupLocationName: 'Office shelf',
  dropoffAddress: 'House 12, Spintex',
  riderName: 'Rider Kwame',
  deliveryFeePsw: 1500,
  parcelValuePsw: 10000,
  chargePsw: 5000,
  paidPrincipalPsw: 3000,
  plannedToBePaidPsw: 2000,
  status: ParcelStatus.DISPATCHED,
  createdAt: '2026-10-01T10:00:00Z',
  receivedAt: '2026-10-02T11:00:00Z',
} as ParcelSearchRow;

function Snapshot({ value, canManage }: { value: ParcelSearchRow; canManage: boolean }) {
  const columns = useCashierSecondReceiverColumns({ canManage, open: () => {} });
  const table = useReactTable({ data: [value], columns, getCoreRowModel: getCoreRowModel() });
  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((group) => (
          <tr key={group.id}>
            {group.headers.map((header) => (
              <th key={header.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const render = (value = parcel, canManage = true) =>
  renderToStaticMarkup(<Snapshot value={value} canManage={canManage} />);

describe('Upcoming Handovers grouped columns', () => {
  test('shows parcel references, content and all three clearly labeled customer contacts', () => {
    const markup = render();
    for (const text of [
      'Parcel Reference',
      'Customers',
      'Parcel Description',
      'Sender:',
      'Main receiver:',
      'Second receiver:',
      'BOOK-123',
      'TRACK-123',
      'CON-123',
      '2 boxes',
      'Household items',
      'Sender Adom',
      'Main Ama',
      'Second Kofi',
      '0201111111 / 0202222222',
      '0241111111 / 0242222222',
      '0271111111 / 0272222222',
    ]) {
      expect(markup).toContain(text);
    }
  });

  test('keeps delivery address distinct from pickup location and shows rider, stage and money', () => {
    const markup = render();
    for (const text of [
      'Route &amp; Delivery',
      'With rider',
      'Rider Kwame',
      'Delivery address:',
      'House 12, Spintex',
      'Pickup location:',
      'Office shelf',
      'Kumasi',
      'Adum',
      'Accra',
      'GHS 15.00',
      'Paid:',
      'GHS 30.00',
      'To be paid:',
      'GHS 20.00',
      'Created:',
      'Received:',
    ]) {
      expect(markup).toContain(text);
    }
    expect(markup).toContain('View Details');
    expect(markup).toContain('Change Second Receiver');
  });

  test('handles missing contact/address/fee and invalid dates without inventing data', () => {
    const markup = render({
      ...parcel,
      secondReceiverName: null,
      secondReceiverPhone: null,
      secondReceiverPhone2: null,
      dropoffAddress: null,
      deliveryFeePsw: null,
      riderName: null,
      createdAt: 'invalid',
      receivedAt: null,
      status: ParcelStatus.ADDRESS_COLLECTED,
    });
    for (const text of [
      'Not added',
      'Not assigned',
      'Ready for dispatch',
      'Add Second Receiver',
      'Delivery address:</span> -',
      'Delivery fee:</span> -',
      'Created:</span> -',
      'Received:</span> -',
    ]) {
      expect(markup).toContain(text);
    }
    expect(markup).not.toContain('Invalid Date');
    expect(render({ ...parcel, deliveryFeePsw: 0 })).toContain('GHS 0.00');
  });

  test('keeps long descriptions and addresses complete and phone fallbacks readable', () => {
    const longText = 'UnbrokenDescription'.repeat(30);
    const markup = render({
      ...parcel,
      parcelContent: longText,
      dropoffAddress: longText,
      senderPhone: null,
      senderPhone2: '0202222222',
    });
    expect(markup.split(longText)).toHaveLength(3);
    expect(markup).toContain('whitespace-normal break-words');
    expect(markup).toContain('Tel:</span> 0202222222');
  });

  test('hides second-receiver editing without permission', () => {
    const markup = render(parcel, false);
    expect(markup).not.toContain('Change Second Receiver');
    expect(markup).toContain('View Details');
  });

  test('shows the configured delivery fee separately from the remaining delivery fee', () => {
    const markup = render({ ...parcel, outstandingDeliveryFeePsw: 500 });
    expect(markup).toContain('Delivery fee:</span> GHS 15.00');
    expect(markup).toContain('Delivery fee to collect:</span> GHS 5.00');
    expect(markup).toContain('To be paid:</span> GHS 20.00');
    expect(render({ ...parcel, outstandingDeliveryFeePsw: 0 })).toContain(
      'Delivery fee to collect:</span> GHS 0.00',
    );
  });
});
