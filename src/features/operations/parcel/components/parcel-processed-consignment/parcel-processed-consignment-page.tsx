import { useCallback, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { formatDateTime } from '@/lib/dates';
import {
  isOptionalTenDigitPhone,
  isTenDigitPhone,
  normalizePhoneDigits,
  phoneLengthMessage,
} from '@/lib/phone';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { ParcelStatus } from '@/db/schemas/enums';
import type { PaginationMeta } from '@/server/types/pagination.types';
import type { ServerListQuery } from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useListLocationOptionsQuery } from '@/features/locations/api/locations.api';
import { useUpdateCustomerMutation } from '@/features/customers/api';
import { BranchType } from '@/db/schemas/enums';
import {
  type ProcessedParcel,
  useAddConsignmentItemsMutation,
  useCreateConsignmentMutation,
  useListProcessedParcelsForConsignmentQuery,
  useUpdateParcelMutation,
} from '../../api/parcel.api';
import { ParcelReceiptActions } from '../parcel-receipt-actions';
import type { ReceiptPrintData } from '../parcel-receipt.types';
import {
  ConsignmentPrintController,
  type ConsignmentPrintPayload,
} from './consignment-print-controller';
import { EditParcelDetailsDialog } from './edit-parcel-details-dialog';
import { ParcelReprintActions } from './parcel-reprint-actions';
import { PaymentStatusBookingCell } from './payment-status-booking-cell';
import { PaymentStatusLegend } from './payment-status-legend';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};
const ALL_VALUE = '__all__';
const EMPTY_ROWS: ProcessedParcel[] = [];

function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '-';
  return formatDateTime(date);
}

function formatPhones(primary?: string | null, secondary?: string | null) {
  const phones = [primary, secondary].filter((value): value is string => Boolean(value?.trim()));
  return phones.length ? phones.join(', ') : '-';
}

function getTodayDateOnlyLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toReceiptPrintData(
  parcel: ProcessedParcel,
  destinationBranchName: string,
): ReceiptPrintData {
  const totalChargeCedis = Number(parcel.chargePsw ?? 0) / 100;
  const receiverToPayCedis = Number(parcel.plannedToBePaidPsw ?? 0) / 100;
  const senderPaidCedis = Math.max(totalChargeCedis - receiverToPayCedis, 0);
  const amountPaidCedis = senderPaidCedis > 0 ? senderPaidCedis : receiverToPayCedis;

  return {
    bookingCode: parcel.bookingCode ?? '-',
    trackingCode: parcel.trackingCode ?? '-',
    parcelDetails: parcel.parcelDetails ?? '-',
    parcelContent: parcel.parcelContent ?? null,
    parcelValueCedis:
      parcel.parcelValuePsw === null || parcel.parcelValuePsw === undefined
        ? null
        : Number(parcel.parcelValuePsw) / 100,
    senderName: parcel.senderName ?? '-',
    senderTelephone: parcel.senderPhone ?? '-',
    senderTelephone2: parcel.senderPhone2 ?? null,
    receiverName: parcel.receiverName ?? '-',
    receiverTelephone: parcel.receiverPhone ?? '-',
    receiverTelephone2: parcel.receiverPhone2 ?? null,
    destinationBranchName,
    destinationLocationName: parcel.pickupLocationName ?? '-',
    totalChargeCedis,
    senderPaidCedis,
    receiverToPayCedis,
    amountPaidCedis,
    issuedAt: parcel.createdAt ?? new Date().toISOString(),
  };
}

