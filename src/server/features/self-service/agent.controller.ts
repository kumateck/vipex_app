import type { AuthUser } from '@/server/plugins/auth';
import {
  cancelSelfServiceDraftSvc,
  claimSelfServiceDraftSvc,
  completeSelfServiceDraftSvc,
  getSelfServiceDraftSvc,
  listSelfServiceDraftsSvc,
  type CompleteSelfServiceDraftInput,
} from './drafts.service';

export const listSelfServiceDraftsCtrl = (agentUser: AuthUser) =>
  listSelfServiceDraftsSvc(agentUser);

export const getSelfServiceDraftCtrl = (id: string, agentUser: AuthUser) =>
  getSelfServiceDraftSvc(id, agentUser);

export const claimSelfServiceDraftCtrl = (id: string, agentUser: AuthUser) =>
  claimSelfServiceDraftSvc(id, agentUser);

export const completeSelfServiceDraftCtrl = (
  id: string,
  input: CompleteSelfServiceDraftInput,
  agentUser: AuthUser,
) => completeSelfServiceDraftSvc(id, input, agentUser);

export const cancelSelfServiceDraftCtrl = (id: string, reason: string, agentUser: AuthUser) =>
  cancelSelfServiceDraftSvc(id, reason, agentUser);
