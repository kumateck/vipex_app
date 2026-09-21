import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useListStockReservationsQuery,
  useAllocateStockReservationMutation,
  useIssueStockReservationMutation,
  useListStockRequestsQuery,
} from '@/features/inventory/api';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useListInventoryProductOptionsQuery } from '@/features/inventory/products/api/inventory-products.api';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

function reservationStatusLabel(status: number) {
  if (status === 0) return 'Open';
  if (status === 1) return 'Partially Allocated';
  if (status === 2) return 'Allocated';
  if (status === 3) return 'Issued';
  if (status === 4) return 'Short';
  if (status === 5) return 'Cancelled';
  return 'Unknown';
}

export function StockReservationsListPage() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const [page, setPage] = useState(1);
  const [allocateReservation, { isLoading: allocating }] = useAllocateStockReservationMutation();
  const [issueReservation, { isLoading: issuing }] = useIssueStockReservationMutation();

  const query = useMemo(
    () => ({
      page,
      pageSize: 20,
      filters: {
        companyId: companyId ?? '',
      },
    }),
    [companyId, page],
  );

  const { data, isLoading } = useListStockReservationsQuery(query, {
    skip: !companyId,
  });
  const { data: products = [] } = useListInventoryProductOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: locations = [] } = useListInventoryLocationOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: requestsData } = useListStockRequestsQuery(
    {
      page: 1,
      pageSize: 200,
      filters: { companyId },
    },
    { skip: !companyId },
  );

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const productNameById = useMemo(
    () => new Map(products.map((product) => [product.id, product.name] as const)),
    [products],
  );
  const locationNameById = useMemo(
    () => new Map(locations.map((location) => [location.id, location.name] as const)),
    [locations],
  );
  const requestLabelById = useMemo(() => {
    return new Map(
      (requestsData?.data ?? []).map((request) => {
        const requester = locationNameById.get(request.requesterLocationId) ?? 'Unknown requester';
        const requestedTo = request.requestedToLocationId
          ? (locationNameById.get(request.requestedToLocationId) ?? 'Unknown destination')
          : null;
        const label = requestedTo ? `${requester} -> ${requestedTo}` : requester;
        return [request.id, label] as const;
      }),
    );
  }, [locationNameById, requestsData?.data]);

  const onAllocate = async (reservationId: string) => {
    try {
      const result = await allocateReservation({ reservationId }).unwrap();
      toast.success(`Allocated ${result.allocatedQuantity} with short ${result.shortQuantity}`);
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Allocation failed');
    }
  };

  const onIssue = async (reservationId: string) => {
    try {
      const result = await issueReservation({ reservationId }).unwrap();
      toast.success(`Issued ${result.issuedQuantity}, remaining ${result.remainingQuantity}`);
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Issue failed');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Stock Reservations</CardTitle>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/inventory/stock-reservations/exceptions">Exceptions</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/inventory/stock-allocation-policy">Allocation Policy</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reservation</TableHead>
                  <TableHead>Request</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Short</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9}>Loading reservations...</TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Link
                          className="underline"
                          to={`/inventory/stock-reservations/view/${row.id}`}
                          title={row.id}
                        >
                          View reservation
                        </Link>
                      </TableCell>
                      <TableCell title={row.requestId}>
                        <Link
                          className="underline"
                          to={`/inventory/stock-requests/view/${row.requestId}`}
                        >
                          {requestLabelById.get(row.requestId) ??
                            locationNameById.get(row.requesterLocationId) ??
                            'View request'}
                        </Link>
                      </TableCell>
                      <TableCell title={row.productId}>
                        {productNameById.get(row.productId) ?? 'Unknown product'}
                      </TableCell>
                      <TableCell>{row.requestedQuantity}</TableCell>
                      <TableCell>{row.reservedQuantity}</TableCell>
                      <TableCell>{row.issuedQuantity}</TableCell>
                      <TableCell>{row.shortQuantity}</TableCell>
                      <TableCell>{reservationStatusLabel(row.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            disabled={allocating || issuing || row.status === 3 || row.status === 5}
                            onClick={() => onAllocate(row.id)}
                          >
                            Allocate
                          </Button>
                          <Button
                            disabled={allocating || issuing || row.status === 3 || row.status === 5}
                            onClick={() => onIssue(row.id)}
                          >
                            Issue
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9}>No reservations found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {meta?.page ?? 1} of {meta?.totalPages ?? 1}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={(meta?.page ?? 1) <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={(meta?.page ?? 1) >= (meta?.totalPages ?? 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