export function ParcelProcessedConsignmentPage() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const userBranchId = user?.branch?.id ?? null;
  const userLocationId = user?.location?.id ?? user?.locationId ?? null;
  const isHeadOffice = user?.branch?.type === BranchType.HEADOFFICE;
  const userId = user?.id ?? null;
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>(ALL_VALUE);
  const [selectedDestinationFilter, setSelectedDestinationFilter] = useState<string>(ALL_VALUE);
  const [selectedDestinationLocationFilter, setSelectedDestinationLocationFilter] =
    useState<string>(ALL_VALUE);

  const appliedSourceId = isHeadOffice
    ? selectedBranchFilter !== ALL_VALUE
      ? selectedBranchFilter
      : null
    : userBranchId;
  const appliedDestinationId =
    selectedDestinationFilter !== ALL_VALUE ? selectedDestinationFilter : null;
  const appliedLocationId =
    appliedDestinationId && selectedDestinationLocationFilter !== ALL_VALUE
      ? selectedDestinationLocationFilter
      : null;
  const disallowedDestinationId = appliedSourceId ?? null;
  const serverFilters = useMemo(
    () => ({
      companyId,
      sourceId: appliedSourceId,
      destinationId: appliedDestinationId,
      locationId: appliedLocationId,
      status: ParcelStatus.PROCESSED,
    }),
    [appliedDestinationId, appliedLocationId, appliedSourceId, companyId],
  );

  const [query, setQuery] = useState<
    ServerListQuery<{
      companyId?: string | null;
      sourceId?: string | null;
      locationId?: string | null;
      destinationId?: string | null;
      status?: number | null;
    }>
  >({
    page: 1,
    pageSize: 20,
    filters: serverFilters,
  });
  const [hasLoaded, setHasLoaded] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lockedDestinationId, setLockedDestinationId] = useState<string | null>(null);
  const [editingParcel, setEditingParcel] = useState<ProcessedParcel | null>(null);
  const [reprintData, setReprintData] = useState<ReceiptPrintData | null>(null);
  const [reprintSelection, setReprintSelection] = useState<'sticker' | 'invoice'>('sticker');
  const [reprintStickerCopies, setReprintStickerCopies] = useState(1);
  const [consignmentPrintPayload, setConsignmentPrintPayload] =
    useState<ConsignmentPrintPayload | null>(null);
  const [editDestinationId, setEditDestinationId] = useState<string>('');
  const [editSourceLocationId, setEditSourceLocationId] = useState<string>('');
  const [editPickupLocationId, setEditPickupLocationId] = useState<string>('');
  const [editSenderPhone, setEditSenderPhone] = useState('');
  const [editSenderPhone2, setEditSenderPhone2] = useState('');
  const [editReceiverPhone, setEditReceiverPhone] = useState('');
  const [editReceiverPhone2, setEditReceiverPhone2] = useState('');

  const { data, isLoading, refetch } = useListProcessedParcelsForConsignmentQuery(query, {
    skip: !companyId || !hasLoaded,
  });
  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: locationOptions = [] } = useListLocationOptionsQuery(
    {
      companyId,
      branchId: appliedDestinationId,
    },
    { skip: !companyId || !appliedDestinationId },
  );
  const { data: editDestinationLocationOptions = [] } = useListLocationOptionsQuery(
    {
      companyId,
      branchId: editDestinationId || null,
    },
    { skip: !companyId || !editDestinationId },
  );
  const { data: sourceLocationOptions = [] } = useListLocationOptionsQuery(
    {
      companyId,
      branchId: appliedSourceId,
    },
    { skip: !companyId || !appliedSourceId },
  );
  const [createConsignment, { isLoading: isCreatingConsignment }] = useCreateConsignmentMutation();
  const [addConsignmentItems, { isLoading: isAddingItems }] = useAddConsignmentItemsMutation();
  const [updateParcel, { isLoading: isUpdatingParcel }] = useUpdateParcelMutation();
  const [updateCustomer, { isLoading: isUpdatingCustomer }] = useUpdateCustomerMutation();

  const branchNameById = useMemo(
    () => new Map(branchOptions.map((branch) => [branch.id, branch.name])),
    [branchOptions],
  );
  const agencyBranchOptions = useMemo(
    () => branchOptions.filter((branch) => branch.type !== BranchType.HEADOFFICE),
    [branchOptions],
  );
  const resetSelection = () => {
    setSelectedIds(new Set());
    setLockedDestinationId(null);
  };

  const rows = useMemo(() => data?.data ?? EMPTY_ROWS, [data?.data]);
  const queueReprint = useCallback(
    (parcel: ProcessedParcel, selection: 'sticker' | 'invoice', stickerCopies = 1) => {
      const destinationName =
        parcel.destinationName ?? branchNameById.get(parcel.destinationId) ?? '-';
      setReprintSelection(selection);
      setReprintStickerCopies(stickerCopies);
      setReprintData(toReceiptPrintData(parcel, destinationName));
    },
    [branchNameById],
  );

  const startEditingParcel = useCallback(
    (parcel: ProcessedParcel) => {
      setEditingParcel(parcel);
      setEditDestinationId(parcel.destinationId);
      setEditSourceLocationId(parcel.sourceLocationId ?? userLocationId ?? '');
      setEditPickupLocationId(parcel.pickupLocationId ?? '');
      setEditSenderPhone(parcel.senderPhone ?? '');
      setEditSenderPhone2(parcel.senderPhone2 ?? '');
      setEditReceiverPhone(parcel.receiverPhone ?? '');
      setEditReceiverPhone2(parcel.receiverPhone2 ?? '');
    },
    [userLocationId],
  );

  const loadData = () => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      filters: serverFilters,
    }));
    setHasLoaded(true);
    resetSelection();
  };

  const toggleRowSelection = useCallback(
    (parcel: ProcessedParcel, checked: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);

        if (!checked) {
          next.delete(parcel.id);
          if (next.size === 0) {
            setLockedDestinationId(null);
          }
          return next;
        }

        if (lockedDestinationId && lockedDestinationId !== parcel.destinationId) {
          toast.error('You cannot mix destination branches in a single consignment');
          return prev;
        }

        next.add(parcel.id);
        if (!lockedDestinationId) {
          setLockedDestinationId(parcel.destinationId);
        }

        return next;
      });
    },
    [lockedDestinationId],
  );

  const toggleSelectAllEligible = useCallback(
    (checked: boolean) => {
      if (rows.length === 0) return;

      const effectiveDestinationId = lockedDestinationId ?? rows[0]?.destinationId ?? null;
      if (!effectiveDestinationId) return;

      const eligibleRows = rows.filter((row) => row.destinationId === effectiveDestinationId);
      if (eligibleRows.length === 0) return;

      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (!checked) {
          for (const row of eligibleRows) {
            next.delete(row.id);
          }
          if (next.size === 0) {
            setLockedDestinationId(null);
          }
          return next;
        }

        for (const row of eligibleRows) {
          next.add(row.id);
        }
        setLockedDestinationId(effectiveDestinationId);
        return next;
      });
    },
    [lockedDestinationId, rows],
  );

  const eligibleDestinationId = lockedDestinationId ?? rows[0]?.destinationId ?? null;
  const eligibleRows = eligibleDestinationId
    ? rows.filter((row) => row.destinationId === eligibleDestinationId)
    : [];
  const selectedEligibleCount = eligibleRows.filter((row) => selectedIds.has(row.id)).length;
  const allEligibleSelected =
    eligibleRows.length > 0 && selectedEligibleCount === eligibleRows.length;
  const someEligibleSelected = selectedEligibleCount > 0 && !allEligibleSelected;

  const columns = useMemo<ColumnDef<ProcessedParcel>[]>(
    () => [
      {
        id: 'select',
        header: () => (
          <Checkbox
            checked={allEligibleSelected ? true : someEligibleSelected ? 'indeterminate' : false}
            onCheckedChange={(checked) => toggleSelectAllEligible(Boolean(checked))}
            aria-label="Select eligible rows"
            disabled={rows.length === 0}
          />
        ),
        enableSorting: false,
        cell: ({ row }) => {
          const parcel = row.original;
          const isChecked = selectedIds.has(parcel.id);
          const isDifferentDestination =
            lockedDestinationId !== null && lockedDestinationId !== parcel.destinationId;

          return (
            <Checkbox
              checked={isChecked}
              onCheckedChange={(checked) => toggleRowSelection(parcel, Boolean(checked))}
              aria-label={`Select parcel ${parcel.trackingCode}`}
              disabled={!isChecked && isDifferentDestination}
            />
          );
        },
      },

      {
        accessorKey: 'bookingCode',
        header: 'Booking',
        cell: ({ row }) => <PaymentStatusBookingCell parcel={row.original} />,
      },
      { accessorKey: 'parcelDetails', header: 'Parcel Details' },
      { accessorKey: 'parcelContent', header: 'Parcel Content' },
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
        id: 'destination',
        header: 'Destination',
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="font-medium">{row.original.pickupLocationName ?? '-'}</p>
            <p className="text-muted-foreground text-xs">
              {row.original.destinationName ??
                branchNameById.get(row.original.destinationId) ??
                '-'}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Processed At',
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <ParcelReprintActions
            parcel={row.original}
            onEdit={startEditingParcel}
            onReprintReceipt={(parcel) => queueReprint(parcel, 'invoice')}
            onReprintSticker={(parcel, copies) => queueReprint(parcel, 'sticker', copies)}
          />
        ),
      },
    ],
    [
      allEligibleSelected,
      someEligibleSelected,
      rows,
      selectedIds,
      lockedDestinationId,
      branchNameById,
      queueReprint,
      startEditingParcel,
      toggleRowSelection,
      toggleSelectAllEligible,
    ],
  );

  const handleCreateConsignment = async () => {
    if (!companyId || !userId) {
      toast.error('Authenticated company, branch, and user context are required');
      return;
    }

    const parcelIds = Array.from(selectedIds);
    const selectedParcels = rows.filter((row) => selectedIds.has(row.id));
    if (parcelIds.length === 0) {
      toast.error('Select at least one processed parcel');
      return;
    }

    if (!lockedDestinationId) {
      toast.error('Select parcels from one destination branch');
      return;
    }

    if (!appliedSourceId) {
      toast.error(
        isHeadOffice
          ? 'Select one agency branch before creating a consignment'
          : 'Authenticated branch context is required',
      );
      return;
    }
    if (lockedDestinationId === appliedSourceId) {
      toast.error('Consignment must be cross-agency. Source and destination cannot be the same.');
      return;
    }

    try {
      const created = await createConsignment({
        companyId,
        sourceId: appliedSourceId,
        destinationId: lockedDestinationId,
        consignmentDate: getTodayDateOnlyLocal(),
        createdBy: userId,
      }).unwrap();

      const added = await addConsignmentItems({
        consignmentId: created.id,
        parcelIds,
      }).unwrap();

      setConsignmentPrintPayload({
        consignmentCode: created.code,
        items: selectedParcels,
      });

      toast.success(`Consignment ${created.code} created with ${added.added} parcel(s)`);
      setSelectedIds(new Set());
      setLockedDestinationId(null);
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create consignment');
    }
  };

  const isSubmitting = isCreatingConsignment || isAddingItems;
  const isSavingEdit = isUpdatingParcel || isUpdatingCustomer;
  const lockedDestinationName = lockedDestinationId
    ? (branchNameById.get(lockedDestinationId) ?? '-')
    : null;

  const editLocationOptions = useMemo(() => {
    if (!editingParcel) return [];
    if (editDestinationLocationOptions.length) return editDestinationLocationOptions;
    if (editingParcel.pickupLocationId && editingParcel.pickupLocationName) {
      return [
        {
          id: editingParcel.pickupLocationId,
          name: editingParcel.pickupLocationName,
          branchId: editDestinationId || editingParcel.destinationId,
        },
      ];
    }
    return [];
  }, [editDestinationId, editDestinationLocationOptions, editingParcel]);

  const editDestinationOptions = useMemo(
    () =>
      agencyBranchOptions.filter(
        (branch) =>
          !appliedSourceId || branch.id !== appliedSourceId || branch.id === editDestinationId,
      ),
    [agencyBranchOptions, appliedSourceId, editDestinationId],
  );

  const handleEditDestinationChange = (value: string) => {
    setEditDestinationId(value);
    setEditPickupLocationId('');
  };

  const handleSaveEdit = async () => {
    if (!editingParcel) return;
    const senderPhone = normalizePhoneDigits(editSenderPhone);
    const senderPhone2 = normalizePhoneDigits(editSenderPhone2);
    const receiverPhone = normalizePhoneDigits(editReceiverPhone);
    const receiverPhone2 = normalizePhoneDigits(editReceiverPhone2);

    if (!senderPhone) {
      toast.error('Sender telephone is required');
      return;
    }
    if (!isTenDigitPhone(senderPhone)) {
      toast.error(phoneLengthMessage('Sender telephone'));
      return;
    }
    if (!isOptionalTenDigitPhone(senderPhone2)) {
      toast.error(phoneLengthMessage('Sender telephone 2'));
      return;
    }
    if (!receiverPhone) {
      toast.error('Receiver telephone is required');
      return;
    }
    if (!isTenDigitPhone(receiverPhone)) {
      toast.error(phoneLengthMessage('Receiver telephone'));
      return;
    }
    if (!isOptionalTenDigitPhone(receiverPhone2)) {
      toast.error(phoneLengthMessage('Receiver telephone 2'));
      return;
    }

    try {
      await Promise.all([
        updateParcel({
          id: editingParcel.id,
          destinationId: editDestinationId,
          sourceLocationId: editSourceLocationId || null,
          pickupLocationId: editPickupLocationId || null,
        }).unwrap(),
        updateCustomer({
          id: editingParcel.senderId,
          telephone: senderPhone,
          telephone2: senderPhone2 || null,
        }).unwrap(),
        updateCustomer({
          id: editingParcel.receiverId,
          telephone: receiverPhone,
          telephone2: receiverPhone2 || null,
        }).unwrap(),
      ]);

      toast.success('Parcel and customer phones updated');
      setEditingParcel(null);
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update parcel details');
    }
  };

  if (!companyId) {
    return (
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Processed Parcels for Consignment</CardTitle>
            <CardDescription>
              A company and branch context is required to list processed parcels and create
              consignments.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full p-4 space-y-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Processed Parcels for Consignment</CardTitle>
                <CardDescription>
                  {isHeadOffice
                    ? 'Filter by agency branch, destination branch, and optionally destination location.'
                    : 'Use destination filters and create one consignment per destination branch.'}
                </CardDescription>
              </div>
              <PaymentStatusLegend />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`grid gap-3 rounded-md border p-3 ${
                isHeadOffice ? 'md:grid-cols-3' : 'md:grid-cols-2'
              }`}
            >
              {isHeadOffice ? (
                <div className="space-y-2">
                  <Label htmlFor="processed-consignment-branch-filter">Agency Filter</Label>
                  <Select
                    value={selectedBranchFilter}
                    onValueChange={(value) => {
                      setSelectedBranchFilter(value);
                      if (
                        selectedDestinationFilter !== ALL_VALUE &&
                        selectedDestinationFilter === value
                      ) {
                        setSelectedDestinationFilter(ALL_VALUE);
                        setSelectedDestinationLocationFilter(ALL_VALUE);
                      }
                      setHasLoaded(false);
                      resetSelection();
                    }}
                  >
                    <SelectTrigger id="processed-consignment-branch-filter">
                      <SelectValue placeholder="All agencies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>All agencies</SelectItem>
                      {agencyBranchOptions.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="processed-consignment-destination-filter">Destination Filter</Label>
                <Select
                  value={selectedDestinationFilter}
                  onValueChange={(value) => {
                    setSelectedDestinationFilter(value);
                    setSelectedDestinationLocationFilter(ALL_VALUE);
                    setHasLoaded(false);
                    resetSelection();
                  }}
                >
                  <SelectTrigger id="processed-consignment-destination-filter">
                    <SelectValue placeholder="All destinations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>All destinations</SelectItem>
                    {agencyBranchOptions.map((branch) => (
                      <SelectItem
                        key={branch.id}
                        value={branch.id}
                        disabled={
                          Boolean(disallowedDestinationId) && branch.id === disallowedDestinationId
                        }
                      >
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="processed-consignment-destination-location-filter">
                  Destination Location Filter
                </Label>
                <Select
                  value={selectedDestinationLocationFilter}
                  onValueChange={(value) => {
                    if (!appliedDestinationId) return;
                    setSelectedDestinationLocationFilter(value);
                    setHasLoaded(false);
                    resetSelection();
                  }}
                >
                  <SelectTrigger
                    id="processed-consignment-destination-location-filter"
                    disabled={!appliedDestinationId}
                  >
                    <SelectValue placeholder="All destination locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>All destination locations</SelectItem>
                    {locationOptions.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={loadData} className="w-full md:w-auto">
                  Load Data
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
              <div className="space-y-1 text-sm">
                <p className="font-medium">Selected: {selectedIds.size}</p>
                <p className="text-muted-foreground">
                  Destination Lock: {lockedDestinationName ?? 'Not selected'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedIds(new Set());
                    setLockedDestinationId(null);
                  }}
                  disabled={selectedIds.size === 0 || isSubmitting}
                >
                  Clear Selection
                </Button>
                <Button
                  onClick={handleCreateConsignment}
                  disabled={
                    selectedIds.size === 0 ||
                    !lockedDestinationId ||
                    !appliedSourceId ||
                    !hasLoaded ||
                    isSubmitting
                  }
                >
                  {isSubmitting ? 'Creating...' : 'Create Consignment'}
                </Button>
              </div>
            </div>

            <DataTable
              mode="server"
              data={rows}
              columns={columns}
              meta={hasLoaded ? (data?.meta ?? EMPTY_META) : EMPTY_META}
              loading={hasLoaded ? isLoading : false}
              serverFilters={{
                ...serverFilters,
              }}
              onRequestChange={(next) =>
                setQuery((prev) => ({
                  ...prev,
                  ...next,
                  filters: serverFilters,
                }))
              }
              searchPlaceholder="Search by tracking, booking, sender or receiver"
              enableVirtualization={false}
            />
          </CardContent>
        </Card>
      </ScrollableWrapper>

      <EditParcelDetailsDialog
        open={Boolean(editingParcel)}
        editSourceLocationId={editSourceLocationId}
        onEditSourceLocationIdChange={setEditSourceLocationId}
        sourceLocationOptions={sourceLocationOptions}
        editDestinationId={editDestinationId}
        onEditDestinationIdChange={handleEditDestinationChange}
        editDestinationOptions={editDestinationOptions}
        editPickupLocationId={editPickupLocationId}
        onEditPickupLocationIdChange={setEditPickupLocationId}
        editLocationOptions={editLocationOptions}
        editSenderPhone={editSenderPhone}
        onEditSenderPhoneChange={setEditSenderPhone}
        editSenderPhone2={editSenderPhone2}
        onEditSenderPhone2Change={setEditSenderPhone2}
        editReceiverPhone={editReceiverPhone}
        onEditReceiverPhoneChange={setEditReceiverPhone}
        editReceiverPhone2={editReceiverPhone2}
        onEditReceiverPhone2Change={setEditReceiverPhone2}
        isSaving={isSavingEdit}
        onClose={() => setEditingParcel(null)}
        onSave={handleSaveEdit}
      />

      {reprintData ? (
        <ParcelReceiptActions
          data={reprintData}
          autoPrint
          autoPrintSelection={reprintSelection}
          stickerCopies={reprintStickerCopies}
          mode="reprint"
          onAutoPrintComplete={() => setReprintData(null)}
        />
      ) : null}
      <ConsignmentPrintController
        payload={consignmentPrintPayload}
        onPrinted={() => setConsignmentPrintPayload(null)}
      />
    </div>
  );
}
