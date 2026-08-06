import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BranchType, StockRequestStatus } from '@/db/schemas/enums';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useListStockRequestsQuery } from '@/features/inventory/api';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { formatDateTime } from '@/lib/dates';
import { useAuthStore } from '@/stores/auth-store';
import { stockRequestStatusLabelByValue } from '../../constants/stock-options';
import type { StockRequest } from '../../types/inventory-stock.types';

type QueueMode = 'issue' | 'acknowledge';

type StockRequestQueueTableProps = {
  mode: QueueMode;
};

function matchesQueueMode(request: StockRequest, mode: QueueMode, branchLocationIds: Set<string>) {
  const requested = Number(
    request.totalRequestedQuantity ??
      (request.lines ?? []).reduce((sum, line) => sum + Number(line.requestedQuantity ?? 0), 0),
  );
  const fulfilled = Number(
    request.totalFulfilledQuantity ??
      (request.lines ?? []).reduce((sum, line) => sum + Number(line.fulfilledQuantity ?? 0), 0),
  );
  const acknowledged = Number(
    request.totalAcknowledgedQuantity ??
      (request.lines ?? []).reduce((sum, line) => sum + Number(line.acknowledgedQuantity ?? 0), 0),
  );
  const pendingAcknowledgement = Number(
    request.totalPendingAcknowledgementQuantity ?? Math.max(0, fulfilled - acknowledged),
  );

  if (mode === 'issue') {
    const statusMatch =
      request.status === StockRequestStatus.SUBMITTED ||
      request.status === StockRequestStatus.APPROVED ||
      request.status === StockRequestStatus.PARTIALLY_FULFILLED;

    if (!statusMatch || !request.requestedToLocationId) return false;
    return branchLocationIds.has(request.requestedToLocationId);
  }

  const statusMatch =
    request.status === StockRequestStatus.PARTIALLY_FULFILLED ||
    request.status === StockRequestStatus.FULFILLED;

  if (!statusMatch) return false;
  if (!branchLocationIds.has(request.requesterLocationId)) return false;
  if (requested <= 0) return false;
  return pendingAcknowledgement > 0;
}

export function StockRequestQueueTable({ mode }: StockRequestQueueTableProps) {
  const PAGE_SIZE = 20;
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const userBranchId = user?.branch?.id ?? null;
  const isHeadOffice = user?.branch?.type === BranchType.HEADOFFICE;

  const { data: listData, isLoading: isLoadingRequests } = useListStockRequestsQuery(
    {
      page: 1,
      pageSize: 100,
      filters: { companyId },
    },
    { skip: !companyId },
  );
  const [page, setPage] = useState(1);

  const { data: locations = [], isLoading: isLoadingLocations } =
    useListInventoryLocationOptionsQuery({ companyId }, { skip: !companyId });

  const locationNameById = useMemo(
    () => new Map(locations.map((location) => [location.id, location.name] as const)),
    [locations],
  );
  const branchLocationIds = useMemo(() => {
    if (isHeadOffice || !userBranchId) {
      return new Set(locations.map((location) => location.id));
    }
    return new Set(
      locations
        .filter((location) => location.branchId === userBranchId)
        .map((location) => location.id),
    );
  }, [isHeadOffice, locations, userBranchId]);

  const queueRows = useMemo(
    () =>
      (listData?.data ?? []).filter((request) =>
        matchesQueueMode(request, mode, branchLocationIds),
      ),
    [listData?.data, mode, branchLocationIds],
  );

  const withTotals = useMemo(
    () =>
      queueRows.map((request) => {
        const fallbackRequested = (request.lines ?? []).reduce(
          (sum, line) => sum + Number(line.requestedQuantity ?? 0),
          0,
        );
        const fallbackFulfilled = (request.lines ?? []).reduce(
          (sum, line) => sum + Number(line.fulfilledQuantity ?? 0),
          0,
        );
        const fallbackAcknowledged = (request.lines ?? []).reduce(
          (sum, line) => sum + Number(line.acknowledgedQuantity ?? 0),
          0,
        );
        const requested = Number(request.totalRequestedQuantity ?? fallbackRequested);
        const fulfilled = Number(request.totalFulfilledQuantity ?? fallbackFulfilled);
        const acknowledged = Number(request.totalAcknowledgedQuantity ?? fallbackAcknowledged);
        return {
          request,
          requested,
          fulfilled,
          acknowledged,
          pendingIssue: Number(
            request.totalPendingIssueQuantity ?? Math.max(0, requested - fulfilled),
          ),
          pendingAcknowledgement: Number(
            request.totalPendingAcknowledgementQuantity ?? Math.max(0, fulfilled - acknowledged),
          ),
          lineCount: Number(request.lineCount ?? request.lines?.length ?? 0),
        };
      }),
    [queueRows],
  );
  const totalPages = Math.max(1, Math.ceil(withTotals.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const pagedRows = useMemo(
    () => withTotals.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE),
    [withTotals, clampedPage],
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  if (isLoadingRequests || isLoadingLocations) {
    return (
      <div className="w-full p-4">
        <Spinner />
      </div>
    );
  }

  const title = mode === 'issue' ? 'Issue stock requests' : 'Acknowledge issued requests';
  const description =
    mode === 'issue'
      ? 'Submitted requests routed to your location for dispatch.'
      : 'Requests initiated by your location that were dispatched and need receipt confirmation.';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="mb-3 text-sm text-muted-foreground">
          Showing {pagedRows.length} of {queueRows.length} request
          {queueRows.length === 1 ? '' : 's'}
        </div>
        <div className="rounded-md border overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3">Requester</th>
                <th className="text-left p-3">Requested To</th>
                <th className="text-left p-3">Lines</th>

                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Created</th>
                <th className="text-left p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.length === 0 ? (
                <tr>
                  <td className="p-3 text-muted-foreground" colSpan={10}>
                    No requests in this queue.
                  </td>
                </tr>
              ) : null}

              {pagedRows.map((row) => (
                <tr key={row.request.id} className="border-b last:border-b-0">
                  <td className="p-3">
                    {locationNameById.get(row.request.requesterLocationId) ??
                      row.request.requesterLocationId}
                  </td>
                  <td className="p-3">
                    {row.request.requestedToLocationId
                      ? (locationNameById.get(row.request.requestedToLocationId) ??
                        row.request.requestedToLocationId)
                      : '-'}
                  </td>
                  <td className="p-3">{row.lineCount}</td>

                  <td className="p-3">
                    {stockRequestStatusLabelByValue.get(row.request.status) ??
                      String(row.request.status)}
                  </td>
                  <td className="p-3">
                    {row.request.createdAt ? formatDateTime(row.request.createdAt) : '-'}
                  </td>
                  <td className="p-3">
                    <Button asChild size="sm" variant="outline">
                      <Link
                        to={
                          mode === 'issue'
                            ? `/inventory/stock-requests/issue/${row.request.id}`
                            : `/inventory/stock-requests/receive/${row.request.id}`
                        }
                      >
                        {mode === 'issue' ? 'Issue request' : 'Acknowledge issue'}
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2 text-sm text-muted-foreground">
          <span>
            Page {clampedPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={clampedPage <= 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={clampedPage >= totalPages}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
