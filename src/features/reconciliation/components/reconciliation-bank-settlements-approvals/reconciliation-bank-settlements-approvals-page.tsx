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
  useApproveBankSettlementMutation,
  useListBankSettlementsQuery,
  useRejectBankSettlementMutation,
} from '../../api/reconciliation.api';

function formatMoneyPsw(amountPsw: number) {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountPsw / 100);
}

export function ReconciliationBankSettlementsApprovalsPage() {
  const [search, setSearch] = useState('');
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const query = useMemo(
    () => ({
      page: 1,
      pageSize: 20,
      search: search.trim() || undefined,
      filters: { pendingOnly: true },
    }),
    [search],
  );

  const { data, isLoading } = useListBankSettlementsQuery(query);
  const [approveSettlement, { isLoading: isApproving }] = useApproveBankSettlementMutation();
  const [rejectSettlement, { isLoading: isRejecting }] = useRejectBankSettlementMutation();
  const rows = data?.data ?? [];

  const onApprove = async (id: string) => {
    try {
      await approveSettlement({ id }).unwrap();
      toast.success('Bank settlement approved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve bank settlement');
    }
  };

  const onReject = async (id: string) => {
    const reason = reasons[id]?.trim();
    if (!reason) {
      toast.error('Rejection reason is required');
      return;
    }
    try {
      await rejectSettlement({ id, rejectionReason: reason }).unwrap();
      toast.success('Bank settlement rejected');
      setReasons((prev) => ({ ...prev, [id]: '' }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reject bank settlement');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Bank Settlement Approvals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search pending bank settlements"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Settlement No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Banked</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>Reject reason</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8}>Loading approvals...</TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.settlementNo}</TableCell>
                      <TableCell>{new Date(row.settlementDate).toLocaleString()}</TableCell>
                      <TableCell>{row.branchName ?? '-'}</TableCell>
                      <TableCell>{formatMoneyPsw(row.expectedAmountPsw)}</TableCell>
                      <TableCell>{formatMoneyPsw(row.bankedAmountPsw)}</TableCell>
                      <TableCell>{formatMoneyPsw(row.variancePsw)}</TableCell>
                      <TableCell>
                        <Input
                          placeholder="Reason (for reject)"
                          value={reasons[row.id] ?? ''}
                          onChange={(event) =>
                            setReasons((prev) => ({ ...prev, [row.id]: event.target.value }))
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            disabled={isApproving || isRejecting}
                            onClick={() => onReject(row.id)}
                          >
                            Reject
                          </Button>
                          <Button
                            disabled={isApproving || isRejecting}
                            onClick={() => onApprove(row.id)}
                          >
                            Approve
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8}>No bank settlements pending approval.</TableCell>
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
