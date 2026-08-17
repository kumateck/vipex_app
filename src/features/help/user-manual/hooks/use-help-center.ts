import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HELP_GUIDES } from '../services';

export function useHelpCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedGuideId = searchParams.get('guide');
  const selectedGuide =
    HELP_GUIDES.find((guide) => guide.id === selectedGuideId) ?? HELP_GUIDES[0] ?? null;

  const selectGuide = useCallback(
    (guideId: string) => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('guide', guideId);
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  return { selectedGuide, selectGuide };
}

export type HelpCenterState = ReturnType<typeof useHelpCenter>;
