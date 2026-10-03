import { useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { BranchType } from '@/db/schemas/enums';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { PAGE_STYLES } from '@/features/printing/constants/page-styles';
import { useRoutedDocumentPrint } from '@/features/printing/hooks/use-routed-document-print';
import { useAuthStore } from '@/stores/auth-store';
import { useLazyGetDailyParcelAuditReportQuery } from '../services/daily-parcel-audit.api';
import type {
  DailyParcelAuditStatus,
  DailyParcelAuditView,
  DailyParcelDeliveryStatus,
} from '../types/daily-parcel-audit.types';
import {
  exportDailyParcelAuditCsv,
  filterDailyParcelAuditRows,
  summarizeDailyParcelAudit,
} from '../utils/daily-parcel-audit.utils';

export function useDailyParcelAudit() {
  const user = useAuthStore((state) => state.user);
  const printRef = useRef<HTMLDivElement>(null);
  const isHeadOffice = user?.branch?.type === BranchType.HEADOFFICE;
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [selectedBranchId, setSelectedBranchId] = useState('__all__');
  const [view, setView] = useState<DailyParcelAuditView>('receiver');
  const [paymentStatus, setPaymentStatus] = useState<DailyParcelAuditStatus>('all');
  const [deliveryStatus, setDeliveryStatus] = useState<DailyParcelDeliveryStatus>('all');
  const [trigger, result] = useLazyGetDailyParcelAuditReportQuery();
  const { data: branches = [] } = useListBranchOptionsQuery(
    user?.company?.id ? { companyId: user.company.id } : undefined,
    { skip: !user?.company?.id || !isHeadOffice },
  );
  const branchId = isHeadOffice
    ? selectedBranchId === '__all__'
      ? null
      : selectedBranchId
    : (user?.branch?.id ?? null);
  const rows = useMemo(
    () => filterDailyParcelAuditRows(result.data?.rows ?? [], view, paymentStatus, deliveryStatus),
    [result.data?.rows, view, paymentStatus, deliveryStatus],
  );
  const totals = useMemo(() => summarizeDailyParcelAudit(rows), [rows]);
  const branchName = result.data?.filters.branchId
    ? (branches.find((branch) => branch.id === result.data?.filters.branchId)?.name ??
      user?.branch?.name ??
      'Selected branch')
    : 'All branches';
  const print = useRoutedDocumentPrint({
    contentRef: printRef,
    documentTitle: 'Daily Parcel Audit',
    layout: 'report-a4',
    pageStyle: PAGE_STYLES['report-a4'],
  });

  function load() {
    if (!date || (!isHeadOffice && !branchId)) return;
    void trigger({ date, branchId });
  }

  function downloadCsv() {
    if (!result.data) return;
    const csv = exportDailyParcelAuditCsv(rows);
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `daily-parcel-audit-${result.data.filters.date}-${view}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return {
    user,
    date,
    setDate,
    selectedBranchId,
    setSelectedBranchId,
    isHeadOffice,
    branches,
    view,
    setView,
    paymentStatus,
    setPaymentStatus,
    deliveryStatus,
    setDeliveryStatus,
    report: result.data,
    rows,
    totals,
    branchName,
    isFetching: result.isFetching,
    isError: result.isError,
    printRef,
    load,
    print,
    downloadCsv,
    canLoad: Boolean(date && (isHeadOffice || branchId)),
  };
}
