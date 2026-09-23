import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { useListUserOptionsQuery } from '@/features/users/api/users.api';
import { useAuthStore } from '@/stores/auth-store';
import { type RiderDoorstepRecord, useListRiderDoorstepParcelsQuery } from '../../api/parcel.api';
import { HomeDeliveryReceiptPrintController } from '../parcel-home-delivery-dispatch';
import { useRiderAssignedReceiptPrint } from './use-rider-assigned-receipt-print';

function formatCurrency(amountPsw: number | null | undefined) {
  return `GHS ${((amountPsw ?? 0) / 100).toFixed(2)}`;
}

export function ParcelHomeDeliveryRiderAssigned() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;
  const [selectedRiderUserId, setSelectedRiderUserId] = useState('');
  const [mode, setMode] = useState<'current' | 'history' | 'all'>('all');
  const { printData, isPrinting, onPrint, onComplete } = useRiderAssignedReceiptPrint();

  const { data: riderOptions = [] } = useListUserOptionsQuery(
    companyId && branchId ? { companyId, branchId, userType: 2 } : undefined,
    { skip: !companyId || !branchId },
  );

  const { data: currentData, isLoading: isLoadingCurrent } = useListRiderDoorstepParcelsQuery(
    { riderUserId: selectedRiderUserId, mode: 'current' },
    { skip: !selectedRiderUserId || mode === 'history' },
  );
  const { data: historyData, isLoading: isLoadingHistory } = useListRiderDoorstepParcelsQuery(
    { riderUserId: selectedRiderUserId, mode: 'history' },
    { skip: !selectedRiderUserId || mode === 'current' },
  );

  const rows = useMemo(() => {
    if (mode === 'current') return currentData?.rows ?? [];
    if (mode === 'history') return historyData?.rows ?? [];
    return [...(currentData?.rows ?? []), ...(historyData?.rows ?? [])];
  }, [currentData?.rows, historyData?.rows, mode]);

  const isLoading =
    mode === 'all'
      ? isLoadingCurrent || isLoadingHistory
      : mode === 'current'
        ? isLoadingCurrent
        : isLoadingHistory;

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
        id: 'toBePaid',
        header: 'To Be Paid',
        accessorFn: (row) => formatCurrency(row.outstandingPrincipalPsw ?? row.plannedToBePaidPsw),
      },
      {
        id: 'deliveryFee',
        header: 'Delivery Fee',
        accessorFn: (row) => formatCurrency(row.deliveryFeePsw),
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => row.deliveryStatus,
      },
      {
        id: 'action',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            disabled={isPrinting}
            onClick={() => void onPrint(row.original.parcelId)}
          >
            Print
          </Button>
        ),
      },
    ],
    [isPrinting, onPrint],
  );

  return (
    <div className="w-full p-4 space-y-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <CardTitle>Rider Assigned Parcels</CardTitle>
            <CardDescription>
              Select a rider to view assigned parcels (current, history, or all).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Select value={selectedRiderUserId} onValueChange={setSelectedRiderUserId}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Select rider" />
                </SelectTrigger>
                <SelectContent>
                  {riderOptions.map((rider) => (
                    <SelectItem key={rider.id} value={rider.id}>
                      {rider.fullname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={mode} onValueChange={(value) => setMode(value as typeof mode)}>
                <SelectTrigger className="w-full max-w-48">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="history">History</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DataTable
              mode="client"
              data={rows}
              columns={columns}
              loading={isLoading}
              showSearch={false}
              enableVirtualization={false}
            />
          </CardContent>
        </Card>
      </ScrollableWrapper>
      {printData ? (
        <HomeDeliveryReceiptPrintController
          key={printData.trackingCode}
          receipt={printData}
          onComplete={onComplete}
        />
      ) : null}
    </div>
  );
}
