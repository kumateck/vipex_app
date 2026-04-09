import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useAcceptProcurementSupplierQuoteMutation,
  useListProcurementSupplierQuotesQuery,
} from '../api/procurement.api';

function quoteStatusLabel(status: number) {
  if (status === 0) return 'Draft';
  if (status === 1) return 'Submitted';
  if (status === 2) return 'Accepted';
  if (status === 3) return 'Rejected';
  return 'Unknown';
}

export function ProcurementSupplierQuotesListPage() {
  const [page, setPage] = useState(1);
  const query = useMemo(() => ({ page, pageSize: 20 }), [page]);
  const { data, isLoading } = useListProcurementSupplierQuotesQuery(query);
  const [acceptQuote, { isLoading: accepting }] = useAcceptProcurementSupplierQuoteMutation();
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const onAccept = async (id: string) => {
    try {
      await acceptQuote({ id }).unwrap();
      toast.success('Quote accepted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to accept quote');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Supplier Quotes</CardTitle>
            <Button asChild>
              <Link to="/procurement/supplier-quotes/new">Create quote</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote No</TableHead>
                  <TableHead>Demand</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6}>Loading quotes...</TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.quoteNo}</TableCell>
                      <TableCell>{row.demandId}</TableCell>
                      <TableCell>{row.supplierId}</TableCell>
                      <TableCell>{row.totalCostPsw.toLocaleString()}</TableCell>
                      <TableCell>{quoteStatusLabel(row.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          disabled={accepting || row.status !== 1}
                          onClick={() => onAccept(row.id)}
                        >
                          Accept
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>No quotes found.</TableCell>
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
                  onClick={() => setPage((prev) => prev - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={(meta?.page ?? 1) >= (meta?.totalPages ?? 1)}
                  onClick={() => setPage((prev) => prev + 1)}
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
