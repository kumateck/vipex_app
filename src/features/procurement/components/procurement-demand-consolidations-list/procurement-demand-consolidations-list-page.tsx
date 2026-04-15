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
import { useListProcurementDemandConsolidationsQuery } from '../../api/procurement.api';

export function ProcurementDemandConsolidationsListPage() {
  const [page, setPage] = useState(1);
  const query = useMemo(() => ({ page, pageSize: 20 }), [page]);
  const { data, isLoading } = useListProcurementDemandConsolidationsQuery(query);
  const rows = data?.data ?? [];
  const meta = data?.meta;

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Demand Consolidations</CardTitle>
            <Button asChild>
              <Link to="/procurement/demands/consolidations/new">Create consolidation</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Consolidation No</TableHead>
                  <TableHead>Source Root</TableHead>
                  <TableHead>Target Main Store</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5}>Loading consolidations...</TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.consolidationNo}</TableCell>
                      <TableCell>{row.sourceRootLocationId ?? '-'}</TableCell>
                      <TableCell>{row.targetMainStoreLocationId ?? '-'}</TableCell>
                      <TableCell>{row.createdBy}</TableCell>
                      <TableCell>{formatDateTimeShared(row.createdAt)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5}>No consolidations found.</TableCell>
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
