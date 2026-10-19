import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
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
import {
  useApproveProcurementDemandMutation,
  useListProcurementDemandsQuery,
  useRejectProcurementDemandMutation,
} from '../../api/procurement.api';

function statusLabel(status: number) {
  if (status === 0) return 'Open';
  if (status === 1) return 'Consolidated';
  if (status === 2) return 'Converted';
  if (status === 3) return 'Cancelled';
  if (status === 4) return 'Approved';
  return 'Unknown';
}

export function ProcurementDemandsApprovalsPage() {
  const [page, setPage] = useState(1);
  const query = useMemo(() => ({ page, pageSize: 20 }), [page]);
  const { data, isLoading } = useListProcurementDemandsQuery(query);
  const [approveDemand, { isLoading: approving }] = useApproveProcurementDemandMutation();
  const [rejectDemand, { isLoading: rejecting }] = useRejectProcurementDemandMutation();
  const [reasonById, setReasonById] = useState<Record<string, string>>({});

  const rows = (data?.data ?? []).filter((row) => row.status === 0 || row.status === 1);
  const meta = data?.meta;

  const onApprove = async (id: string) => {
    try {
      await approveDemand({ id }).unwrap();
      toast.success('Demand approved');
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to approve demand');
    }
  };

  const onReject = async (id: string) => {
    const rejectionReason = reasonById[id]?.trim();
    if (!rejectionReason) {
      toast.error('Provide rejection reason');
      return;
    }
    try {
      await rejectDemand({ id, rejectionReason }).unwrap();
      toast.success('Demand rejected');
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to reject demand');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Demand Approvals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Demand</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reject Reason</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6}>Loading demands...</TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.demandNo}</TableCell>
                      <TableCell>
                        {row.itemCode} - {row.itemName}
                      </TableCell>
                      <TableCell>
                        {row.quantity} {row.unit}
                      </TableCell>
                      <TableCell>{statusLabel(row.status)}</TableCell>
                      <TableCell>
                        <Input
                          placeholder="Reason for rejection"
                          value={reasonById[row.id] ?? ''}
                          onChange={(event) =>
                            setReasonById((prev) => ({ ...prev, [row.id]: event.target.value }))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => onApprove(row.id)}
                            disabled={approving || rejecting}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => onReject(row.id)}
                            disabled={approving || rejecting}
                          >
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>No pending demand approvals.</TableCell>
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
