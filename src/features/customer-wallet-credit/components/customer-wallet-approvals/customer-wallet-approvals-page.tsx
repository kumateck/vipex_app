import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useBlockCustomerWalletAccountMutation,
  useListCustomerWalletApprovalsQuery,
  useUnblockCustomerWalletAccountMutation,
} from '../../api/customer-wallet-credit.api';

function formatMoneyPsw(amountPsw: number) {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountPsw / 100);
}

export function CustomerWalletApprovalsPage() {
  const [search, setSearch] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(true);
  const query = useMemo(
    () => ({
      page: 1,
      pageSize: 20,
      search: search.trim() || undefined,
      filters: { overdueOnly },
    }),
    [search, overdueOnly],
  );

  const { data, isLoading } = useListCustomerWalletApprovalsQuery(query);
  const rows = data?.data ?? [];
  const [blockAccount, { isLoading: isBlocking }] = useBlockCustomerWalletAccountMutation();
  const [unblockAccount, { isLoading: isUnblocking }] = useUnblockCustomerWalletAccountMutation();

  const onBlock = async (customerId: string) => {
    try {
      await blockAccount({ customerId }).unwrap();
      toast.success('Customer credit blocked');
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to block customer credit');
    }
  };

  const onUnblock = async (customerId: string) => {
    try {
      await unblockAccount({ customerId }).unwrap();
      toast.success('Customer credit enabled');
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to enable customer credit');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Wallet / Credit Approvals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="Search customer"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <Button
                type="button"
                variant={overdueOnly ? 'default' : 'outline'}
                onClick={() => setOverdueOnly((value) => !value)}
              >
                {overdueOnly ? 'Overdue only: ON' : 'Overdue only: OFF'}
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Overdue days</TableHead>
                  <TableHead>Signal</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5}>Loading approvals...</TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.customerId}>
                      <TableCell>
                        <div className="font-medium">{row.fullname}</div>
                        <div className="text-xs text-muted-foreground">{row.telephone ?? '-'}</div>
                      </TableCell>
                      <TableCell>{formatMoneyPsw(row.outstandingPsw)}</TableCell>
                      <TableCell>{row.overdueDays}</TableCell>
                      <TableCell>{row.approvalStatus.replaceAll('_', ' ')}</TableCell>
                      <TableCell className="text-right">
                        {row.approvalStatus === 'BLOCK_RECOMMENDED' ? (
                          <Button
                            disabled={isBlocking || isUnblocking}
                            onClick={() => onBlock(row.customerId)}
                          >
                            Block credit
                          </Button>
                        ) : row.approvalStatus === 'UNBLOCK_RECOMMENDED' ? (
                          <Button
                            variant="outline"
                            disabled={isBlocking || isUnblocking}
                            onClick={() => onUnblock(row.customerId)}
                          >
                            Enable credit
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">No action</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5}>No approval items found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
