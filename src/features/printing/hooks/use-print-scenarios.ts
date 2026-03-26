import type { RefObject } from 'react';
import { PAGE_STYLES } from '../constants/page-styles';
import { useManagedReactPrint } from './use-managed-react-print';
import { getPrintRuntime } from '../services/desktop-print';

type UsePrintScenariosInput = {
  stickerRef: RefObject<Element | Text | null>;
  invoiceA5Ref: RefObject<Element | Text | null>;
  reportA4Ref: RefObject<Element | Text | null>;
  titleBase: string;
  onAfterInvoiceA5?: () => void;
};

export function usePrintScenarios(input: UsePrintScenariosInput) {
  const { stickerRef, invoiceA5Ref, reportA4Ref, titleBase, onAfterInvoiceA5 } = input;

  const printStickerThermal = useManagedReactPrint({
    contentRef: stickerRef,
    documentTitle: `${titleBase}-sticker`,
    pageStyle: PAGE_STYLES['thermal-sticker'],
  });

  const printInvoiceA5 = useManagedReactPrint({
    contentRef: invoiceA5Ref,
    documentTitle: `${titleBase}-invoice-a5`,
    pageStyle: PAGE_STYLES['invoice-a5'],
    onAfterPrint: onAfterInvoiceA5,
  });

  const printReportA4 = useManagedReactPrint({
    contentRef: reportA4Ref,
    documentTitle: `${titleBase}-report-a4`,
    pageStyle: PAGE_STYLES['report-a4'],
  });

  return {
    runtime: getPrintRuntime(),
    printStickerThermal,
    printInvoiceA5,
    printReportA4,
  };
}
