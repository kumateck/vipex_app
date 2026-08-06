import { useMemo } from 'react';
import { useListCompanyModulesQuery } from '@/features/company-modules/api';

export const STICKER_PRINT_MODULE_CODE = 'sticker_print';

export function useStickerPrintModule() {
  const { data: modules = [], isFetching } = useListCompanyModulesQuery();

  const stickerPrintModule = useMemo(
    () => modules.find((module) => module.code === STICKER_PRINT_MODULE_CODE) ?? null,
    [modules],
  );

  return {
    isStickerPrintEnabled: stickerPrintModule?.isEnabled ?? false,
    isLoadingStickerPrintModule: isFetching,
  };
}
