import { mobileApiGet, mobileApiPost } from '@mobile/lib/api';
import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import type { BatchHandoverApi } from '@/features/operations/parcel-batch-handover/types';
import type { BatchHandoverWorkflow } from '@/shared/shipments/parcel-batch-handover';

type WithAuth = <T>(run: (token: string) => Promise<T>) => Promise<T>;

export function mobileBatchHandoverApi(
  workflow: BatchHandoverWorkflow,
  withAuth: WithAuth,
): BatchHandoverApi {
  const path = `/payments/${workflow}-batch-handover`;
  return {
    search: (query) => withAuth((token) => mobileApiGet({ path, token, query })),
    requestOtp: (body) =>
      withAuth((token) => mobileApiPost({ path: `${path}/otp/request`, token, body })),
    verifyOtp: (body) =>
      withAuth((token) => mobileApiPost({ path: `${path}/otp/verify`, token, body })),
    confirm: (body) => withAuth((token) => mobileApiPost({ path: `${path}/confirm`, token, body })),
    errorMessage: getMobileErrorMessage,
  };
}
