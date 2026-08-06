import { formatDateTime as formatDateTimeShared } from '@/lib/dates';
import { Link } from 'react-router-dom';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
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
import { useListStockCountSessionsQuery } from '@/features/inventory/api';
import { useAuthStore } from '@/stores/auth-store';
import { useMemo, useState } from 'react';

function statusLabel(status: number) {
  if (status === 0) return 'Draft';
  if (status === 1) return 'Submitted';
  if (status === 2) return 'Approved';
  if (status === 3) return 'Cancelled';
  return 'Unknown';
}

export function StockCountSessionsListPage() {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const [page, setPage] = useState(1);

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

  const { data, isLoading } = useListStockCountSessionsQuery(query, { skip: !companyId });

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Stock Count Sessions</CardTitle>
            <Button asChild>
              <Link to="/inventory/stock-count-sessions/new">Create session</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session No</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4}>Loading sessions...</TableCell>
                  </TableRow>
                ) : (data?.data ?? []).length ? (
                  (data?.data ?? []).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Link
                          className="underline"
                          to={`/inventory/stock-count-sessions/view/${row.id}`}
                        >
                          {row.sessionNo}
                        </Link>
                      </TableCell>
                      <TableCell>{row.locationId}</TableCell>
                      <TableCell>{statusLabel(row.status)}</TableCell>
                      <TableCell>
                        {row.createdAt ? formatDateTimeShared(row.createdAt) : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4}>No stock count sessions.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {data?.meta.page ?? 1} of {data?.meta.totalPages ?? 1}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={(data?.meta.page ?? 1) <= 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={(data?.meta.page ?? 1) >= (data?.meta.totalPages ?? 1)}
                  onClick={() => setPage((value) => value + 1)}
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
