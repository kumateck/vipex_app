import { useCallback } from 'react';
import { toast } from 'sonner';

type InvoicePrintActionOptions = {
  canPrintForSession: boolean;
  canPrintInvoiceViaDesktop: boolean;
  missingPaidTax: boolean;
  onAutoPrintComplete?: () => void;
  printInvoice: () => void;
  printInvoiceViaDesktop: () => Promise<boolean>;
};

export function useParcelInvoicePrintAction({
  canPrintForSession,
  canPrintInvoiceViaDesktop,
  missingPaidTax,
  onAutoPrintComplete,
  printInvoice,
  printInvoiceViaDesktop,
}: InvoicePrintActionOptions) {
  return useCallback(() => {
    if (missingPaidTax) {
      toast.error('Tax breakdown is required to print a paid receipt');
      onAutoPrintComplete?.();
      return;
    }
    if (!canPrintForSession) {
      toast.error('Open a cashier session before printing receipts');
      return;
    }
    if (canPrintInvoiceViaDesktop) {
      void printInvoiceViaDesktop().then(() => onAutoPrintComplete?.());
      return;
    }
    void printInvoice();
  }, [
    canPrintForSession,
    canPrintInvoiceViaDesktop,
    missingPaidTax,
    onAutoPrintComplete,
    printInvoice,
    printInvoiceViaDesktop,
  ]);
}
