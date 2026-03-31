import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useApprovePurchaseRequestMutation,
  useListPurchaseRequestsQuery,
  useRejectPurchaseRequestMutation,
} from '../api/procurement.api';

export function ProcurementRequestsApprovalsPage() {
  const [search, setSearch] = useState('');
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const query = useMemo(
    () => ({
      page: 1,
      pageSize: 100,
      search: search.trim() || undefined,
      filters: { pendingOnly: true },
    }),
    [search],
  );

  const { data, isLoading } = useListPurchaseRequestsQuery(query);
  const [approveRequest, { isLoading: approving }] = useApprovePurchaseRequestMutation();
  const [rejectRequest, { isLoading: rejecting }] = useRejectPurchaseRequestMutation();
  const rows = data?.data ?? [];

  const onApprove = async (id: string) => {
    try {
      await approveRequest({ id }).unwrap();
      toast.success('Request approved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve request');
    }
  };

  const onReject = async (id: string) => {
    const reason = reasons[id]?.trim();
    if (!reason) {
      toast.error('Rejection reason is required');
      return;
    }
    try {
      await rejectRequest({ id, rejectionReason: reason }).unwrap();
      toast.success('Request rejected');
      setReasons((prev) => ({ ...prev, [id]: '' }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reject request');
    }
  };

  return (
    <div className="w-full p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Purchase Request Approvals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search pending requests"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request no</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reject reason</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>Loading pending approvals...</TableCell>
                </TableRow>
              ) : rows.length ? (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.requestNo}</TableCell>
                    <TableCell>{row.title}</TableCell>
                    <TableCell>{row.amountPsw.toLocaleString()}</TableCell>
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
                      <PermissionGuard
                        permissionKey={PermissionKeys.CanApproveProcurementPurchaseRequests}
                      >
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            disabled={approving || rejecting}
                            onClick={() => onReject(row.id)}
                          >
                            Reject
                          </Button>
                          <Button
                            disabled={approving || rejecting}
                            onClick={() => onApprove(row.id)}
                          >
                            Approve
                          </Button>
                        </div>
                      </PermissionGuard>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5}>No submitted requests pending approval.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
