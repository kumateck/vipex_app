import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useListStockReservationsQuery,
  useAllocateStockReservationMutation,
  useIssueStockReservationMutation,
} from '@/features/inventory/api';
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
  const [page, setPage] = useState(1);
  const [allocateReservation, { isLoading: allocating }] = useAllocateStockReservationMutation();
  const [issueReservation, { isLoading: issuing }] = useIssueStockReservationMutation();

  const query = useMemo(
    () => ({
      page,
      pageSize: 20,
      filters: {
        companyId: user?.company?.id ?? '',
      },
    }),
    [page, user?.company?.id],
  );

  const { data, isLoading } = useListStockReservationsQuery(query, {
    skip: !user?.company?.id,
  });

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const onAllocate = async (reservationId: string) => {
    try {
      const result = await allocateReservation({ reservationId }).unwrap();
      toast.success(`Allocated ${result.allocatedQuantity} with short ${result.shortQuantity}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Allocation failed');
    }
  };

  const onIssue = async (reservationId: string) => {
    try {
      const result = await issueReservation({ reservationId }).unwrap();
      toast.success(`Issued ${result.issuedQuantity}, remaining ${result.remainingQuantity}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Issue failed');
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
                        >
                          {row.id}
                        </Link>
                      </TableCell>
                      <TableCell>{row.requestId}</TableCell>
                      <TableCell>{row.productId}</TableCell>
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
