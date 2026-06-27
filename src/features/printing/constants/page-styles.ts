import type { PrintLayout } from '../types';

const BASE_STYLE = `
  @media print {
    html, body {
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`;

export const PAGE_STYLES: Record<PrintLayout, string> = {
  'thermal-sticker': `
    ${BASE_STYLE}
    @media print {
      @page {
        size: 100mm 150mm;
        margin: 0;
      }
      html,
      body {
        width: 100mm;
        height: 150mm;
        margin: 0;
        overflow: hidden;
      }
      body {
        display: grid;
        place-items: center;
      }
    }
  `,
  'invoice-a5': `
    ${BASE_STYLE}
    @media print {
      @page {
        size: A5 portrait;
        margin: 8mm;
      }
    }
  `,
  'invoice-a5-receipt': `
    ${BASE_STYLE}
    @media print {
      @page {
        size: A5 landscape;
        margin: 6mm;
      }
      html, body {
        width: 210mm;
        height: 148mm;
      }
      body {
        margin: 0;
      }
    }
  `,
  'report-a4': `
    ${BASE_STYLE}
    @media print {
      @page {
        size: A4 portrait;
        margin: 10mm;
      }
    }
  `,
};
