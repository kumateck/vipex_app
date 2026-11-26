import type { BatchHandoverWorkflow } from '@/shared/shipments/parcel-batch-handover';
import { useListBatchSignaturesQuery } from '../../services';

/** Pending multiple-parcel signature requests for one workflow at the active branch. */
export function useBatchSignatureRequests(workflow: BatchHandoverWorkflow, search: string) {
  const query = useListBatchSignaturesQuery(
    { search: search.trim() || undefined },
    { pollingInterval: 4000, refetchOnFocus: true, refetchOnMountOrArgChange: true },
  );
  const rows = query.currentData?.rows.filter((row) => row.workflow === workflow);
  return { rows, failed: query.isError, retry: query.refetch };
}
