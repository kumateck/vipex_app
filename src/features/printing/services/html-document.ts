import { receiptLayoutFromHtml } from '@/shared/printing/receipt-paper';
import { PAGE_STYLES } from '../constants/page-styles';

export function createPrintableHtmlDocument(input: {
  title: string;
  bodyHtml: string;
  pageStyle?: string;
}) {
  const { title, bodyHtml } = input;
  const receiptLayout = receiptLayoutFromHtml(bodyHtml);
  const pageStyle = receiptLayout ? PAGE_STYLES[receiptLayout] : input.pageStyle;

  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      ${pageStyle ?? ''}
    </style>
  </head>
  <body>
    ${bodyHtml}
  </body>
</html>`;
}
