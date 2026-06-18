import { formatDateTime as formatDateTimeShared } from '@/lib/dates';
import { Link, useParams } from 'react-router-dom';
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
import { useGetStockLotQuery } from '@/features/inventory/api';
import { useAuthStore } from '@/stores/auth-store';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useListInventoryProductOptionsQuery } from '@/features/inventory/products/api/inventory-products.api';
import { useMemo } from 'react';

export function StockLotDetailPage() {
  const { id = '' } = useParams();
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const queryArg = useMemo(() => id, [id]);
  const { data, isLoading } = useGetStockLotQuery(queryArg, { skip: !id });
  const { data: locations = [] } = useListInventoryLocationOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: products = [] } = useListInventoryProductOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const locationNameById = useMemo(
    () => new Map(locations.map((location) => [location.id, location.name] as const)),
    [locations],
  );
  const productNameById = useMemo(
    () => new Map(products.map((product) => [product.id, product.name] as const)),
    [products],
  );

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Stock Lot Detail</CardTitle>
            <div className="flex gap-3 text-sm">
              <Link className="underline" to={`/inventory/stock-lots/traceability/${id}`}>
                Traceability
              </Link>
              <Link className="underline" to="/inventory/stock-lots">
                Back to lots
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p>Loading lot...</p>
            ) : data ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <p>
                    <strong>Batch:</strong> {data.batchNumber}
                  </p>
                  <p>
                    <strong>Product:</strong>{' '}
                    {productNameById.get(data.productId) ?? data.productId}
                  </p>
                  <p>
                    <strong>Location:</strong>{' '}
                    {locationNameById.get(data.locationId) ?? data.locationId}
                  </p>
                  <p>
                    <strong>On hand:</strong> {data.quantityOnHand}
                  </p>
                  <p>
                    <strong>Reserved:</strong> {data.reservedQuantity}
                  </p>
                  <p>
                    <strong>Status:</strong> {data.status}
                  </p>
                  <p>
                    <strong>Received:</strong>{' '}
                    {data.receivedAt ? formatDateTimeShared(data.receivedAt) : 'N/A'}
                  </p>
                  <p>
                    <strong>Expiry:</strong>{' '}
                    {data.expiryDate ? new Date(data.expiryDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.movements?.length ? (
                      data.movements.map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell>
                            {movement.createdAt ? formatDateTimeShared(movement.createdAt) : 'N/A'}
                          </TableCell>
                          <TableCell>{movement.movementType}</TableCell>
                          <TableCell>{movement.quantity}</TableCell>
                          <TableCell>
                            {movement.referenceId ?? movement.referenceType ?? '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4}>No lot movements yet.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </>
            ) : (
              <p>Lot not found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
