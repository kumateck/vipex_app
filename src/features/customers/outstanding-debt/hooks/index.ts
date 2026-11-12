import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { PAGE_STYLES } from '@/features/printing/constants/page-styles';
import { useRoutedDocumentPrint } from '@/features/printing/hooks/use-routed-document-print';
import { useAuthStore } from '@/stores/auth-store';
import { useGetOutstandingDebtQuery } from '../services';
import { OUTSTANDING_DEBT_TITLE } from '../utils';

export function useOutstandingDebt(customerId: string) {
  const companyName = useAuthStore((state) => state.user?.company?.name) ?? 'Vipex';
  const query = useGetOutstandingDebtQuery(customerId, { refetchOnMountOrArgChange: true });
  const printRef = useRef<HTMLDivElement>(null);
  const [printing, setPrinting] = useState(false);
  const print = useRoutedDocumentPrint({
    contentRef: printRef,
    documentTitle: OUTSTANDING_DEBT_TITLE,
    layout: 'report-a4',
    pageStyle: PAGE_STYLES['report-a4'],
  });
  const canPrint = Boolean(query.currentData) && !query.isFetching && !query.isError && !printing;

  async function printStatement() {
    if (!canPrint || !printRef.current) return;
    setPrinting(true);
    try {
      await print();
    } catch {
      toast.error('Could not print the outstanding debt statement');
    } finally {
      setPrinting(false);
    }
  }

  return { ...query, companyName, canPrint, printing, printRef, printStatement };
}
