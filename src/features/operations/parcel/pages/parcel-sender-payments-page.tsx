import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { EllipsisVertical } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import {
  ParcelReconciliationActionType,
  ParcelReconciliationCaseType,
  ParcelStatus,
  PaymentMethod,
} from '@/db/schemas/enums';
import type { PaginationMeta } from '@/server/types/pagination.types';
import type { ServerListQuery } from '@/services/rtk-query';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useGetLocationQuery } from '@/features/locations/api/locations.api';
import { useUploadImageMutation } from '@/features/uploads/api/uploads.api';
import { FileUploadField } from '@/features/uploads/components/file-upload-field';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime } from '@/lib/date';
import {
  type SenderCashierParcel,
  useCollectSenderAndProcessMutation,
  useListSenderCashierParcelsQuery,
  useRequestParcelReconciliationCaseMutation,
  useSoftDeleteParcelMutation,
} from '../api/parcel.api';
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

const PAYMENT_TYPE_LEGEND = [
  { label: 'Sender Pay', dotClassName: 'bg-emerald-500' },
  { label: 'Receiver Pay', dotClassName: 'bg-amber-500' },
  { label: 'Partial Pay', dotClassName: 'bg-sky-500' },
];

const RECON_CASE_TYPE_OPTIONS = [
  { value: ParcelReconciliationCaseType.SHORTAGE, label: 'Shortage' },
  { value: ParcelReconciliationCaseType.OVERAGE, label: 'Overage' },
  { value: ParcelReconciliationCaseType.WRONG_AMOUNT, label: 'Wrong Amount' },
  { value: ParcelReconciliationCaseType.WRONG_PARCEL_TYPE, label: 'Wrong Parcel Type' },
  { value: ParcelReconciliationCaseType.DUPLICATE_ENTRY, label: 'Double Entry' },
  {
    value: ParcelReconciliationCaseType.CUSTOMER_CANCELLATION_BEFORE_DELIVERY,
    label: 'Customer Cancellation Before Delivery',
  },
  { value: ParcelReconciliationCaseType.DATA_ENTRY_ERROR, label: 'Data Entry Error' },
];

const RECON_ACTION_OPTIONS = [
  { value: ParcelReconciliationActionType.VOID_AND_REFUND, label: 'Void and Refund' },
  { value: ParcelReconciliationActionType.VOID_AND_REBOOK, label: 'Void and Rebook' },
  { value: ParcelReconciliationActionType.VOID_TO_SUSPENSE, label: 'Void to Suspense' },
  {
    value: ParcelReconciliationActionType.KEEP_ORIGINAL_VOID_DUPLICATE,
    label: 'Keep Original, Void Duplicate',
  },
  { value: ParcelReconciliationActionType.MERGE_TO_SINGLE, label: 'Merge to Single Record' },
];

const formatCurrency = (amountPsw: number) => `GHS ${(amountPsw / 100).toFixed(2)}`;

function formatPhones(primary?: string | null, secondary?: string | null) {
  const phones = [primary, secondary].filter((value): value is string => Boolean(value?.trim()));
  return phones.length ? phones.join(', ') : '-';
}

function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '-';
  return formatDateTime(date);
}

function getSenderDuePsw(parcel: SenderCashierParcel) {
  return Math.max(parcel.chargePsw - (parcel.plannedToBePaidPsw ?? 0), 0);
}

function getPaymentType(parcel: SenderCashierParcel) {
  const charge = Number(parcel.chargePsw ?? 0);
  const receiverDue = Math.max(Number(parcel.plannedToBePaidPsw ?? 0), 0);

  if (receiverDue <= 0) {
    return { dotClassName: 'bg-emerald-500' };
  }

  if (receiverDue >= charge) {
    return { dotClassName: 'bg-amber-500' };
  }

  return { dotClassName: 'bg-sky-500' };
}

