import { useEffect, useState } from 'react';
import {
  officesForPickupLocation,
  type ReceivingOfficeOption,
} from '@/shared/shipments/receiving-office';
import { useAuth } from '@mobile/providers/auth-provider';
import { listReceivingOfficeOptions } from '../services';

export function useReceivingOfficeChoice(input: {
  enabled: boolean;
  locationId?: string | null;
  allLocations?: boolean;
  initialOfficeId?: string | null;
}) {
  const { session, withAuth } = useAuth();
  const { enabled } = input;
  const branchId = session.user?.branch?.id ?? session.user?.branchId ?? undefined;
  const [selection, setOfficeId] = useState<string | undefined>();
  const [result, setResult] = useState<{
    branchId: string | undefined;
    offices: ReceivingOfficeOption[] | null;
  }>();

  useEffect(() => {
    if (!enabled) return;
    let current = true;
    void withAuth(listReceivingOfficeOptions).then(
      (offices) => {
        if (current) setResult({ branchId, offices });
      },
      () => {
        if (current) setResult({ branchId, offices: null });
      },
    );
    return () => {
      current = false;
    };
  }, [branchId, enabled, withAuth]);

  const loaded = result && result.branchId === branchId ? result : undefined;
  const offices = enabled ? (loaded?.offices ?? []) : [];
  const options = input.allLocations
    ? offices
    : officesForPickupLocation(offices, input.locationId);
  const officeId =
    options.find((office) => office.id === (selection ?? input.initialOfficeId))?.id ?? '';
  return {
    options,
    officeId,
    setOfficeId,
    isLoading: enabled && !loaded,
    isError: enabled && loaded?.offices === null,
  };
}
