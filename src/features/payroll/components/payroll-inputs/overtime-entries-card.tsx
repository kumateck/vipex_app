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
import { ApprovalStatus } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';
import {
  useApprovePayrollOvertimeEntryMutation,
  useListPayrollOvertimeEntriesQuery,
  useRejectPayrollOvertimeEntryMutation,
} from '../../api/payroll.api';
import { approvalStatusLabel, formatMinutes, formatMoneyPsw } from './payroll-input-utils';

type Props = {
  payrollCycleId: string;
  onAdd: () => void;
};

export function OvertimeEntriesCard({ payrollCycleId, onAdd }: Props) {
  const { data: entries = [], isLoading } = useListPayrollOvertimeEntriesQuery(payrollCycleId, {
    skip: !payrollCycleId,
  });
  const authUser = useAuthStore((state) => state.user as AuthUser | null);
  const currentEmployeeId = authUser?.employeeId ?? null;
  const permissions = new Set(authUser?.permissions ?? []);
  const [approve, { isLoading: isApproving }] = useApprovePayrollOvertimeEntryMutation();
  const [reject, { isLoading: isRejecting }] = useRejectPayrollOvertimeEntryMutation();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Overtime Entries</CardTitle>
        <Button size="sm" disabled={!payrollCycleId} onClick={onAdd}>
          Add overtime
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Minutes</TableHead>
              <TableHead>Rate/hour</TableHead>
              <TableHead>Multiplier</TableHead>
              <TableHead>Approval</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!payrollCycleId ? (
              <TableRow>
                <TableCell colSpan={7}>Select a payroll cycle to view overtime entries.</TableCell>
              </TableRow>
            ) : isLoading ? (
              <TableRow>
                <TableCell colSpan={7}>Loading overtime entries...</TableCell>
              </TableRow>
            ) : entries.length ? (
              entries.map((entry) => {
                const canApprove =
                  entry.approvalStatus === ApprovalStatus.PENDING &&
                  entry.supervisorEmployeeId === currentEmployeeId &&
                  permissions.has(PermissionKeys.CanApproveManagedPayrollInputs);
                return (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {entry.employeeName} ({entry.employeeNumber})
                    </TableCell>
                    <TableCell>{formatMinutes(entry.overtimeMinutes)}</TableCell>
                    <TableCell>{formatMoneyPsw(entry.ratePerHourPsw)}</TableCell>
                    <TableCell>{entry.multiplierPct}%</TableCell>
                    <TableCell>
                      {approvalStatusLabel(
                        entry.approvalStatus,
                        Boolean(entry.supervisorEmployeeId),
                      )}
                    </TableCell>
                    <TableCell>{entry.notes ?? '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canApprove || isApproving}
                          onClick={() =>
                            void approve({ payrollCycleId, entryId: entry.id }).unwrap()
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canApprove || isRejecting}
                          onClick={() =>
                            void reject({
                              payrollCycleId,
                              entryId: entry.id,
                              reason: null,
                            }).unwrap()
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7}>No overtime entries added for this cycle.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
