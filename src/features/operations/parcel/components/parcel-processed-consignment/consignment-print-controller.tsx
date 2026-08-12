import { useEffect, useRef } from 'react';
import { useRoutedDocumentPrint } from '@/features/printing/hooks/use-routed-document-print';
import {
  ConsignmentPrintDocument,
  type ConsignmentPrintPayload,
} from './consignment-print-document';

export type { ConsignmentPrintPayload };

const CONSIGNMENT_PAGE_STYLE = `
  @page { size: A4 portrait; margin: 8mm; }
  @media print {
    body { margin: 0; color: #111; font-family: Arial, Helvetica, sans-serif; }
    .consignment-print-sheet h1 {
      margin: 0 0 8px;
      font-size: 15px;
      font-weight: 700;
    }
    .consignment-print-sheet table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
      line-height: 1.15;
    }
    .consignment-print-sheet th,
    .consignment-print-sheet td {
      border: 1px solid #cfcfcf;
      padding: 3px 4px;
      text-align: left;
      vertical-align: top;
    }
    .consignment-print-sheet th {
      background: #595959 !important;
      color: #fff !important;
      font-weight: 700;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .consignment-print-sheet tbody tr:nth-child(even) td {
      background: #eeeeee !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .consignment-print-sheet th:nth-child(1),
    .consignment-print-sheet td:nth-child(1),
    .consignment-print-sheet th:nth-child(7),
    .consignment-print-sheet td:nth-child(7),
    .consignment-print-sheet th:nth-child(8),
    .consignment-print-sheet td:nth-child(8) {
      text-align: center;
      white-space: nowrap;
    }
  }
`;

export function ConsignmentPrintController({
  payload,
  onPrinted,
}: {
  payload: ConsignmentPrintPayload | null;
  onPrinted: () => void;
}) {
  const printRef = useRef<HTMLDivElement>(null);
  const printConsignment = useRoutedDocumentPrint({
    contentRef: printRef,
    documentTitle: payload ? `consignment-${payload.consignmentCode}` : 'consignment',
    layout: 'report-a4',
    pageStyle: CONSIGNMENT_PAGE_STYLE,
    onAfterPrint: onPrinted,
  });

  useEffect(() => {
    if (!payload) return;
    const timeoutId = window.setTimeout(() => {
      void printConsignment();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [payload, printConsignment]);

  return (
    <div className="hidden">
      <div ref={printRef}>
        <ConsignmentPrintDocument payload={payload} />
      </div>
    </div>
  );
}
