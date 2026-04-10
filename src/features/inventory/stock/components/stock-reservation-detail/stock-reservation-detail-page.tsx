import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useGetStockReservationQuery } from '@/features/inventory/api';
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
  const queryArg = useMemo(() => id, [id]);
  const { data, isLoading } = useGetStockReservationQuery(queryArg, { skip: !id });

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
                    <strong>Request:</strong> {data.requestId}
                  </p>
                  <p>
                    <strong>Line:</strong> {data.requestLineId}
                  </p>
                  <p>
                    <strong>Product:</strong> {data.productId}
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
                          <TableCell>{allocation.sourceLocationId}</TableCell>
                          <TableCell>{allocation.sourceLotId ?? 'N/A'}</TableCell>
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
