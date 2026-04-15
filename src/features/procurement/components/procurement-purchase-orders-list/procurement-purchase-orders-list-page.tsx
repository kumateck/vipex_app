import { formatDateTime as formatDateTimeShared } from '@/lib/dates';
import { Link } from 'react-router-dom';
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
import { useListProcurementPurchaseOrdersQuery } from '../../api/procurement.api';

function poStatusLabel(status: number) {
  if (status === 0) return 'Open';
  if (status === 1) return 'Partially Received';
  if (status === 2) return 'Received';
  if (status === 3) return 'Cancelled';
  return 'Unknown';
}

export function ProcurementPurchaseOrdersListPage() {
  const [page, setPage] = useState(1);
  const query = useMemo(() => ({ page, pageSize: 20 }), [page]);
  const { data, isLoading } = useListProcurementPurchaseOrdersQuery(query);
  const rows = data?.data ?? [];
  const meta = data?.meta;

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Purchase Orders</CardTitle>
            <Button asChild>
              <Link to="/procurement/purchase-orders/new">Create purchase order</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO No</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5}>Loading purchase orders...</TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.poNo}</TableCell>
                      <TableCell>{row.supplierId}</TableCell>
                      <TableCell>{poStatusLabel(row.status)}</TableCell>
                      <TableCell>{row.createdBy}</TableCell>
                      <TableCell>{formatDateTimeShared(row.createdAt)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5}>No purchase orders found.</TableCell>
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
