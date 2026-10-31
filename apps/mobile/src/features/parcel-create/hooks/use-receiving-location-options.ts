import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@mobile/providers/auth-provider';
import type { LocationOption } from '@mobile/types/booking';
import { listReceivingLocations } from '../services';

type Result = { scope: string; options: LocationOption[]; status: 'loading' | 'ready' | 'failed' };
const EMPTY_OPTIONS: LocationOption[] = [];
export function useReceivingLocationOptions(
  companyId: string | null | undefined,
  branchId: string,
  enabled = true,
) {
  const { withAuth } = useAuth();
  const scope = enabled && companyId && branchId ? `${companyId}:${branchId}` : '';
  const [result, setResult] = useState<Result | null>(null);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    if (!scope || !companyId || !branchId) return;
    let cancelled = false;
    setResult({ scope, options: [], status: 'loading' });
    withAuth((token) => listReceivingLocations(token, { companyId, branchId }))
      .then((options) => {
        if (!cancelled) setResult({ scope, options, status: 'ready' });
      })
      .catch(() => {
        if (!cancelled) setResult({ scope, options: [], status: 'failed' });
      });
    return () => {
      cancelled = true;
    };
  }, [scope, companyId, branchId, withAuth, reload]);
  const current = result?.scope === scope ? result : null;
  const retryLocations = useCallback(() => setReload((value) => value + 1), []);
  return {
    locationOptions: scope && current?.status === 'ready' ? current.options : EMPTY_OPTIONS,
    isLoadingLocations: Boolean(scope && (!current || current.status === 'loading')),
    locationsFailed: current?.status === 'failed',
    retryLocations,
  };
}
