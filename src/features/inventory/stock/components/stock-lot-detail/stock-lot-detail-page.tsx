import { useMemo } from 'react';
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

export function StockLotDetailPage() {
  const { id = '' } = useParams();
  const queryArg = useMemo(() => id, [id]);
  const { data, isLoading } = useGetStockLotQuery(queryArg, { skip: !id });

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
                    <strong>Product:</strong> {data.productId}
                  </p>
                  <p>
                    <strong>Location:</strong> {data.locationId}
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
                    {data.receivedAt ? new Date(data.receivedAt).toLocaleString() : 'N/A'}
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
                            {movement.createdAt
                              ? new Date(movement.createdAt).toLocaleString()
                              : 'N/A'}
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
