import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@mobile/providers/auth-provider';
import { listReceivingStaff, type ReceivingStaffOption } from '../services';
import { resolveParcelExemptionType } from '@/shared/customers/customer-types';

export function useParcelChargeExemption(
  senderType: number | undefined,
  receiverType: number | undefined,
  destinationId: string,
  source: 'booking' | 'self-service' = 'booking',
) {
  const { withAuth, session } = useAuth();
  const exemptionType = resolveParcelExemptionType(senderType, receiverType);
  const [staff, setStaff] = useState<ReceivingStaffOption[]>([]);
  const [staffId, setStaffId] = useState('');
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  useEffect(() => {
    setStaff([]);
    setStaffId('');
    setFailed(false);
    setLoading(false);
    if (exemptionType !== 5 || !destinationId) return;
    let cancelled = false;
    setLoading(true);
    withAuth((token) => listReceivingStaff(token, destinationId, source))
      .then((rows) => {
        if (!cancelled) setStaff(rows);
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
  }, [source, attempt, destinationId, exemptionType, withAuth, session.user?.id]);
  return {
    exemptionType,
    relatedStaffId: staff.some((row) => row.id === staffId) ? staffId : '',
    setStaffId,
    options: staff.map((row) => ({
      value: row.id,
      label: `${row.fullname} (${row.employeeNumber})`,
    })),
    loading,
    failed,
    retry,
  };
}
