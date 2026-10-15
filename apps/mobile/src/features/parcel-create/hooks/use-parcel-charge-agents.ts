import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@mobile/providers/auth-provider';
import {
  listParcelChargeAgents,
  type ChargeAgentSource,
  type MobileChargeAgentOption,
} from '../services';

export function useParcelChargeAgents(source: ChargeAgentSource, enabled: boolean) {
  const { session, withAuth } = useAuth();
  const userId = session.user?.id;
  const companyId = session.user?.company?.id ?? session.user?.companyId;
  const branchId = session.user?.branch?.id ?? session.user?.branchId;
  const [agents, setAgents] = useState<MobileChargeAgentOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    setAgents([]);
    setFailed(false);
    if (!enabled || !companyId || !branchId) return;
    let cancelled = false;
    setLoading(true);
    withAuth((token) => listParcelChargeAgents(token, source))
      .then((options) => {
        if (!cancelled) setAgents(options);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt, source, enabled, userId, companyId, branchId, withAuth]);

  const options = useMemo(
    () => agents.map((agent) => ({ value: agent.id, label: agent.fullname })),
    [agents],
  );
  return { options, loading, failed, retry };
}
