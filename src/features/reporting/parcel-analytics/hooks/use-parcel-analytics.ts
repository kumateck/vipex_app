import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { BranchType } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import { useGetParcelAnalyticsQuery } from '../services';
import type { ParcelAnalyticsQuery, ParcelAnalyticsBasis } from '../types';
import { parcelAnalyticsCsv } from '../utils';

function initialRange(): DateRange {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 29);
  return { from, to };
}

export function useParcelAnalytics() {
  const user = useAuthStore((state) => state.user);
  const allowed = Boolean(
    user?.permissions.includes(PermissionKeys.CanViewReportParcelsStatusSummary),
  );
  const isHeadOffice = user?.branch?.type === BranchType.HEADOFFICE;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(initialRange);
  const [basis, setBasis] = useState<ParcelAnalyticsBasis>('source');
  const [branch, setBranch] = useState('all');
  const [origin, setOrigin] = useState('all');
  const [destination, setDestination] = useState('all');
  const [status, setStatus] = useState('all');
  const [applied, setApplied] = useState<ParcelAnalyticsQuery | null>(null);
  const [drilldown, setDrilldown] = useState<{ branchId?: string; status?: number } | null>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (drilldown) detailsRef.current?.scrollIntoView({ block: 'start' });
  }, [drilldown]);
  const from = range?.from ? format(range.from, 'yyyy-MM-dd') : '';
  const to = range?.to ? format(range.to, 'yyyy-MM-dd') : from;
  const rangeDays = range?.from
    ? ((range.to ?? range.from).getTime() - range.from.getTime()) / 86400000
    : -1;
  const canLoad =
    allowed &&
    Boolean(
      from &&
        to &&
        rangeDays >= 0 &&
        rangeDays < 366 &&
        user?.company?.id &&
        (isHeadOffice || user?.branch?.id),
    );
  const viewerKey = `${user?.id}:${user?.company?.id}:${user?.branch?.id}:${user?.branch?.type}`;
  const result = useGetParcelAnalyticsQuery(
    { ...applied!, viewerKey },
    {
      skip: !applied || !allowed || !user?.company?.id || (!isHeadOffice && !user?.branch?.id),
    },
  );
  const data = result.currentData;
  const options = data?.branchOptions ?? [];
  const scopeName = data?.filters.branchId
    ? (options.find((item) => item.id === data.filters.branchId)?.name ??
      user?.branch?.name ??
      'Selected branch')
    : 'All branches';
  const apply = useCallback(() => {
    if (!canLoad) return;
    setFiltersOpen(false);
    setDrilldown(null);
    const next: ParcelAnalyticsQuery = {
      from,
      to,
      basis,
      branchId: isHeadOffice ? (branch === 'all' ? undefined : branch) : user?.branch?.id,
      sourceId: origin === 'all' ? undefined : origin,
      destinationId: destination === 'all' ? undefined : destination,
      status: status === 'all' ? undefined : Number(status),
    };
    if (JSON.stringify(next) === JSON.stringify(applied)) void result.refetch();
    else setApplied(next);
  }, [
    canLoad,
    applied,
    result.refetch,
    from,
    to,
    basis,
    isHeadOffice,
    branch,
    user?.branch?.id,
    origin,
    destination,
    status,
  ]);
  const detailsQuery = useMemo(
    () => (applied && drilldown ? { ...applied, ...drilldown } : null),
    [applied, drilldown],
  );
  const exportCsv = useCallback(() => {
    if (!data) return;
    const url = URL.createObjectURL(
      new Blob(['\uFEFF', parcelAnalyticsCsv(data)], { type: 'text/csv;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `parcel-analytics-${data.filters.from}-${data.filters.to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [data]);
  return {
    allowed,
    filtersOpen,
    setFiltersOpen,
    isHeadOffice,
    range,
    setRange,
    basis,
    setBasis,
    branch,
    setBranch,
    origin,
    setOrigin,
    destination,
    setDestination,
    status,
    setStatus,
    canLoad,
    apply,
    data,
    options,
    scopeName,
    branchName: user?.branch?.name ?? 'My branch',
    isFetching: result.isFetching,
    isError: result.isError,
    applied,
    exportCsv,
    drilldown,
    setDrilldown,
    detailsQuery,
    detailsRef,
  };
}
