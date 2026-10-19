import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useAuthStore } from '@/stores/auth-store';
import {
  type ParcelDiscrepancyRow,
  useListOpenParcelDiscrepanciesQuery,
  useResolveParcelDiscrepancyMutation,
} from '../../api/parcel.api';
import { EMPTY_META } from './constants';
import { DiscrepancyDetailDialog } from './discrepancy-detail-dialog';
import { ParcelDiscrepanciesTable } from './parcel-discrepancies-table';
import { ResolveDiscrepancyDialog } from './resolve-discrepancy-dialog';

export function ParcelDiscrepanciesPage() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;

  const serverFilters = useMemo(
    () => ({ companyId: companyId ?? undefined, branchId: branchId ?? undefined }),
    [branchId, companyId],
  );

  const [query, setQuery] = useState<{
    page?: number;
    pageSize?: number;
    search?: string;
    sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
    filters?: { companyId?: string; branchId?: string | null };
  }>({
    page: 1,
    pageSize: 20,
    filters: serverFilters,
  });

  const { data, isLoading, refetch } = useListOpenParcelDiscrepanciesQuery(query, {
    skip: !companyId,
  });
  const [resolveDiscrepancy, { isLoading: isResolving }] = useResolveParcelDiscrepancyMutation();
  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    { companyId },
    { skip: !companyId },
  );

  const branchNameById = useMemo(
    () => new Map(branchOptions.map((branch) => [branch.id, branch.name])),
    [branchOptions],
  );

  const [resolvingRow, setResolvingRow] = useState<ParcelDiscrepancyRow | null>(null);
  const [viewingRow, setViewingRow] = useState<ParcelDiscrepancyRow | null>(null);

  const handleResolve = async (resolutionNote: string) => {
    if (!resolvingRow) return;

    try {
      await resolveDiscrepancy({
        id: resolvingRow.id,
        resolutionNote: resolutionNote.trim() || null,
      }).unwrap();
      toast.success('Discrepancy resolved');
      setResolvingRow(null);
      await refetch();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to resolve discrepancy');
    }
  };

  return (
    <div className="w-full space-y-4 p-4">
      <ParcelDiscrepanciesTable
        data={data?.data ?? []}
        meta={data?.meta ?? EMPTY_META}
        loading={isLoading}
        serverFilters={serverFilters}
        branchNameById={branchNameById}
        onRequestChange={setQuery}
        onResolve={setResolvingRow}
        onView={setViewingRow}
      />

      <DiscrepancyDetailDialog
        row={viewingRow}
        branchNameById={branchNameById}
        onClose={() => setViewingRow(null)}
      />

      <ResolveDiscrepancyDialog
        row={resolvingRow}
        isResolving={isResolving}
        onClose={() => setResolvingRow(null)}
        onResolve={handleResolve}
      />
    </div>
  );
}
