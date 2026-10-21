import { useEffect, useRef } from 'react';

type Props = {
  autoPrint: boolean;
  selection: 'sticker' | 'invoice' | 'both';
  loading: boolean;
  canPrintForSession: boolean;
  printSticker: () => void;
  printInvoice: () => void;
  printBoth: () => void;
  printParallel: () => Promise<boolean>;
};

export function useParcelAutoPrint({
  autoPrint,
  selection,
  loading,
  canPrintForSession,
  printSticker,
  printInvoice,
  printBoth,
  printParallel,
}: Props) {
  const hasAutoPrinted = useRef(false);
  useEffect(() => {
    if (!autoPrint || hasAutoPrinted.current || loading || !canPrintForSession) return;
    hasAutoPrinted.current = true;
    if (selection === 'sticker') {
      printSticker();
      return;
    }
    if (selection === 'invoice') {
      printInvoice();
      return;
    }
    void (async () => {
      if (!(await printParallel())) printBoth();
    })();
  }, [
    autoPrint,
    selection,
    loading,
    canPrintForSession,
    printSticker,
    printInvoice,
    printBoth,
    printParallel,
  ]);
}
