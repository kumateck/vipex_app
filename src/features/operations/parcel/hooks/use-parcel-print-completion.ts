import { useCallback, useState } from 'react';

export function useParcelPrintCompletion(onComplete?: () => void) {
  const [hasPrinted, setHasPrinted] = useState(false);
  const onAutoPrintComplete = useCallback(() => {
    setHasPrinted(true);
    onComplete?.();
  }, [onComplete]);
  return { hasPrinted, onAutoPrintComplete };
}
