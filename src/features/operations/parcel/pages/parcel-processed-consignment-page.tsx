import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ParcelStatus } from '@/db/schemas/enums';
import type { PaginationMeta } from '@/server/types/pagination.types';
import type { ServerListQuery } from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useListLocationOptionsQuery } from '@/features/locations/api/locations.api';
import { BranchType } from '@/db/schemas/enums';
import {
  type ProcessedParcel,
  useAddConsignmentItemsMutation,
  useCreateConsignmentMutation,
  useListProcessedParcelsForConsignmentQuery,
} from '../api/parcel.api';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};
const ALL_VALUE = '__all__';

function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function getTodayDateOnlyLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function ParcelProcessedConsignmentPage() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const userBranchId = user?.branch?.id ?? null;
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
  const [createConsignment, { isLoading: isCreatingConsignment }] = useCreateConsignmentMutation();
  const [addConsignmentItems, { isLoading: isAddingItems }] = useAddConsignmentItemsMutation();

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

  const rows = data?.data ?? [];
  const loadData = () => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      filters: serverFilters,
    }));
    setHasLoaded(true);
    resetSelection();
  };

  const toggleRowSelection = (parcel: ProcessedParcel, checked: boolean) => {
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
  };

  const toggleSelectAllEligible = (checked: boolean) => {
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
  };

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
        id: 'destination',
        header: 'Destination Branch',
        accessorFn: (row) =>
          row.destinationName ?? branchNameById.get(row.destinationId) ?? 'Unknown branch',
      },
      {
        id: 'location',
        header: 'Destination Location',
        accessorFn: (row) => row.pickupLocationName ?? '-',
      },
      {
        accessorKey: 'createdAt',
        header: 'Processed At',
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
    ],
    [
      allEligibleSelected,
      someEligibleSelected,
      rows,
      selectedIds,
      lockedDestinationId,
      branchNameById,
      toggleSelectAllEligible,
    ],
  );

  const handleCreateConsignment = async () => {
    if (!companyId || !userId) {
      toast.error('Authenticated company, branch, and user context are required');
      return;
    }

    const parcelIds = Array.from(selectedIds);
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

      toast.success(`Consignment ${created.code} created with ${added.added} parcel(s)`);
      setSelectedIds(new Set());
      setLockedDestinationId(null);
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create consignment');
    }
  };

  const isSubmitting = isCreatingConsignment || isAddingItems;
  const lockedDestinationName = lockedDestinationId
    ? (branchNameById.get(lockedDestinationId) ?? '-')
    : null;

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
            <CardTitle>Processed Parcels for Consignment</CardTitle>
            <CardDescription>
              {isHeadOffice
                ? 'Filter by agency branch, destination branch, and optionally destination location.'
                : 'Use destination filters and create one consignment per destination branch.'}
            </CardDescription>
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
    </div>
  );
}
