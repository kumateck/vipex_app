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
} from '@/components/ui/select';
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
import { useListCustomerWalletAccountsQuery } from '../../api/customer-wallet-credit.api';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

function formatMoneyPsw(amountPsw: number) {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountPsw / 100);
}

export function CustomerWalletAccountsListPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [creditFilter, setCreditFilter] = useState<'all' | 'enabled' | 'blocked'>('all');
  const [overdueOnly, setOverdueOnly] = useState(false);

  const query = useMemo(
    () => ({
      page,
      pageSize: 20,
      search: search.trim() || undefined,
      filters: {
        creditEligible:
          creditFilter === 'all' ? undefined : creditFilter === 'enabled' ? true : false,
        overdueOnly,
      },
    }),
    [page, search, creditFilter, overdueOnly],
  );

  const { data, isLoading } = useListCustomerWalletAccountsQuery(query);
  const rows = data?.data ?? [];
  const meta = data?.meta;

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Wallet / Credit Accounts</CardTitle>
            <PermissionGuard permissionKey={PermissionKeys.CanCreateCustomerWalletCreditPayments}>
              <Button asChild>
                <Link to="/customer-wallet-credit/payments/new">Record payment</Link>
              </Button>
            </PermissionGuard>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <Input
                placeholder="Search customer"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="md:col-span-2"
              />

              <Select
                value={creditFilter}
                onValueChange={(value: 'all' | 'enabled' | 'blocked') => {
                  setCreditFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Credit status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All credit status</SelectItem>
                  <SelectItem value="enabled">Credit enabled</SelectItem>
                  <SelectItem value="blocked">Credit blocked</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={overdueOnly ? 'yes' : 'no'}
                onValueChange={(value: 'yes' | 'no') => {
                  setOverdueOnly(value === 'yes');
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Overdue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">All accounts</SelectItem>
                  <SelectItem value="yes">Overdue only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Credit status</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Overdue (days)</TableHead>
                  <TableHead>Open items</TableHead>
                  <TableHead>Approval signal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7}>Loading accounts...</TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.customerId}>
                      <TableCell>
                        <div className="font-medium">{row.fullname}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.telephone ?? '-'} {row.email ? `• ${row.email}` : ''}
                        </div>
                      </TableCell>
                      <TableCell>{row.creditEligible ? 'Enabled' : 'Blocked'}</TableCell>
                      <TableCell>{formatMoneyPsw(row.outstandingPsw)}</TableCell>
                      <TableCell>{formatMoneyPsw(row.balancePsw)}</TableCell>
                      <TableCell>{row.overdueDays}</TableCell>
                      <TableCell>{row.openItemsCount}</TableCell>
                      <TableCell>{row.approvalStatus.replaceAll('_', ' ')}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7}>No accounts matched your filters.</TableCell>
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
