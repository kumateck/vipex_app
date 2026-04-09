import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  useListReconciliationBranchOptionsQuery,
  useListReconciliationSessionsQuery,
} from '../../api/reconciliation.api';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

function formatMoneyPsw(amountPsw: number) {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountPsw / 100);
}

function statusLabel(status: number) {
  if (status === 0) return 'Draft';
  if (status === 1) return 'Confirmed';
  if (status === 2) return 'Posted';
  return `Status ${status}`;
}

export function ReconciliationSessionsListPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('all');
  const [branchId, setBranchId] = useState<string>('all');
  const { data: branches = [] } = useListReconciliationBranchOptionsQuery();

  const query = useMemo(
    () => ({
      page,
      pageSize: 20,
      search: search.trim() || undefined,
      filters: {
        status: status === 'all' ? undefined : Number(status),
        branchId: branchId === 'all' ? undefined : branchId,
      },
    }),
    [page, search, status, branchId],
  );

  const { data, isLoading } = useListReconciliationSessionsQuery(query);
  const rows = data?.data ?? [];
  const meta = data?.meta;

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Reconciliation Sessions</CardTitle>
            <PermissionGuard permissionKey={PermissionKeys.CanCreateReconciliationSessions}>
              <Button asChild>
                <Link to="/reconciliation/sessions/new">Create session</Link>
              </Button>
            </PermissionGuard>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <Input
                placeholder="Search sessions"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="md:col-span-2"
              />
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="0">Draft</SelectItem>
                  <SelectItem value="1">Confirmed</SelectItem>
                  <SelectItem value="2">Posted</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={branchId}
                onValueChange={(value) => {
                  setBranchId(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Cashier</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Counted</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7}>Loading sessions...</TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{new Date(row.confirmationDate).toLocaleString()}</TableCell>
                      <TableCell>{row.branchName ?? '-'}</TableCell>
                      <TableCell>{row.cashierName ?? '-'}</TableCell>
                      <TableCell>{formatMoneyPsw(row.expectedCashPsw)}</TableCell>
                      <TableCell>{formatMoneyPsw(row.countedCashPsw)}</TableCell>
                      <TableCell>{formatMoneyPsw(row.overagePsw - row.shortagePsw)}</TableCell>
                      <TableCell>{statusLabel(row.status)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7}>No sessions found.</TableCell>
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
