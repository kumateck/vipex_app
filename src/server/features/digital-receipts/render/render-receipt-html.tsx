import { renderToStaticMarkup } from 'react-dom/server';
import {
  HomeDeliveryReceiptA5Template,
  type HomeDeliveryReceiptA5Props,
} from '@/features/printing/components/templates/home-delivery-receipt-a5-template';
import { InvoiceA5Template } from '@/features/printing/components/templates/invoice-a5-template';
import type { InvoiceA5TemplateProps } from '@/features/printing/components/templates/invoice-a5-template.types';
import { PAGE_STYLES } from '@/features/printing/constants/page-styles';
import { createPrintableHtmlDocument } from '@/features/printing/services/html-document';

// The A5 templates are inline-styled; these are the only utility classes they
// use, normally supplied by the app's Tailwind build.
const TEMPLATE_UTILITY_CSS = `
  .bg-white { background-color: #fff; }
  .text-black { color: #000; }
  .self-center { align-self: center; }
  .self-start { align-self: flex-start; }
  .justify-self-center { justify-self: center; }
  .overflow-hidden { overflow: hidden; }
  @media screen {
    html, body { margin: 0; background: #fff; }
    /* Centre without flex so narrow screens scroll instead of clipping the left edge. */
    body { padding: 6mm; box-sizing: border-box; }
    body > * { margin: 0 auto; }
  }
`;

export type ReceiptDocument =
  | { template: 'invoice-a5'; props: InvoiceA5TemplateProps }
  | { template: 'home-delivery-a5'; props: HomeDeliveryReceiptA5Props };

/**
 * Renders the exact A5 template used for the printed copy into a standalone
 * HTML document (the receipt page shows it in a sandboxed frame).
 * Server rendering uses the A5 paper format: `useReceiptPaperFormat` returns
 * 'a5' as its server snapshot.
 */
export function renderReceiptHtml(document: ReceiptDocument, title: string) {
  const markup =
    document.template === 'invoice-a5'
      ? renderToStaticMarkup(<InvoiceA5Template {...document.props} />)
      : renderToStaticMarkup(<HomeDeliveryReceiptA5Template {...document.props} />);

  return createPrintableHtmlDocument({
    title,
    pageStyle: `${PAGE_STYLES['invoice-a5-receipt']}\n${TEMPLATE_UTILITY_CSS}`,
    bodyHtml: markup,
  });
}
