import { useCallback, type RefObject } from 'react';
import type { PrintLayout } from '../types';
import { createPrintableHtmlDocument } from '../services/html-document';
import { getPrintRuntime, printViaDesktop } from '../services/desktop-print';
import { useManagedReactPrint } from './use-managed-react-print';

type UseRoutedDocumentPrintOptions = {
  contentRef: RefObject<Element | null>;
  documentTitle: string;
  layout: Exclude<PrintLayout, 'thermal-sticker'>;
  pageStyle: string;
  onAfterPrint?: () => void;
};

export function useRoutedDocumentPrint({
  contentRef,
  documentTitle,
  layout,
  pageStyle,
  onAfterPrint,
}: UseRoutedDocumentPrintOptions) {
  const printInBrowser = useManagedReactPrint({
    contentRef,
    documentTitle,
    pageStyle,
    onAfterPrint,
  });

  return useCallback(async () => {
    const content = contentRef.current;
    if (getPrintRuntime() === 'desktop' && content instanceof HTMLElement) {
      const result = await printViaDesktop({
        html: createPrintableHtmlDocument({
          title: documentTitle,
          pageStyle,
          bodyHtml: content.outerHTML,
        }),
        layout,
        title: documentTitle,
      });
      if (result.ok) {
        onAfterPrint?.();
        return;
      }
    }

    await printInBrowser();
  }, [contentRef, documentTitle, layout, onAfterPrint, pageStyle, printInBrowser]);
}
