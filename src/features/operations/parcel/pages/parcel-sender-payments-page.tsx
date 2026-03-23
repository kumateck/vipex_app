import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { DataTable } from '@/components/datatable';
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
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useGetLocationQuery } from '@/features/locations/api/locations.api';
import {
  type SenderCashierParcel,
  useCollectSenderAndProcessMutation,
  useListSenderCashierParcelsQuery,
} from '../api/parcel.api';
import { ParcelInternalHolderBadge } from '../components/parcel-internal-holder-badge';
import { ParcelReceiptActions, type ReceiptPrintData } from '../components/parcel-receipt-actions';
import { ParcelSessionGuard } from '../components/parcel-session-guard';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

const PAYMENT_METHOD_OPTIONS = [
  { value: PaymentMethod.CASH, label: 'Cash' },
  { value: PaymentMethod.MTN, label: 'MTN' },
  { value: PaymentMethod.TELECEL, label: 'Telecel' },
  { value: PaymentMethod.AIRTEL, label: 'Airtel' },
];

const formatCurrency = (amountPsw: number) => `GHS ${(amountPsw / 100).toFixed(2)}`;

function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function getSenderDuePsw(parcel: SenderCashierParcel) {
  return Math.max(parcel.chargePsw - (parcel.plannedToBePaidPsw ?? 0), 0);
}

