import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useEffect, useMemo, useState } from 'react';
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
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useApproveFleetFuelLogMutation,
  useListFleetFuelLogsQuery,
  useRejectFleetFuelLogMutation,
} from '../../api/fleet-transport.api';

export function FleetFuelLogsApprovalsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

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

  const { data, isLoading } = useListFleetFuelLogsQuery(query);
  const [approveLog, { isLoading: approving }] = useApproveFleetFuelLogMutation();
  const [rejectLog, { isLoading: rejecting }] = useRejectFleetFuelLogMutation();
  const rows = data?.data ?? [];

  const onApprove = async (id: string) => {
    try {
      await approveLog({ id }).unwrap();
      toast.success('Fuel log approved');
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to approve fuel log');
    }
  };

  const onReject = async (id: string) => {
    const reason = reasons[id]?.trim();
    if (!reason) {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      await rejectLog({ id, rejectionReason: reason }).unwrap();
      toast.success('Fuel log rejected');
      setReasons((prev) => ({ ...prev, [id]: '' }));
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to reject fuel log');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Fuel Log Approvals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search pending fuel logs"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Log No</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Liters</TableHead>
                  <TableHead>Fuel Cost</TableHead>
                  <TableHead>Reject reason</TableHead>
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
                      <TableCell>{row.logNo}</TableCell>
                      <TableCell>{row.vehiclePlateNumber ?? '-'}</TableCell>
                      <TableCell>{row.liters.toLocaleString()}</TableCell>
                      <TableCell>{row.fuelCostPsw.toLocaleString()}</TableCell>
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
                        <PermissionGuard permissionKey={PermissionKeys.CanApproveFleetFuelLog}>
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
                    <TableCell colSpan={6}>No submitted fuel logs pending approval.</TableCell>
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
