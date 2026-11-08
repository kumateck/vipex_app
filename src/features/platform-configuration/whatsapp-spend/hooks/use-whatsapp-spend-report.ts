import { useCallback, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import { useGetWhatsAppSpendQuery } from '../services';
import { presetRange, rangeToParams, type SpendPreset } from '../utils';

export function useWhatsAppSpendReport() {
  const [range, setRange] = useState<DateRange | undefined>(() => presetRange('this-month'));
  const canManageBilling = useAuthStore((state) =>
    (state.user?.permissions ?? []).includes(PermissionKeys.CanManageCompanyModules),
  );
  const params = useMemo(() => rangeToParams(range), [range]);
  const query = useGetWhatsAppSpendQuery(params ?? { from: '', to: '' }, { skip: !params });
  const applyPreset = useCallback((preset: SpendPreset) => setRange(presetRange(preset)), []);

  return {
    range,
    setRange,
    applyPreset,
    report: params ? query.data : undefined,
    isLoading: query.isLoading || query.isFetching,
    error: query.error,
    refetch: query.refetch,
    canManageBilling,
  };
}
