import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ParcelStatus } from '@/db/schemas/enums';
import type { PaginationMeta } from '@/server/types/pagination.types';
import type { ServerListQuery } from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
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
  const sourceId = user?.branch?.id ?? null;
  const userId = user?.id ?? null;

  const [query, setQuery] = useState<
    ServerListQuery<{ companyId?: string | null; sourceId?: string | null; status?: number | null }>
  >({
    page: 1,
    pageSize: 20,
    filters: {
      companyId,
      sourceId,
      status: ParcelStatus.PROCESSED,
    },
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lockedDestinationId, setLockedDestinationId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useListProcessedParcelsForConsignmentQuery(query, {
    skip: !companyId || !sourceId,
  });
  const { data: branchOptions = [] } = useListBranchOptionsQuery({ companyId }, { skip: !companyId });
  const [createConsignment, { isLoading: isCreatingConsignment }] = useCreateConsignmentMutation();
  const [addConsignmentItems, { isLoading: isAddingItems }] = useAddConsignmentItemsMutation();

  const branchNameById = useMemo(
    () => new Map(branchOptions.map((branch) => [branch.id, branch.name])),
    [branchOptions],
  );

  const rows = data?.data ?? [];

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
  const allEligibleSelected = eligibleRows.length > 0 && selectedEligibleCount === eligibleRows.length;
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
        accessorFn: (row) => `${row.senderName ?? '-'}${row.senderPhone ? ` (${row.senderPhone})` : ''}`,
      },
      {
        id: 'receiver',
        header: 'Receiver',
        accessorFn: (row) => `${row.receiverName ?? '-'}${row.receiverPhone ? ` (${row.receiverPhone})` : ''}`,
      },
      {
        id: 'destination',
        header: 'Destination Branch',
        accessorFn: (row) => row.destinationName ?? branchNameById.get(row.destinationId) ?? 'Unknown branch',
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
    if (!companyId || !sourceId || !userId) {
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

    try {
      const created = await createConsignment({
        companyId,
        sourceId,
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
  const lockedDestinationName =
    lockedDestinationId ? branchNameById.get(lockedDestinationId) ?? lockedDestinationId : null;

  if (!companyId || !sourceId) {
    return (
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Processed Parcels for Consignment</CardTitle>
            <CardDescription>
              A company and branch context is required to list processed parcels and create consignments.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Processed Parcels for Consignment</CardTitle>
          <CardDescription>
            Select processed parcels and create one consignment per destination branch.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                disabled={selectedIds.size === 0 || !lockedDestinationId || isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Consignment'}
              </Button>
            </div>
          </div>

          <DataTable
            mode="server"
            data={rows}
            columns={columns}
            meta={data?.meta ?? EMPTY_META}
            loading={isLoading}
            serverFilters={{
              companyId,
              sourceId,
              status: ParcelStatus.PROCESSED,
            }}
            onRequestChange={setQuery}
            searchPlaceholder="Search by tracking, booking, sender or receiver"
            enableVirtualization={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
