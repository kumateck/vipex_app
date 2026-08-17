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
import { ApprovalStatus, PayrollItemType } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';
import {
  useApprovePayrollManualAdjustmentMutation,
  useListPayrollManualAdjustmentsQuery,
  useRejectPayrollManualAdjustmentMutation,
} from '../../api/payroll.api';
import { approvalStatusLabel, formatMoneyPsw } from './payroll-input-utils';

type Props = {
  payrollCycleId: string;
  onAdd: () => void;
};

export function ManualAdjustmentsCard({ payrollCycleId, onAdd }: Props) {
  const { data: entries = [], isLoading } = useListPayrollManualAdjustmentsQuery(payrollCycleId, {
    skip: !payrollCycleId,
  });
  const authUser = useAuthStore((state) => state.user as AuthUser | null);
  const currentEmployeeId = authUser?.employeeId ?? null;
  const permissions = new Set(authUser?.permissions ?? []);
  const [approve, { isLoading: isApproving }] = useApprovePayrollManualAdjustmentMutation();
  const [reject, { isLoading: isRejecting }] = useRejectPayrollManualAdjustmentMutation();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manual Adjustments</CardTitle>
        <Button size="sm" disabled={!payrollCycleId} onClick={onAdd}>
          Add adjustment
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Taxable</TableHead>
              <TableHead>Approval</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!payrollCycleId ? (
              <TableRow>
                <TableCell colSpan={8}>
                  Select a payroll cycle to view manual adjustments.
                </TableCell>
              </TableRow>
            ) : isLoading ? (
              <TableRow>
                <TableCell colSpan={8}>Loading manual adjustments...</TableCell>
              </TableRow>
            ) : entries.length ? (
              entries.map((entry) => {
                const isDeduction = entry.itemType === PayrollItemType.DEDUCTION;
                const canApprove =
                  entry.approvalStatus === ApprovalStatus.PENDING &&
                  entry.supervisorEmployeeId === currentEmployeeId &&
                  permissions.has(PermissionKeys.CanApproveManagedPayrollInputs);
                return (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {entry.employeeName} ({entry.employeeNumber})
                    </TableCell>
                    <TableCell>{isDeduction ? 'Deduction' : 'Earning'}</TableCell>
                    <TableCell>
                      {entry.code} - {entry.name}
                    </TableCell>
                    <TableCell>{formatMoneyPsw(entry.amountPsw)}</TableCell>
                    <TableCell>{isDeduction ? 'No' : entry.isTaxable ? 'Yes' : 'No'}</TableCell>
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
                <TableCell colSpan={8}>No manual adjustments added for this cycle.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
