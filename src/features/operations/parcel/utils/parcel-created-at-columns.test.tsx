import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ColumnDef } from '@tanstack/react-table';
import type { ParcelSearchRow } from '../api/parcel.api';
import { useCallCenterAssignmentColumns } from '../components/parcel-call-center-assignment/use-call-center-assignment-columns';
import { useParcelReceiverCashierColumns } from '../components/parcel-receiver-cashier/use-parcel-receiver-cashier-columns';
import { useShelfPickerUpdateColumns } from '../components/parcel-shelf-picker-update/use-shelf-picker-update-columns';
import { useWaitingPickupColumns } from '../components/parcel-waiting-pickup/use-waiting-pickup-columns';
import type { ParcelRow } from '../components/parcel-shelf-picker-update/shelf-picker-update-types';

const shelfPickerOptions = {
  onOpenUpdateDialog: () => {},
  onEdit: () => {},
  onEditSecondReceiver: () => {},
  canManageSecondReceiver: false,
  onRequestDelivery: async () => {},
  isRequestingDelivery: false,
  canRequestDelivery: false,
};

test('all four parcel operation tables keep one combined date column', () => {
  const assignmentColumns = useCallCenterAssignmentColumns({
    onOpenAssignDialog: () => {},
    onEditSecondReceiver: () => {},
    canManageSecondReceiver: false,
    selectedParcelIds: new Set(),
    onToggleParcel: () => {},
    rows: [],
    onToggleAll: () => {},
  });
  const shelfPickerColumns = useShelfPickerUpdateColumns({
    ...shelfPickerOptions,
    isPickupQueueEnabled: false,
  });

  let waitingColumns: ColumnDef<ParcelSearchRow>[] = [];
  let cashierColumns: ColumnDef<ParcelSearchRow>[] = [];
  function DateColumnsProbe() {
    waitingColumns = useWaitingPickupColumns({
      page: 1,
      pageSize: 20,
      isPickupQueueEnabled: false,
      isSaving: false,
      onOpen: () => {},
      onEdit: () => {},
      onRequestDelivery: async () => {},
    });
    cashierColumns = useParcelReceiverCashierColumns({
      page: 1,
      pageSize: 20,
      isPickupQueueEnabled: false,
      isSaving: false,
      onOpenParcelDialog: () => {},
      onReprintReceipt: () => {},
      onEdit: () => {},
      onRequestDelivery: () => {},
    });
    return null;
  }
  renderToStaticMarkup(<DateColumnsProbe />);

  for (const columns of [assignmentColumns, shelfPickerColumns, waitingColumns, cashierColumns]) {
    const dateColumn = columns.find(
      (column) =>
        column.id === 'receivedAt' ||
        ('accessorKey' in column && column.accessorKey === 'receivedAt'),
    );
    expect(dateColumn?.header).toBe('Dates');
    expect(
      columns.some((column) => 'accessorKey' in column && column.accessorKey === 'createdAt'),
    ).toBe(false);
  }
});

test('Shelf Picker Update shows a queue number column only with branch queues enabled', () => {
  const getColumn = (isPickupQueueEnabled: boolean) =>
    useShelfPickerUpdateColumns({ ...shelfPickerOptions, isPickupQueueEnabled }).find(
      (column) => column.id === 'pickupQueueNumber',
    );

  expect(getColumn(false)).toBeUndefined();
  const column = getColumn(true);
  expect(column?.header).toBe('Queue Number');
  if (!column || !('accessorFn' in column)) throw new Error('Missing queue number accessor');
  expect(column.accessorFn({ pickupQueueNumber: 47 } as ParcelRow, 0)).toBe(47);
  expect(column.accessorFn({ pickupQueueNumber: null } as ParcelRow, 0)).toBe('—');
});
