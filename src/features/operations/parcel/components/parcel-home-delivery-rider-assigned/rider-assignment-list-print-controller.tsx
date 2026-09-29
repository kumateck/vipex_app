import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useRoutedDocumentPrint } from '@/features/printing/hooks/use-routed-document-print';
import { RiderAssignmentListDocument } from './rider-assignment-list-document';
import type { RiderAssignmentListPrintPayload } from './use-rider-assignment-list-print';

const PAGE_STYLE = `
  @page { size: A4 portrait; margin: 10mm; }
  @media print {
    body { margin: 0; color: #111; font-family: Arial, Helvetica, sans-serif; }
    .rider-assignment-list-sheet h1 { margin: 0 0 6mm; font-size: 17px; }
    .rider-assignment-list-meta { display: flex; flex-wrap: wrap; gap: 3mm 9mm; margin-bottom: 6mm; font-size: 10px; }
    .rider-assignment-list-sheet table { width: 100%; border-collapse: collapse; font-size: 9px; }
    .rider-assignment-list-sheet th, .rider-assignment-list-sheet td { border: 1px solid #bbb; padding: 4px; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
    .rider-assignment-list-sheet th { background: #eee; }
    .rider-assignment-list-sheet thead { display: table-header-group; }
    .rider-assignment-list-sheet tfoot { display: table-row-group; }
    .rider-assignment-list-sheet tr { break-inside: avoid; }
  }
`;

export function RiderAssignmentListPrintController({
  payload,
  onComplete,
}: {
  payload: RiderAssignmentListPrintPayload;
  onComplete: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const print = useRoutedDocumentPrint({
    contentRef,
    documentTitle: `rider-assigned-parcels-${payload.riderName.replace(/[^a-z0-9]+/gi, '-')}`,
    layout: 'report-a4',
    pageStyle: PAGE_STYLE,
    onAfterPrint: onComplete,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void print().catch(() => {
        toast.error('Failed to print rider assignment list');
        onComplete();
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [onComplete, print]);

  return (
    <div className="hidden">
      <div ref={contentRef}>
        <RiderAssignmentListDocument payload={payload} />
      </div>
    </div>
  );
}