export function ParcelSenderPaymentsPage() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;

  const [query, setQuery] = useState<
    ServerListQuery<{ companyId?: string | null; sourceId?: string | null; status?: number | null }>
  >({
    page: 1,
    pageSize: 20,
    filters: {
      companyId,
      sourceId: branchId,
      status: ParcelStatus.CREATED,
    },
  });

  const [selectedParcel, setSelectedParcel] = useState<SenderCashierParcel | null>(null);
  const [lastPrintedReceipt, setLastPrintedReceipt] = useState<ReceiptPrintData | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>(String(PaymentMethod.CASH));
  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: pickupLocation } = useGetLocationQuery(selectedParcel?.pickupLocationId ?? '', {
    skip: !selectedParcel?.pickupLocationId,
  });

  useEffect(() => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      filters: {
        companyId,
        sourceId: branchId,
        status: ParcelStatus.CREATED,
      },
    }));
  }, [branchId, companyId]);

  const { data, isLoading, refetch } = useListSenderCashierParcelsQuery(query, {
    skip: !companyId || !branchId,
  });
  const [collectSenderAndProcess, { isLoading: isCollecting }] =
    useCollectSenderAndProcessMutation();

  const columns = useMemo<ColumnDef<SenderCashierParcel>[]>(
    () => [
      { accessorKey: 'trackingCode', header: 'Tracking' },
      { accessorKey: 'bookingCode', header: 'Booking' },
      {
        id: 'sender',
        header: 'Sender',
        accessorFn: (row) =>
          `${row.senderName ?? '-'}${row.senderPhone ? ` (${row.senderPhone})` : ''}`,
      },
      {
        id: 'receiver',
        header: 'Receiver',
        accessorFn: (row) =>
          `${row.receiverName ?? '-'}${row.receiverPhone ? ` (${row.receiverPhone})` : ''}`,
      },
      {
        id: 'charge',
        header: 'Charge',
        accessorFn: (row) => formatCurrency(row.chargePsw),
      },
      {
        id: 'createdAtLabel',
        header: 'Created At',
        accessorFn: (row) => formatDate(row.createdAt),
      },
      {
        id: 'holder',
        header: 'Current Holder',
        cell: ({ row }) => <ParcelInternalHolderBadge holder={row.original} />,
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            size="sm"
            onClick={() => {
              const parcel = row.original;
              setSelectedParcel(parcel);
              setAmount((getSenderDuePsw(parcel) / 100).toFixed(2));
              setPaymentMethod(String(PaymentMethod.CASH));
            }}
          >
            {getSenderDuePsw(row.original) > 0 ? 'Collect Payment' : 'Print Receipts'}
          </Button>
        ),
      },
    ],
    [],
  );

  const handleCollectPayment = async () => {
    if (!selectedParcel) return;

    const senderDueCedis = getSenderDuePsw(selectedParcel) / 100;
    const amountValue = Number(amount);
    const totalCharge = selectedParcel.chargePsw / 100;
    const receiverToPayCedis = Math.max(totalCharge - senderDueCedis, 0);

    let payment:
      | {
          amounts: {
            vatCedis: number;
            getfundCedis: number;
            nhilCedis: number;
            covidCedis: number;
            taxTotalCedis: number;
          };
        }
      | undefined;

    try {
      if (senderDueCedis > 0) {
        if (Number.isNaN(amountValue) || amountValue <= 0) {
          toast.error('Enter a valid payment amount');
          return;
        }
        if (Math.abs(amountValue - senderDueCedis) > 0.00001) {
          toast.error(
            `Sender cashier can only collect GHS ${senderDueCedis.toFixed(2)} for this parcel`,
          );
          return;
        }

        const result = await collectSenderAndProcess({
          parcelId: selectedParcel.id,
          amountCedis: amountValue,
          method: Number(paymentMethod),
        }).unwrap();
        payment = result.payment ?? undefined;
      } else {
        await collectSenderAndProcess({
          parcelId: selectedParcel.id,
          amountCedis: null,
          method: Number(paymentMethod),
        }).unwrap();
      }

      const destinationBranchName =
        branchOptions.find((branch) => branch.id === selectedParcel.destinationId)?.name ??
        selectedParcel.destinationId;
      const destinationLocationName =
        pickupLocation?.name ?? selectedParcel.pickupLocationId ?? '-';
      setLastPrintedReceipt({
        bookingCode: selectedParcel.bookingCode,
        trackingCode: selectedParcel.trackingCode,
        parcelDetails: selectedParcel.parcelDetails,
        senderName: selectedParcel.senderName ?? '-',
        senderTelephone: selectedParcel.senderPhone ?? '-',
        receiverName: selectedParcel.receiverName ?? '-',
        receiverTelephone: selectedParcel.receiverPhone ?? '-',
        destinationBranchName,
        destinationLocationName,
        totalChargeCedis: totalCharge,
        senderPaidCedis: senderDueCedis > 0 ? amountValue : 0,
        receiverToPayCedis,
        issuedAt: new Date().toISOString(),
        taxBreakdown: payment
          ? {
              vatCedis: payment.amounts.vatCedis,
              getfundCedis: payment.amounts.getfundCedis,
              nhilCedis: payment.amounts.nhilCedis,
              covidCedis: payment.amounts.covidCedis,
              taxTotalCedis: payment.amounts.taxTotalCedis,
            }
          : undefined,
      });

      toast.success(
        senderDueCedis > 0 ? 'Payment collected successfully' : 'Receipts generated successfully',
      );
      setSelectedParcel(null);
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to process parcel');
    }
  };

  const isSubmitting = isCollecting;

  return (
    <div className="w-full p-4 space-y-4">
      <ParcelSessionGuard>
        <Card>
          <CardHeader>
            <CardTitle>Sender Cashier Payments</CardTitle>
            <CardDescription>
              Parcels created at your branch and ready for sender payment collection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              mode="server"
              data={data?.data ?? []}
              columns={columns}
              meta={data?.meta ?? EMPTY_META}
              loading={isLoading}
              serverFilters={{ companyId, sourceId: branchId, status: ParcelStatus.CREATED }}
              onRequestChange={setQuery}
              searchPlaceholder="Search by tracking, booking, sender or receiver"
              enableVirtualization={false}
            />
          </CardContent>
        </Card>

        <Dialog
          open={Boolean(selectedParcel)}
          onOpenChange={(open) => (!open ? setSelectedParcel(null) : null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Collect Sender Payment</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tracking</p>
                <p className="font-medium">{selectedParcel?.trackingCode ?? '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Current Holder</p>
                <div>
                  <ParcelInternalHolderBadge holder={selectedParcel} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Expected Charge</p>
                <p className="font-medium">
                  {selectedParcel ? formatCurrency(selectedParcel.chargePsw) : '-'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Sender Should Pay</p>
                <p className="font-medium">
                  {selectedParcel ? formatCurrency(getSenderDuePsw(selectedParcel)) : '-'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sender-payment-amount">Amount (GHS)</Label>
                <Input
                  id="sender-payment-amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                  disabled={selectedParcel ? getSenderDuePsw(selectedParcel) <= 0 : false}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sender-payment-method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger
                    id="sender-payment-method"
                    disabled={selectedParcel ? getSenderDuePsw(selectedParcel) <= 0 : false}
                  >
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHOD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setSelectedParcel(null)}>
                Cancel
              </Button>
              <Button onClick={handleCollectPayment} disabled={isSubmitting}>
                {isSubmitting
                  ? 'Processing...'
                  : selectedParcel && getSenderDuePsw(selectedParcel) > 0
                    ? 'Collect Payment'
                    : 'Print Receipts'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {lastPrintedReceipt ? (
          <ParcelReceiptActions
            data={lastPrintedReceipt}
            autoPrint
            onAutoPrintComplete={() => setLastPrintedReceipt(null)}
          />
        ) : null}
      </ParcelSessionGuard>
    </div>
  );
}
