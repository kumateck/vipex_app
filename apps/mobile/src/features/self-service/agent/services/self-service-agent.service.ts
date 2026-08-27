import { mobileApiGet, mobileApiPost } from '@mobile/lib/api';
import type {
  CompleteSelfServiceDraftInput,
  CompleteSelfServiceDraftResponse,
  SelfServiceDraft,
} from '../types/self-service-agent.types';

export const listSelfServiceDrafts = (token: string) =>
  mobileApiGet<SelfServiceDraft[]>({ path: '/self-service/drafts', token });

export const claimSelfServiceDraft = (token: string, id: string) =>
  mobileApiPost<SelfServiceDraft>({ path: `/self-service/drafts/${id}/claim`, token, body: {} });

export function completeSelfServiceDraft(token: string, input: CompleteSelfServiceDraftInput) {
  const { id, ...body } = input;
  return mobileApiPost<CompleteSelfServiceDraftResponse>({
    path: `/self-service/drafts/${id}/complete`,
    token,
    body,
  });
}
