import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { DataTable } from '@/components/datatable';
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { isLocationColumn } from '@/lib/location-display';
import type { ParcelSearchRow } from '@/features/operations/parcel/api/parcel.api';
import { useWaitingPickupColumns } from '@/features/operations/parcel/components/parcel-waiting-pickup/use-waiting-pickup-columns';
import { useParcelReceiverCashierColumns } from '@/features/operations/parcel/components/parcel-receiver-cashier/use-parcel-receiver-cashier-columns';
import { useShelfPickerUpdateColumns } from '@/features/operations/parcel/components/parcel-shelf-picker-update/use-shelf-picker-update-columns';
import { ParcelStatus } from '@/db/schemas/enums';

const parcel = {
  id: 'parcel',
  bookingCode: 'TA9532316J',
  receiverName: 'Receiver Name',
  receiverPhone: '0240000001',
  receiverPhone2: '0240000002',
  senderName: 'Sender Name',
  senderPhone: '0500000001',
  senderPhone2: '0500000002',
  sourceName: 'Accra',
  sourceLocationName: 'Circle',
  destinationName: 'Kumasi',
  pickupLocationName: 'Mbrom VIP Bus Station Behind the Goil Filling Station',
  parcelDetails: '1 POLY',
  parcelContent: 'DRESS, coffee mate, Nescafe, Milo, cups and lids. '.repeat(8),
  status: ParcelStatus.AWAITING_PICKUP,
  chargePsw: 5000,
  plannedToBePaidPsw: 5000,
  createdAt: '2026-08-21T14:06:00Z',
  receivedAt: '2026-10-13T05:39:00Z',
  storageChargePsw: 0,
} as ParcelSearchRow;
const noop = () => {};
const requestDelivery = async () => {};

function PickupTable({ cashier }: { cashier: boolean }) {
  const common = {
    page: 1,
    pageSize: 20,
    isPickupQueueEnabled: false,
    isSaving: false,
    onEdit: noop,
    onRequestDelivery: requestDelivery,
  };
  const pickup = useWaitingPickupColumns({ ...common, onOpen: noop });
  const receiver = useParcelReceiverCashierColumns({
    ...common,
    onOpenParcelDialog: noop,
    onReprintReceipt: noop,
  });
  return (
    <DataTable
      mode="client"
      data={[parcel]}
      columns={cashier ? receiver : pickup}
      showSearch={false}
    />
  );
}

function ShelfTable() {
  const columns = useShelfPickerUpdateColumns({
    onOpenUpdateDialog: noop,
    onEdit: noop,
    onEditSecondReceiver: noop,
    canManageSecondReceiver: false,
    onRequestDelivery: requestDelivery,
    isRequestingDelivery: false,
    canRequestDelivery: false,
  });
  return (
    <DataTable
      mode="client"
      data={[{ ...parcel, pickerStaffName: 'Picker Name', pickerStaffId: 'picker' }]}
      columns={columns}
      showSearch={false}
    />
  );
}

describe('compact parcel tables and location wrapping', () => {
  test.each([false, true])(
    'pickup/cashier customer and route columns preserve every displayed value: cashier=%s',
    (cashier) => {
      const html = renderToStaticMarkup(<PickupTable cashier={cashier} />);
      expect(html).toContain('>Customer<');
      expect(html).toContain('>Route<');
      expect(html).not.toContain('>Sender<');
      expect(html).not.toContain('>Receiver<');
      expect(html).not.toContain('>Source<');
      expect(html).not.toContain('>Destination<');
      expect(html.indexOf('Receiver Name')).toBeLessThan(html.indexOf('Sender Name'));
      expect(html).toContain('0240000001 / 0240000002');
      expect(html).toContain('0500000001 / 0500000002');
      expect(html.indexOf('Accra')).toBeLessThan(html.indexOf('Circle'));
      expect(html.indexOf('Circle')).toBeLessThan(html.indexOf('Kumasi'));
      expect(html).toContain(parcel.pickupLocationName!);
      expect(html).toContain(parcel.parcelContent!);
      expect(html).toContain('overflow-wrap:anywhere');
    },
  );
  test('shelf picker stacks parcel details/content and status/picker', () => {
    const html = renderToStaticMarkup(<ShelfTable />);
    expect(html).toContain('>Parcel<');
    expect(html).toContain('Status / Shelf Picker');
    expect(html).not.toContain('>Details<');
    expect(html).not.toContain('>Content<');
    expect(html.indexOf('1 POLY')).toBeLessThan(html.indexOf(parcel.parcelContent!));
    expect(html).toContain(parcel.parcelContent!);
    expect(html.indexOf('Awaiting Pickup')).toBeLessThan(html.indexOf('Picker Name'));
  });
  test.each(['locationName', 'pickupLocation', 'route', 'fromLocation', 'workplace'])(
    'shared table identifies location columns: %s',
    (id) => {
      expect(isLocationColumn(id, undefined)).toBe(true);
    },
  );
  test('native tables mark location headers and preserve ordinary columns', () => {
    const html = renderToStaticMarkup(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Location</TableHead>
            <TableHead>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>{parcel.pickupLocationName}</TableCell>
            <TableCell>50.00</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(html).toContain('data-location-column="true"');
    expect(html.match(/data-location-column/g)).toHaveLength(1);
    expect(isLocationColumn('allocationStatus', 'Allocation')).toBe(false);
    expect(isLocationColumn('amount', 'Amount')).toBe(false);
  });
});
