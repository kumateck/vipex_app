import { useAuth } from '@mobile/providers/auth-provider';
import { useBatchHandover } from '@/features/operations/parcel-batch-handover/hooks/shared';
import type { BatchHandoverWorkflow } from '@/shared/shipments/parcel-batch-handover';
import { mobileBatchHandoverApi } from '../services';

export function useMobileBatchHandover(workflow: BatchHandoverWorkflow, onConfirmed: () => void) {
  const { withAuth } = useAuth();
  return useBatchHandover(mobileBatchHandoverApi(workflow, withAuth), onConfirmed);
}
