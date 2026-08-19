import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/datatable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { ParcelStatus } from '@/db/schemas/enums';
import { formatDateTime } from '@/lib/dates';
import type { PaginationMeta } from '@/server/types/pagination.types';
import type { ServerListQuery } from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';
import { type ParcelSearchRow, useSearchParcelsQuery } from '../../api/parcel.api';
import { CallSenderBadge } from '../call-sender-badge';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

function formatCurrency(amountPsw: number | null | undefined) {
  return `GHS ${(Number(amountPsw ?? 0) / 100).toFixed(2)}`;
}

export function ParcelUncollectedPage() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;

  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState<
    ServerListQuery<{
      companyId?: string | null;
      destinationId?: string | null;
      statuses?: number[] | null;
      agedOnly?: boolean | null;
      storageChargeAccruing?: boolean | null;
    }>
  >({
    page: 1,
    pageSize: 20,
    sort: [{ field: 'createdAt', direction: 'desc' }],
    filters: {
      companyId,
      destinationId: branchId,
      statuses: [ParcelStatus.AWAITING_PICKUP, ParcelStatus.HOME_DELIVERY_REQUESTED],
      agedOnly: true,
      storageChargeAccruing: true,
    },
  });

  const rowsQuery = useSearchParcelsQuery(query, {
    skip: !companyId || !branchId,
  });
  const rows = rowsQuery.data?.data ?? [];

  const columns = useMemo<ColumnDef<ParcelSearchRow>[]>(
    () => [
      { accessorKey: 'bookingCode', header: 'Booking' },
      {
        id: 'receiver',
        header: 'Receiver',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 leading-tight">
            <p>{row.original.receiverName ?? '-'}</p>
            {row.original.callSender ? (
              <CallSenderBadge className="h-5 px-1.5 text-[10px]" />
            ) : null}
          </div>
        ),
      },
      { accessorKey: 'receiverPhone', header: 'Phone' },
      {
        id: 'age',
        header: 'Age',
        cell: ({ row }) => (
          <div className="text-xs">
            <p>{row.original.ageingDays != null ? `${row.original.ageingDays} days` : '-'}</p>
            {row.original.isParcelAged ? <Badge variant="destructive">Aged</Badge> : null}
          </div>
        ),
      },
      {
        id: 'storage',
        header: 'Storage',
        cell: ({ row }) => (
          <div className="text-xs">
            <p>Accrued: {formatCurrency(row.original.storageChargePsw)}</p>
            <p>
              Start:{' '}
              {row.original.storageChargeStartAt
                ? formatDateTime(row.original.storageChargeStartAt)
                : '-'}
            </p>
          </div>
        ),
      },
      { accessorKey: 'parcelDetails', header: 'Parcel Details' },
    ],
    [],
  );

  const agedOnly = query.filters?.agedOnly !== false;
  const storageAccruingOnly = query.filters?.storageChargeAccruing !== false;

  return (
    <div className="w-full p-4 space-y-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <CardTitle>Aged and Uncollected Parcels</CardTitle>
            <CardDescription>
              Dedicated operations queue for parcels still uncollected and accruing storage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="flex flex-wrap items-end gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                const term = searchInput.trim();
                setQuery((prev) => ({
                  ...prev,
                  page: 1,
                  search: term || undefined,
                }));
              }}
            >
              <div className="min-w-[260px] flex-1">
                <Label htmlFor="uncollected-search">Search</Label>
                <Input
                  id="uncollected-search"
                  placeholder="Tracking, booking, receiver name, or phone"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="uncollected-aged-only"
                  checked={agedOnly}
                  onCheckedChange={(checked) =>
                    setQuery((prev) => ({
                      ...prev,
                      page: 1,
                      filters: {
                        ...prev.filters,
                        agedOnly: checked === true,
                      },
                    }))
                  }
                />
                <Label htmlFor="uncollected-aged-only" className="cursor-pointer">
                  Aged only
                </Label>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="uncollected-storage-only"
                  checked={storageAccruingOnly}
                  onCheckedChange={(checked) =>
                    setQuery((prev) => ({
                      ...prev,
                      page: 1,
                      filters: {
                        ...prev.filters,
                        storageChargeAccruing: checked === true,
                      },
                    }))
                  }
                />
                <Label htmlFor="uncollected-storage-only" className="cursor-pointer">
                  Storage accruing only
                </Label>
              </div>
              <Button type="submit">Search</Button>
            </form>

            <DataTable
              mode="server"
              data={rows}
              columns={columns}
              meta={rowsQuery.data?.meta ?? EMPTY_META}
              loading={rowsQuery.isLoading}
              showSearch={false}
              serverFilters={query.filters}
              onRequestChange={(next) =>
                setQuery((prev) => ({
                  ...prev,
                  ...next,
                  search: prev.search,
                  filters: {
                    ...prev.filters,
                  },
                }))
              }
              enableVirtualization={false}
            />
          </CardContent>
        </Card>
      </ScrollableWrapper>
    </div>
  );
}
