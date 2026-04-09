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
  useApproveReconciliationSessionMutation,
  useFinalizeReconciliationSessionMutation,
  useListReconciliationSessionsQuery,
} from '../../api/reconciliation.api';

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

export function ReconciliationSessionsApprovalsPage() {
  const [search, setSearch] = useState('');
  const query = useMemo(
    () => ({
      page: 1,
      pageSize: 20,
      search: search.trim() || undefined,
      filters: { pendingOnly: true },
    }),
    [search],
  );

  const { data, isLoading } = useListReconciliationSessionsQuery(query);
  const [approveSession, { isLoading: isApproving }] = useApproveReconciliationSessionMutation();
  const [finalizeSession, { isLoading: isFinalizing }] = useFinalizeReconciliationSessionMutation();
  const rows = data?.data ?? [];

  const onApprove = async (id: string) => {
    try {
      await approveSession({ id }).unwrap();
      toast.success('Session approved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve session');
    }
  };

  const onFinalize = async (id: string) => {
    try {
      await finalizeSession({ id }).unwrap();
      toast.success('Session finalized');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to finalize session');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Reconciliation Session Approvals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search pending sessions"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Counted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6}>Loading pending approvals...</TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{new Date(row.confirmationDate).toLocaleString()}</TableCell>
                      <TableCell>{row.branchName ?? '-'}</TableCell>
                      <TableCell>{formatMoneyPsw(row.expectedCashPsw)}</TableCell>
                      <TableCell>{formatMoneyPsw(row.countedCashPsw)}</TableCell>
                      <TableCell>{statusLabel(row.status)}</TableCell>
                      <TableCell className="text-right">
                        {row.status === 0 ? (
                          <Button
                            disabled={isApproving || isFinalizing}
                            onClick={() => onApprove(row.id)}
                          >
                            Approve
                          </Button>
                        ) : row.status === 1 ? (
                          <Button
                            variant="outline"
                            disabled={isApproving || isFinalizing}
                            onClick={() => onFinalize(row.id)}
                          >
                            Finalize
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">No action</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>No sessions pending approval.</TableCell>
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
