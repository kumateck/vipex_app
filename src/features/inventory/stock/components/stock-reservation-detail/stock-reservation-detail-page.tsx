import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useGetStockReservationQuery,
  useGetStockRequestQuery,
  useListStockLotsQuery,
} from '@/features/inventory/api';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useListInventoryProductOptionsQuery } from '@/features/inventory/products/api/inventory-products.api';
import { useAuthStore } from '@/stores/auth-store';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function StockReservationDetailPage() {
  const { id = '' } = useParams();
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const queryArg = useMemo(() => id, [id]);
  const { data, isLoading } = useGetStockReservationQuery(queryArg, { skip: !id });
  const { data: request } = useGetStockRequestQuery(data?.requestId ?? '', {
    skip: !data?.requestId,
  });
  const { data: products = [] } = useListInventoryProductOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: locations = [] } = useListInventoryLocationOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: lotsData } = useListStockLotsQuery(
    {
      page: 1,
      pageSize: 200,
      filters: {
        companyId: companyId ?? '',
        productId: data?.productId ?? null,
      },
    },
    { skip: !companyId || !data?.productId },
  );

  const productNameById = useMemo(
    () => new Map(products.map((product) => [product.id, product.name] as const)),
    [products],
  );
  const locationNameById = useMemo(
    () => new Map(locations.map((location) => [location.id, location.name] as const)),
    [locations],
  );
  const lotBatchById = useMemo(
    () => new Map((lotsData?.data ?? []).map((lot) => [lot.id, lot.batchNumber] as const)),
    [lotsData?.data],
  );

  const requestLabel = useMemo(() => {
    if (!data) return null;

    const requester = locationNameById.get(data.requesterLocationId);
    const destination = request?.requestedToLocationId
      ? locationNameById.get(request.requestedToLocationId)
      : null;

    if (requester && destination) return `${requester} -> ${destination}`;
    if (requester) return requester;
    return null;
  }, [data, locationNameById, request?.requestedToLocationId]);

  const lineLabel = useMemo(() => {
    if (!data || !request?.lines?.length) return null;
    const line = request.lines.find((item) => item.id === data.requestLineId);
    if (!line) return null;

    const note = line.notes?.trim();
    if (note) return note;

    const productName = productNameById.get(line.productId);
    return productName ?? null;
  }, [data, productNameById, request?.lines]);

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Stock Reservation Detail</CardTitle>
            <Link className="underline text-sm" to="/inventory/stock-reservations">
              Back to reservations
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p>Loading reservation...</p>
            ) : data ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <p>
                    <strong>ID:</strong> {data.id}
                  </p>
                  <p>
                    <strong>Request:</strong> {requestLabel ?? data.requestId}
                  </p>
                  <p>
                    <strong>Line:</strong> {lineLabel ?? data.requestLineId}
                  </p>
                  <p>
                    <strong>Product:</strong>{' '}
                    {productNameById.get(data.productId) ?? data.productId}
                  </p>
                  <p>
                    <strong>Requested:</strong> {data.requestedQuantity}
                  </p>
                  <p>
                    <strong>Reserved:</strong> {data.reservedQuantity}
                  </p>
                  <p>
                    <strong>Issued:</strong> {data.issuedQuantity}
                  </p>
                  <p>
                    <strong>Short:</strong> {data.shortQuantity}
                  </p>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sequence</TableHead>
                      <TableHead>Source Location</TableHead>
                      <TableHead>Source Lot</TableHead>
                      <TableHead>Reserved</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.allocations?.length ? (
                      data.allocations.map((allocation) => (
                        <TableRow key={allocation.id}>
                          <TableCell>{allocation.sequenceNo}</TableCell>
                          <TableCell>
                            {locationNameById.get(allocation.sourceLocationId) ??
                              allocation.sourceLocationId}
                          </TableCell>
                          <TableCell>
                            {allocation.sourceLotId
                              ? (lotBatchById.get(allocation.sourceLotId) ?? allocation.sourceLotId)
                              : 'N/A'}
                          </TableCell>
                          <TableCell>{allocation.reservedQuantity}</TableCell>
                          <TableCell>{allocation.issuedQuantity}</TableCell>
                          <TableCell>{allocation.status}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6}>No allocations yet.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </>
            ) : (
              <p>Reservation not found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
