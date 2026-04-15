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
import { useGetStockLotTraceabilityQuery } from '@/features/inventory/api';
import { useAuthStore } from '@/stores/auth-store';
import { useListInventoryProductOptionsQuery } from '@/features/inventory/products/api/inventory-products.api';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useMemo } from 'react';

export function StockLotTraceabilityPage() {
  const { id = '' } = useParams();
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const queryArg = useMemo(() => id, [id]);
  const { data, isLoading } = useGetStockLotTraceabilityQuery(queryArg, { skip: !id });
  const { data: products = [] } = useListInventoryProductOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: locations = [] } = useListInventoryLocationOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const productNameById = useMemo(
    () => new Map(products.map((product) => [product.id, product.name] as const)),
    [products],
  );
  const locationNameById = useMemo(
    () => new Map(locations.map((location) => [location.id, location.name] as const)),
    [locations],
  );

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Lot Traceability</CardTitle>
            <div className="flex gap-2 text-sm">
              <Link className="underline" to={`/inventory/stock-lots/view/${id}`}>
                Lot detail
              </Link>
              <Link className="underline" to="/inventory/stock-lots">
                Back to lots
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading traceability...</p>
            ) : data ? (
              <div className="space-y-4">
                <div className="text-sm">
                  <p>
                    <strong>Batch:</strong> {data.lot.batchNumber}
                  </p>
                  <p>
                    <strong>Product:</strong>{' '}
                    {productNameById.get(data.lot.productId) ?? data.lot.productId}
                  </p>
                  <p>
                    <strong>Location:</strong>{' '}
                    {locationNameById.get(data.lot.locationId) ?? data.lot.locationId}
                  </p>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>GRN</TableHead>
                      <TableHead>PO</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Received Qty</TableHead>
                      <TableHead>Received At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.procurementLinks.length ? (
                      data.procurementLinks.map((row) => (
                        <TableRow key={row.goodsReceiptItemId}>
                          <TableCell>{row.receiptNo}</TableCell>
                          <TableCell>{row.poNo ?? row.purchaseOrderId ?? 'N/A'}</TableCell>
                          <TableCell>{row.supplierName ?? row.supplierId ?? 'N/A'}</TableCell>
                          <TableCell>{row.receivedQuantity}</TableCell>
                          <TableCell>
                            {row.receivedAt ? formatDateTimeShared(row.receivedAt) : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5}>No procurement links found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p>Traceability not found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
