import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/datatable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { type RiderDoorstepRecord, useListRiderDoorstepParcelsQuery } from '../api/parcel.api';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function ParcelRiderHistoryPage() {
  const riderUserId = useAuthStore((state) => state.user?.id ?? '');
  const { data } = useListRiderDoorstepParcelsQuery(
    { riderUserId, mode: 'history' },
    { skip: !riderUserId },
  );

  const columns = useMemo<ColumnDef<RiderDoorstepRecord>[]>(
    () => [
      { accessorKey: 'bookingCode', header: 'Booking' },
      { accessorKey: 'parcelDetails', header: 'Parcel Details' },
      {
        id: 'receiver',
        header: 'Receiver',
        accessorFn: (row) =>
          `${row.receiverName ?? '-'}${row.receiverPhone ? ` (${row.receiverPhone})` : ''}`,
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => row.parcelStatus,
      },
      {
        id: 'deliveryFee',
        header: 'Delivery Fee',
        accessorFn: (row) => `GHS ${(row.deliveryFeePsw / 100).toFixed(2)}`,
      },
    ],
    [],
  );

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <Card>
          <CardHeader>
            <CardTitle>Rider Delivery History</CardTitle>
            <CardDescription>Successful handovers and finalized home deliveries.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              mode="client"
              data={data?.rows ?? []}
              columns={columns}
              loading={false}
              enableVirtualization={false}
            />
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
