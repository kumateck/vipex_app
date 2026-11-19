import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import type { BatchHandoverWorkflow } from '@/shared/shipments/parcel-batch-handover';
import {
  useConfirmBatchHandoverMutation,
  useRequestBatchOtpMutation,
  useSearchBatchParcelsMutation,
  useVerifyBatchOtpMutation,
} from '../../services';
import { useBatchHandover } from '../shared';
import { useBatchMobileSignature } from './use-batch-mobile-signature';

export function useWebBatchHandover(workflow: BatchHandoverWorkflow) {
  const [search] = useSearchBatchParcelsMutation();
  const [request] = useRequestBatchOtpMutation();
  const [verify] = useVerifyBatchOtpMutation();
  const [confirm] = useConfirmBatchHandoverMutation();
  const flow = useBatchHandover({
    search: (params) => search({ workflow, ...params }).unwrap(),
    requestOtp: (body) => request({ workflow, ...body }).unwrap(),
    verifyOtp: (body) => verify({ workflow, ...body }).unwrap(),
    confirm: (body) => confirm({ workflow, ...body }).unwrap(),
    errorMessage: getErrorMessage,
  });
  const mobileSignature = useBatchMobileSignature(workflow, flow);
  return { ...flow, busy: flow.busy || mobileSignature.busy, mobileSignature };
}
