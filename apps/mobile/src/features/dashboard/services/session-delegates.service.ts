import { mobileApiDelete, mobileApiGet, mobileApiPost } from '@mobile/lib/api';

export type SessionDelegateOption = { id: string; fullname: string; email: string };
export type SessionDelegate = {
  userId: string;
  fullname: string;
  email: string;
  assignedAt: string;
};
export type SessionDelegates = { eligible: SessionDelegateOption[]; assigned: SessionDelegate[] };

export function getSessionDelegates(token: string, sessionId: string) {
  return mobileApiGet<SessionDelegates>({
    path: `/cashiers/sessions/${sessionId}/delegates`,
    token,
  });
}

export function addSessionDelegate(token: string, sessionId: string, userId: string) {
  return mobileApiPost({
    path: `/cashiers/sessions/${sessionId}/delegates`,
    token,
    body: { userId },
  });
}

export function removeSessionDelegate(token: string, sessionId: string, userId: string) {
  return mobileApiDelete({ path: `/cashiers/sessions/${sessionId}/delegates/${userId}`, token });
}