async function toDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Failed reading file: ${file.name}`));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  });
}

export function ParcelSenderPaymentsPage() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;
  const canDeleteParcel = (user?.permissions ?? []).includes(
    PermissionKeys.CanSoftDeleteParcelsAndPayments,
  );
  const canRequestReconciliation = (user?.permissions ?? []).includes(
    PermissionKeys.CanRequestParcelReconciliation,
  );

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
  const [deleteTargetParcel, setDeleteTargetParcel] = useState<SenderCashierParcel | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [reconTargetParcel, setReconTargetParcel] = useState<SenderCashierParcel | null>(null);
  const [reconCaseType, setReconCaseType] = useState<number>(ParcelReconciliationCaseType.SHORTAGE);
  const [reconActionType, setReconActionType] = useState<number>(
    ParcelReconciliationActionType.VOID_AND_REFUND,
  );
  const [reconLinkedParcelId, setReconLinkedParcelId] = useState('');
  const [reconEvidenceUrl, setReconEvidenceUrl] = useState('');
  const [reconEvidenceFiles, setReconEvidenceFiles] = useState<File[]>([]);
  const [reconNotes, setReconNotes] = useState('');
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
  const [softDeleteParcel, { isLoading: isDeletingParcel }] = useSoftDeleteParcelMutation();
  const [requestReconciliationCase, { isLoading: isRequestingReconciliation }] =
    useRequestParcelReconciliationCaseMutation();
  const [uploadImage, { isLoading: isUploadingEvidence }] = useUploadImageMutation();

  const columns = useMemo<ColumnDef<SenderCashierParcel>[]>(
    () => [
      {
        accessorKey: 'bookingCode',
        header: 'Booking',
        cell: ({ row }) => {
          const paymentType = getPaymentType(row.original);
          return (
            <div className="inline-flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${paymentType.dotClassName}`} />
              <span>{row.original.bookingCode}</span>
            </div>
          );
        },
      },
      {
        id: 'sender',
        header: 'Sender',
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="font-medium">{row.original.senderName ?? '-'}</p>
            <p className="text-muted-foreground text-xs">
              {formatPhones(row.original.senderPhone, row.original.senderPhone2)}
            </p>
          </div>
        ),
      },
      {
        id: 'receiver',
        header: 'Receiver',
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="font-medium">{row.original.receiverName ?? '-'}</p>
            <p className="text-muted-foreground text-xs">
              {formatPhones(row.original.receiverPhone, row.original.receiverPhone2)}
            </p>
          </div>
        ),
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
        id: 'destination',
        header: 'Destination',
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="font-medium">
              {row.original.pickupLocationName ?? row.original.pickupLocationId ?? '-'}
            </p>
            <p className="text-muted-foreground text-xs">
              {row.original.destinationName ?? row.original.destinationId}
            </p>
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" className="h-8 w-8">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  const parcel = row.original;
                  setSelectedParcel(parcel);
                  setAmount((getSenderDuePsw(parcel) / 100).toFixed(2));
                  setPaymentMethod(String(PaymentMethod.CASH));
                }}
              >
                {getSenderDuePsw(row.original) > 0 ? 'Collect Payment' : 'Print Receipts'}
              </DropdownMenuItem>
              {canDeleteParcel ? (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    setDeleteTargetParcel(row.original);
                    setDeleteReason('');
                  }}
                >
                  Delete Parcel
                </DropdownMenuItem>
              ) : null}
              {canRequestReconciliation ? (
                <DropdownMenuItem
                  onClick={() => {
                    setReconTargetParcel(row.original);
                    setReconCaseType(ParcelReconciliationCaseType.SHORTAGE);
                    setReconActionType(ParcelReconciliationActionType.VOID_AND_REFUND);
                    setReconLinkedParcelId('');
                    setReconEvidenceUrl('');
                    setReconEvidenceFiles([]);
                    setReconNotes('');
                  }}
                >
                  Open Reconciliation Case
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [canDeleteParcel, canRequestReconciliation],
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
        parcelContent: selectedParcel.parcelContent,
        parcelValueCedis: Number(selectedParcel.parcelValuePsw ?? 0) / 100,
        senderName: selectedParcel.senderName ?? '-',
        senderTelephone: formatPhones(selectedParcel.senderPhone, selectedParcel.senderPhone2),
        receiverName: selectedParcel.receiverName ?? '-',
        receiverTelephone: formatPhones(
          selectedParcel.receiverPhone,
          selectedParcel.receiverPhone2,
        ),
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

  const handleDeleteParcel = async () => {
    if (!deleteTargetParcel) return;
    const reason = deleteReason.trim();
    if (!reason) {
      toast.error('Deletion reason is required');
      return;
    }

    try {
      const result = await softDeleteParcel({ id: deleteTargetParcel.id, reason }).unwrap();
      toast.success(
        `Parcel deleted. Payments voided ${result.payments.totalVoided}/${result.payments.total}.`,
      );
      setDeleteTargetParcel(null);
      setDeleteReason('');
      if (selectedParcel?.id === deleteTargetParcel.id) {
        setSelectedParcel(null);
      }
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete parcel');
    }
  };

  const handleRequestReconciliation = async () => {
    if (!reconTargetParcel) return;
    const notes = reconNotes.trim();
    const linkedParcelId = reconLinkedParcelId.trim();
    if (!notes) {
      toast.error('Reconciliation note is required');
      return;
    }
    if (reconCaseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY && !linkedParcelId) {
      toast.error('Duplicate parcel ID is required for duplicate entry cases');
      return;
    }

    try {
      let uploadedEvidenceUrl = reconEvidenceUrl.trim() || null;
      if (reconEvidenceFiles[0]) {
        const upload = await uploadImage({
          modelType: 'parcel-reconciliation-evidence',
          modelId: reconTargetParcel.id,
          fileName: reconEvidenceFiles[0].name,
          dataUrl: await toDataUrl(reconEvidenceFiles[0]),
        }).unwrap();
        uploadedEvidenceUrl = upload.url;
      }

      await requestReconciliationCase({
        parcelId: reconTargetParcel.id,
        caseType: reconCaseType,
        actionType: reconActionType,
        linkedParcelId:
          reconCaseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY ? linkedParcelId : null,
        notes,
        evidenceUrl: uploadedEvidenceUrl,
      }).unwrap();
      toast.success('Reconciliation case created');
      setReconTargetParcel(null);
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create reconciliation case');
    }
  };

  return (
    <div className="w-full p-4 space-y-4">
      <ParcelSessionGuard>
        <ScrollableWrapper>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>Sender Cashier Payments</CardTitle>
                  <CardDescription>
                    Parcels created at your branch and ready for sender payment collection.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {PAYMENT_TYPE_LEGEND.map((item) => (
                    <div key={item.label} className="inline-flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.dotClassName}`} />
                      <span className="text-muted-foreground text-xs">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
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
        </ScrollableWrapper>

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
                <p className="text-sm text-muted-foreground">Destination</p>
                <div className="leading-tight">
                  <p className="font-medium">
                    {selectedParcel?.destinationName ?? selectedParcel?.destinationId ?? '-'}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {pickupLocation?.name ?? selectedParcel?.pickupLocationName ?? '-'}
                  </p>
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

        <Dialog
          open={Boolean(deleteTargetParcel)}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteTargetParcel(null);
              setDeleteReason('');
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Parcel (Soft Delete)</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Tracking: <strong>{deleteTargetParcel?.trackingCode ?? '-'}</strong>
              </p>
              <div className="space-y-2">
                <Label htmlFor="delete-parcel-reason">Reason</Label>
                <Textarea
                  id="delete-parcel-reason"
                  value={deleteReason}
                  onChange={(event) => setDeleteReason(event.target.value)}
                  placeholder="Why are you deleting this parcel?"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setDeleteTargetParcel(null);
                  setDeleteReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteParcel}
                disabled={isDeletingParcel}
              >
                {isDeletingParcel ? 'Deleting...' : 'Delete Parcel'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={Boolean(reconTargetParcel)}
          onOpenChange={(open) => {
            if (!open) {
              setReconTargetParcel(null);
              setReconLinkedParcelId('');
              setReconEvidenceUrl('');
              setReconEvidenceFiles([]);
              setReconNotes('');
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Open Parcel Reconciliation Case</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Tracking: <strong>{reconTargetParcel?.trackingCode ?? '-'}</strong>
              </p>
              <div className="space-y-2">
                <Label htmlFor="recon-case-type">Case Type</Label>
                <Select
                  value={String(reconCaseType)}
                  onValueChange={(value) => {
                    const nextCaseType = Number(value);
                    setReconCaseType(nextCaseType);
                    if (nextCaseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY) {
                      setReconActionType(
                        ParcelReconciliationActionType.KEEP_ORIGINAL_VOID_DUPLICATE,
                      );
                    } else if (
                      reconActionType ===
                        ParcelReconciliationActionType.KEEP_ORIGINAL_VOID_DUPLICATE ||
                      reconActionType === ParcelReconciliationActionType.MERGE_TO_SINGLE
                    ) {
                      setReconActionType(ParcelReconciliationActionType.VOID_AND_REFUND);
                    }
                  }}
                >
                  <SelectTrigger id="recon-case-type">
                    <SelectValue placeholder="Select case type" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECON_CASE_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recon-action-type">Proposed Action</Label>
                <Select
                  value={String(reconActionType)}
                  onValueChange={(value) => setReconActionType(Number(value))}
                >
                  <SelectTrigger id="recon-action-type">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECON_ACTION_OPTIONS.filter((option) =>
                      reconCaseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY
                        ? option.value ===
                            ParcelReconciliationActionType.KEEP_ORIGINAL_VOID_DUPLICATE ||
                          option.value === ParcelReconciliationActionType.MERGE_TO_SINGLE
                        : option.value !==
                            ParcelReconciliationActionType.KEEP_ORIGINAL_VOID_DUPLICATE &&
                          option.value !== ParcelReconciliationActionType.MERGE_TO_SINGLE,
                    ).map((option) => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {reconCaseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY ? (
                <div className="space-y-2">
                  <Label htmlFor="recon-linked-parcel">Duplicate Parcel ID</Label>
                  <Input
                    id="recon-linked-parcel"
                    value={reconLinkedParcelId}
                    onChange={(event) => setReconLinkedParcelId(event.target.value)}
                    placeholder="Paste duplicate parcel ID"
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <FileUploadField
                  id="recon-evidence-file"
                  label="Evidence (optional)"
                  files={reconEvidenceFiles}
                  onFilesChange={(files) => setReconEvidenceFiles(files.slice(0, 1))}
                  accept="image/*,.pdf,.doc,.docx"
                  maxFiles={1}
                  disabled={isUploadingEvidence}
                  title="Drag and drop evidence file, or click to choose"
                  helperText="Uploads one file and stores the resulting evidence URL."
                />
                <Input
                  id="recon-evidence-url"
                  value={reconEvidenceUrl}
                  onChange={(event) => setReconEvidenceUrl(event.target.value)}
                  placeholder="Or paste existing evidence URL"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recon-notes">Reason</Label>
                <Textarea
                  id="recon-notes"
                  value={reconNotes}
                  onChange={(event) => setReconNotes(event.target.value)}
                  rows={4}
                  placeholder="Explain the reconciliation issue"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReconTargetParcel(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleRequestReconciliation}
                disabled={isRequestingReconciliation || isUploadingEvidence}
              >
                {isRequestingReconciliation || isUploadingEvidence
                  ? 'Submitting...'
                  : 'Submit Case'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {lastPrintedReceipt ? (
          <ParcelReceiptActions
            data={lastPrintedReceipt}
            autoPrint
            mode="sender-payment"
            onAutoPrintComplete={() => setLastPrintedReceipt(null)}
          />
        ) : null}
      </ParcelSessionGuard>
    </div>
  );
}
