import { useMemo, useState } from 'react';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import {
  type ParcelReconciliationCaseRow,
  useListParcelReconciliationCasesQuery,
} from '../../api/parcel.api';
import { ApproveReconciliationCaseDialog } from './approve-reconciliation-case-dialog';
import { EMPTY_META } from './constants';
import { CreateReconciliationCaseDialog } from './create-reconciliation-case-dialog';
import { ExecuteReconciliationCaseDialog } from './execute-reconciliation-case-dialog';
import { ParcelReconciliationTable } from './parcel-reconciliation-table';
import type { ParcelReconciliationQuery } from './types';

export function ParcelReconciliationCasesPage() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;

  const canRequest = (user?.permissions ?? []).includes(
    PermissionKeys.CanRequestParcelReconciliation,
  );
  const canApprove = (user?.permissions ?? []).includes(
    PermissionKeys.CanApproveParcelReconciliation,
  );
  const canExecute = (user?.permissions ?? []).includes(
    PermissionKeys.CanExecuteParcelReconciliation,
  );

  const serverFilters = useMemo(
    () => ({ companyId: companyId ?? undefined, branchId: branchId ?? undefined }),
    [branchId, companyId],
  );

  const [query, setQuery] = useState<ParcelReconciliationQuery>({
    page: 1,
    pageSize: 20,
    filters: serverFilters,
  });

  const { data, isLoading, refetch } = useListParcelReconciliationCasesQuery(query, {
    skip: !companyId,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [approvingCase, setApprovingCase] = useState<ParcelReconciliationCaseRow | null>(null);
  const [executingCase, setExecutingCase] = useState<ParcelReconciliationCaseRow | null>(null);

  return (
    <div className="w-full space-y-4 p-4">
      <ParcelReconciliationTable
        data={data?.data ?? []}
        meta={data?.meta ?? EMPTY_META}
        loading={isLoading}
        canRequest={canRequest}
        canApprove={canApprove}
        canExecute={canExecute}
        serverFilters={serverFilters}
        onRequestChange={setQuery}
        onCreateCase={() => setCreateOpen(true)}
        onApproveCase={setApprovingCase}
        onExecuteCase={setExecutingCase}
      />

      <CreateReconciliationCaseDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyId={companyId}
        branchId={branchId}
        onCreated={refetch}
      />

      <ApproveReconciliationCaseDialog
        reconciliationCase={approvingCase}
        onClose={() => setApprovingCase(null)}
        onApproved={refetch}
      />

      <ExecuteReconciliationCaseDialog
        reconciliationCase={executingCase}
        onClose={() => setExecutingCase(null)}
        onExecuted={refetch}
      />
    </div>
  );
}
