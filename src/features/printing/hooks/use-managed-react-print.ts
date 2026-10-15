import type { RefObject } from 'react';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'sonner';
import { waitForPrintImages } from '@/shared/printing/wait-for-print-images';
import { PAGE_STYLES } from '../constants/page-styles';
import { useReceiptPaperFormat } from './use-receipt-paper-format';

type UseManagedReactPrintOptions = {
  contentRef: RefObject<Element | Text | null>;
  documentTitle: string;
  pageStyle: string;
  onAfterPrint?: () => void;
};

export function useManagedReactPrint(options: UseManagedReactPrintOptions) {
  const { contentRef, documentTitle, pageStyle, onAfterPrint } = options;
  const paper = useReceiptPaperFormat();
  const receiptStyle =
    pageStyle === PAGE_STYLES['invoice-a5-receipt'] && paper !== 'a5'
      ? PAGE_STYLES[paper === 'xprinter-58mm' ? 'receipt-58mm' : 'receipt-80mm']
      : pageStyle;

  return useReactToPrint({
    contentRef,
    documentTitle,
    pageStyle: receiptStyle,
    onBeforePrint: async () => {
      const content = contentRef.current;
      if (content instanceof Element) await waitForPrintImages(content);
    },
    onAfterPrint,
    onPrintError: (_location, error) =>
      toast.error(error.message || 'Print images could not be prepared'),
  });
}
