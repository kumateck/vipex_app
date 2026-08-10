import { useCallback, type RefObject } from 'react';
import { toast } from 'sonner';
import { PAGE_STYLES } from '@/features/printing/constants/page-styles';
import { printViaDesktop } from '@/features/printing/services/desktop-print';
import { createPrintableHtmlDocument } from '@/features/printing/services/html-document';
import { getPrinterPreferenceMapping } from '@/features/printing/services/printer-preferences';

type UseParcelDesktopInvoicePrintParams = {
  bookingCode: string;
  canPrintViaDesktop: boolean;
  invoiceRef: RefObject<HTMLDivElement | null>;
};

export function useParcelDesktopInvoicePrint({
  bookingCode,
  canPrintViaDesktop,
  invoiceRef,
}: UseParcelDesktopInvoicePrintParams) {
  return useCallback(async () => {
    if (!canPrintViaDesktop) return false;

    const invoiceNode = invoiceRef.current;
    if (!invoiceNode) return false;

    const { invoicePrinter } = getPrinterPreferenceMapping();
    const result = await printViaDesktop({
      html: createPrintableHtmlDocument({
        title: `invoice-${bookingCode}`,
        pageStyle: PAGE_STYLES['invoice-a5-receipt'],
        bodyHtml: invoiceNode.outerHTML,
      }),
      layout: 'invoice-a5-receipt',
      title: `invoice-${bookingCode}`,
      silent: Boolean(invoicePrinter),
      deviceName: invoicePrinter,
    });

    if (!result.ok) {
      toast.error(result.reason ?? 'Failed to print parcel receipt');
    }

    return result.ok;
  }, [bookingCode, canPrintViaDesktop, invoiceRef]);
}
