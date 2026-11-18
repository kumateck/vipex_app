import { useState } from 'react';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import type { BatchHandoverWorkflow } from '@/shared/shipments/parcel-batch-handover';
import {
  useCancelBatchSignatureMutation,
  useGetBatchSignatureQuery,
  useRequestBatchSignatureMutation,
} from '../../services';
import type { useBatchHandover } from '../shared';

export function useBatchMobileSignature(
  workflow: BatchHandoverWorkflow,
  flow: ReturnType<typeof useBatchHandover>,
) {
  const [error, setError] = useState('');
  const preparation = flow.signaturePreparation;
  const query = useGetBatchSignatureQuery(
    { workflow, id: preparation?.id ?? '' },
    {
      skip: !preparation || Boolean(flow.completedCount),
      pollingInterval: 4000,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    },
  );
  const [request, requesting] = useRequestBatchSignatureMutation();
  const [cancel, cancelling] = useCancelBatchSignatureMutation();
  const pending = requesting.isLoading || cancelling.isLoading;
  const status = query.currentData;

  return {
    status,
    busy: pending,
    checking: query.isFetching && query.currentData === undefined,
    error:
      error ||
      (query.isError ? 'Unable to check the mobile signature. Retry before confirming.' : ''),
    retry: () => void query.refetch(),
    request: async () => {
      if (!preparation || pending || flow.busy) return;
      setError('');
      try {
        await request({ workflow, ...preparation }).unwrap();
        flow.setSignature(undefined);
        await query.refetch().unwrap();
      } catch (failure) {
        setError(getErrorMessage(failure, 'Unable to request the mobile signature'));
      }
    },
    cancel: async () => {
      if (!status || !preparation || pending || flow.busy) return;
      setError('');
      try {
        await cancel({ workflow, id: preparation.id, requestId: status.requestId }).unwrap();
        await query.refetch().unwrap();
      } catch (failure) {
        setError(getErrorMessage(failure, 'Unable to cancel the mobile signature request'));
      }
    },
    confirm: () => {
      if (status?.signedAt && !query.isError && !pending) return flow.confirm(true);
    },
  };
}
