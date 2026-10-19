import { useEffect } from 'react';
import { useGetSelfServiceBranchInfoQuery } from '../api/self-service-public.api';
import { useSelfServiceSession } from './use-self-service-session';
import { getSelfServiceSessionScreen } from '../utils';

function errorStatus(error: unknown): number | null {
  return error && typeof error === 'object' && 'status' in error && typeof error.status === 'number'
    ? error.status
    : null;
}

export function useSelfServiceBookingSession(branchId: string, isScanEntry: boolean) {
  const session = useSelfServiceSession(branchId, isScanEntry);
  const sessionToken = session.session?.sessionToken ?? '';
  const info = useGetSelfServiceBranchInfoQuery(
    { branchId, sessionToken },
    {
      skip: !branchId || !sessionToken || session.status === 'completed',
      // Always revalidate restored sessions with the server, never the phone clock or query cache.
      refetchOnMountOrArgChange: true,
    },
  );
  const isServerExpired =
    session.status === 'ready' &&
    !info.isFetching &&
    info.originalArgs?.sessionToken === sessionToken &&
    errorStatus(info.error) === 410;

  useEffect(() => {
    if (isServerExpired) session.markExpired();
  }, [isServerExpired, session.markExpired]);

  const branch = session.status === 'completed' ? session.session : info.currentData;
  const screen =
    session.status === 'completed' && branch
      ? null
      : getSelfServiceSessionScreen({
          branchId,
          status: session.status,
          serverExpired: isServerExpired,
          fetchingBranch: info.isFetching,
          hasBranch: Boolean(branch),
          branchError: info.isError,
        });

  return { ...session, sessionToken, branch, screen };
}
