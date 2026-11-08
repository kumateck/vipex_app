import { useCallback } from 'react';
import { downloadCsv } from '@/features/dashboard/utils/export-csv';
import type { WhatsAppSpendReport } from '../types';
import { SPEND_CSV_HEADERS, buildSpendCsvRows, spendCsvFilename } from '../utils';

export function useSpendExport(report: WhatsAppSpendReport | undefined) {
  const exportCsv = useCallback(() => {
    if (!report) return;
    downloadCsv(spendCsvFilename(report), SPEND_CSV_HEADERS, buildSpendCsvRows(report));
  }, [report]);
  const print = useCallback(() => window.print(), []);
  return { exportCsv, print, canExport: Boolean(report) };
}
