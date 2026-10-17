import { useMemo } from 'react';
import { useListCompanyModulesQuery } from '@/features/company-modules/api';

export const DIGITAL_RECEIPTS_MODULE_CODE = 'digital_receipts';

export function useDigitalReceiptsModule() {
  const { data: modules = [], isFetching } = useListCompanyModulesQuery();
  const isEnabled = useMemo(
    () =>
      modules.some((module) => module.code === DIGITAL_RECEIPTS_MODULE_CODE && module.isEnabled),
    [modules],
  );
  return { isDigitalReceiptsEnabled: isEnabled, isLoadingDigitalReceiptsModule: isFetching };
}
