import { describe, expect, test } from 'bun:test';
import type { CellContext, ColumnDef } from '@tanstack/react-table';
import { renderToStaticMarkup } from 'react-dom/server';
import { ParcelStatus } from '@/db/schemas/enums';
import type { ParcelRow } from './call-center-assignment-types';
import { useCallCenterAssignmentColumns } from './use-call-center-assignment-columns';

const parcel = {
  id: 'parcel-1',
  bookingCode: 'AO6213682P',
  trackingCode: 'TRACK-1',
  senderName: 'Adom Nathaniel',
  senderPhone: '0241289744',
  senderPhone2: null,
  receiverName: 'Adu Evans',
  receiverPhone: '0246999605',
  receiverPhone2: null,
  secondReceiverName: 'Ama Owusu',
  secondReceiverPhone: '0248111128',
  parcelDetails: '1 M/BB',
  parcelContent: 'Clothes',
  status: ParcelStatus.AWAITING_PICKUP,
  chargePsw: 0,
  plannedToBePaidPsw: 0,
  callCenterAssignedToUserId: null,
  callCenterAssignedToUserName: null,
  createdAt: '2026-10-01T00:00:00Z',
  receivedAt: null,
} satisfies ParcelRow;

function renderCell(columns: ColumnDef<ParcelRow>[], key: string, row: ParcelRow) {
  const column = columns.find(
    (item) => item.id === key || ('accessorKey' in item && item.accessorKey === key),
  );
  const cell = column?.cell;
  if (typeof cell !== 'function') throw new Error(`No cell for ${key}`);
  return renderToStaticMarkup(
    <>{cell({ row: { original: row } } as unknown as CellContext<ParcelRow, unknown>)}</>,
  );
}

const columns = useCallCenterAssignmentColumns({
  onOpenAssignDialog: () => {},
  onEditSecondReceiver: () => {},
  selectedParcelIds: new Set(),
  onToggleParcel: () => {},
  rows: [parcel],
  onToggleAll: () => {},
});

describe('parcel assignment columns', () => {
  test('shows parcel content and the current second receiver', () => {
    expect(renderCell(columns, 'parcelContent', parcel)).toContain('Clothes');
    const receiver = renderCell(columns, 'receiverName', parcel);
    expect(receiver).toContain('2nd: Ama Owusu');
    expect(receiver).toContain('0248111128');
  });

  test('offers the second receiver action only before handover', () => {
    expect(renderCell(columns, 'actions', parcel)).toContain('Change 2nd Receiver');
    expect(
      renderCell(columns, 'actions', {
        ...parcel,
        secondReceiverName: null,
        secondReceiverPhone: null,
      }),
    ).toContain('Add 2nd Receiver');
    expect(
      renderCell(columns, 'actions', { ...parcel, status: ParcelStatus.DISPATCHED }),
    ).not.toContain('2nd Receiver');
  });
});
