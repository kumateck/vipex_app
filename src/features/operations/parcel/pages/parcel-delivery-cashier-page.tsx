import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { DataTable } from '@/components/datatable';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ParcelStatus, PaymentMethod } from '@/db/schemas/enums';
import type { PaginationMeta } from '@/server/types/pagination.types';
import type { ServerListQuery } from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';
import {
  type ParcelSearchRow,
  useFinalizeDoorstepAtOfficeMutation,
  useGetParcelDetailsQuery,
  useSearchParcelsQuery,
} from '../api/parcel.api';
import { ParcelSessionGuard } from '../components/parcel-session-guard';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

const formatMoney = (valuePsw: number) => `GHS ${(valuePsw / 100).toFixed(2)}`;

export function ParcelDeliveryCashierPage() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;
  const cashierUserId = user?.id ?? '';
  const [searchInput, setSearchInput] = useState('');
  const [selectedParcel, setSelectedParcel] = useState<ParcelSearchRow | null>(null);
  const [isFinalizeConfirmOpen, setIsFinalizeConfirmOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>(String(PaymentMethod.CASH));
  const [principalAmount, setPrincipalAmount] = useState('');
  const [deliveryFeeAmount, setDeliveryFeeAmount] = useState('');
  const [query, setQuery] = useState<
    ServerListQuery<{
      companyId?: string | null;
      destinationId?: string | null;
      status?: number | null;
    }>
  >({
    page: 1,
    pageSize: 20,
    filters: {
      companyId,
      destinationId: branchId,
      status: ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
    },
  });
  const listQuery = useSearchParcelsQuery(query, { skip: !companyId || !branchId });
  const { data: details } = useGetParcelDetailsQuery(selectedParcel?.id ?? '', {
    skip: !selectedParcel?.id,
  });
  const [finalizeAtOffice, { isLoading: isFinalizing }] = useFinalizeDoorstepAtOfficeMutation();

  useEffect(() => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      filters: {
        companyId,
        destinationId: branchId,
        status: ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
      },
    }));
  }, [companyId, branchId]);

  const outstanding = useMemo(() => {
    if (!details) return { principalPsw: 0, deliveryFeePsw: 0 };
    const principalPaid = details.payments
      .filter((payment) => payment.component === 0)
      .reduce((sum, payment) => sum + payment.grossAmountPsw, 0);
    const deliveryFeePaid = details.payments
      .filter((payment) => payment.component === 1)
      .reduce((sum, payment) => sum + payment.grossAmountPsw, 0);
    return {
      principalPsw: Math.max(details.parcel.plannedToBePaidPsw - principalPaid, 0),
      deliveryFeePsw: Math.max((details.delivery?.chargePsw ?? 0) - deliveryFeePaid, 0),
    };
  }, [details]);

  useEffect(() => {
    if (!selectedParcel) return;
    setPrincipalAmount((outstanding.principalPsw / 100).toFixed(2));
    setDeliveryFeeAmount((outstanding.deliveryFeePsw / 100).toFixed(2));
  }, [selectedParcel, outstanding]);

  const columns = useMemo<ColumnDef<ParcelSearchRow>[]>(
    () => [
      { accessorKey: 'trackingCode', header: 'Tracking' },
      { accessorKey: 'bookingCode', header: 'Booking' },
      {
        id: 'receiver',
        header: 'Receiver',
        accessorFn: (row) =>
          `${row.receiverName ?? '-'}${row.receiverPhone ? ` (${row.receiverPhone})` : ''}`,
      },
      {
        id: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <Button size="sm" onClick={() => setSelectedParcel(row.original)}>
            Finalize
          </Button>
        ),
      },
    ],
    [],
  );

  const onFinalize = async () => {
    if (!selectedParcel || !companyId || !branchId) return;
    try {
      await finalizeAtOffice({
        parcelId: selectedParcel.id,
        cashierUserId,
        branchId,
        companyId,
        principalAmountCedis: Number(principalAmount) > 0 ? principalAmount : null,
        deliveryFeeAmountCedis: Number(deliveryFeeAmount) > 0 ? deliveryFeeAmount : null,
        method: Number(paymentMethod),
      }).unwrap();
      toast.success('Delivery finalized and marked DELIVERED_AT_HOME');
      setIsFinalizeConfirmOpen(false);
      setSelectedParcel(null);
      await listQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to finalize');
    }
  };

  return (
    <div className="w-full p-4 space-y-4">
      <ParcelSessionGuard>
        <Card>
          <CardHeader>
            <CardTitle>Delivery Cashier Finalization</CardTitle>
            <CardDescription>
              Receive rider money for successful handovers and finalize to delivered at home.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const term = searchInput.trim();
                setQuery((prev) => ({ ...prev, page: 1, search: term.length ? term : undefined }));
              }}
            >
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by tracking, booking, receiver"
              />
              <Button type="submit">Search</Button>
            </form>
            <DataTable
              mode="server"
              data={listQuery.data?.data ?? []}
              columns={columns}
              meta={listQuery.data?.meta ?? EMPTY_META}
              loading={listQuery.isLoading}
              showSearch={false}
              serverFilters={{
                companyId,
                destinationId: branchId,
                status: ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
              }}
              onRequestChange={(next) =>
                setQuery((prev) => ({
                  ...prev,
                  ...next,
                  search: prev.search,
                  filters: {
                    companyId,
                    destinationId: branchId,
                    status: ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
                  },
                }))
              }
              enableVirtualization={false}
            />
          </CardContent>
        </Card>

        <Dialog
          open={Boolean(selectedParcel)}
          onOpenChange={(open) => {
            if (open) return;
            setIsFinalizeConfirmOpen(false);
            setSelectedParcel(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Finalize Rider Return</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm">
                <strong>Tracking:</strong> {selectedParcel?.trackingCode}
              </p>
              <p className="text-sm">
                <strong>Outstanding To Be Paid:</strong> {formatMoney(outstanding.principalPsw)}
              </p>
              <p className="text-sm">
                <strong>Outstanding Delivery Fee:</strong> {formatMoney(outstanding.deliveryFeePsw)}
              </p>
              <div className="space-y-2">
                <Label>Principal Received (GHS)</Label>
                <Input
                  inputMode="decimal"
                  value={principalAmount}
                  onChange={(event) => setPrincipalAmount(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Delivery Fee Received (GHS)</Label>
                <Input
                  inputMode="decimal"
                  value={deliveryFeeAmount}
                  onChange={(event) => setDeliveryFeeAmount(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={String(PaymentMethod.CASH)}>Cash</SelectItem>
                    <SelectItem value={String(PaymentMethod.MTN)}>MTN</SelectItem>
                    <SelectItem value={String(PaymentMethod.TELECEL)}>Telecel</SelectItem>
                    <SelectItem value={String(PaymentMethod.AIRTEL)}>Airtel</SelectItem>
                    <SelectItem value={String(PaymentMethod.CREDIT)}>Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedParcel(null)}>
                Cancel
              </Button>
              <Button onClick={() => setIsFinalizeConfirmOpen(true)} disabled={isFinalizing}>
                {isFinalizing ? 'Finalizing...' : 'Confirm Delivered At Home'}
              </Button>
            </DialogFooter>
            <AlertDialog open={isFinalizeConfirmOpen} onOpenChange={setIsFinalizeConfirmOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Finalize delivery?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark {selectedParcel?.trackingCode ?? 'this parcel'} as delivered at
                    home with the entered payment values.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isFinalizing}>Cancel</AlertDialogCancel>
                  <AlertDialogAction disabled={isFinalizing} onClick={() => void onFinalize()}>
                    {isFinalizing ? 'Finalizing...' : 'Finalize Delivery'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DialogContent>
        </Dialog>
      </ParcelSessionGuard>
    </div>
  );
}
