import { useEffect, useRef, useState } from 'react';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useListLocationOptionsQuery } from '@/features/locations/api/locations.api';
import {
  useGetDailyCashierSalesReportQuery,
  useListDailyCashierSalesCashiersQuery,
} from '@/features/reporting/api/reporting.api';
import {
  PAGE_STYLES,
  createPrintableHtmlDocument,
  getPrintRuntime,
  printViaDesktop,
  useManagedReactPrint,
} from '@/features/printing';
import { BranchType } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import { CASHIER_TYPE_LABELS } from './daily-cashier-sales-constants';
import type {
  DailyCashierSalesFilterState,
  DailyCashierSalesReportTab,
} from './daily-cashier-sales-types';
import { todayDateInputValue } from './daily-cashier-sales-utils';

export function useDailyCashierSales() {
  const user = useAuthStore((state) => state.user);
  const printRef = useRef<HTMLDivElement>(null);
  const [date, setDate] = useState(() => todayDateInputValue());
  const [branchId, setBranchId] = useState('__all__');
  const [locationId, setLocationId] = useState('__all__');
  const [cashierType, setCashierType] = useState('__all__');
  const [cashierUserId, setCashierUserId] = useState('__all__');
  const [activeReportTab, setActiveReportTab] = useState<DailyCashierSalesReportTab>('payments');
  const [appliedReportTab, setAppliedReportTab] = useState<DailyCashierSalesReportTab | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<DailyCashierSalesFilterState | null>(null);

  const canSelectCashier = Boolean(user?.permissions.includes(PermissionKeys.CanReadAccounting));
  const isHeadOffice = user?.branch?.type === BranchType.HEADOFFICE;
  const userBranchId = user?.branch?.id ?? null;
  const userLocationId = user?.location?.id ?? user?.locationId ?? null;
  const companyId = user?.company?.id ?? null;

  useEffect(() => {
    if (!isHeadOffice && userBranchId) {
      setBranchId(userBranchId);
    }
  }, [isHeadOffice, userBranchId]);

  useEffect(() => {
    if (canSelectCashier) return;
    if (user?.cashierType !== null && user?.cashierType !== undefined) {
      setCashierType(String(user.cashierType));
    }
    if (userLocationId) {
      setLocationId(userLocationId);
    }
  }, [canSelectCashier, user?.cashierType, userLocationId]);

  const selectedBranchId = branchId !== '__all__' ? branchId : null;
  const selectedCashierType = cashierType !== '__all__' ? Number(cashierType) : null;
  const selectedCashierUserId = cashierUserId !== '__all__' ? cashierUserId : null;
  const effectiveCashierUserId = canSelectCashier ? selectedCashierUserId : (user?.id ?? null);
  const effectiveBranchId = isHeadOffice ? selectedBranchId : userBranchId;
  const selectedLocationId =
    effectiveBranchId && locationId !== '__all__'
      ? locationId
      : canSelectCashier
        ? null
        : userLocationId;

  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    companyId ? { companyId } : undefined,
    { skip: !companyId || !isHeadOffice },
  );

  useEffect(() => {
    if (effectiveBranchId) return;
    if (locationId !== '__all__') {
      setLocationId('__all__');
    }
  }, [effectiveBranchId, locationId]);

  const { currentData: locationOptions = [] } = useListLocationOptionsQuery(
    { branchId: effectiveBranchId, includeDeleted: false },
    { skip: !effectiveBranchId || !canSelectCashier },
  );

  useEffect(() => {
    setLocationId('__all__');
  }, [effectiveBranchId]);

  const draftFilters: DailyCashierSalesFilterState = {
    date,
    branchId: effectiveBranchId,
    locationId: selectedLocationId,
    cashierType: selectedCashierType,
    cashierUserId: effectiveCashierUserId,
  };

  const {
    data: report,
    isFetching,
    isUninitialized,
  } = useGetDailyCashierSalesReportQuery(appliedFilters ?? draftFilters, {
    skip: !companyId || !appliedFilters,
  });

  const { currentData: cashierOptions = [], isFetching: isCashierOptionsFetching } =
    useListDailyCashierSalesCashiersQuery(
      {
        date,
        branchId: effectiveBranchId,
        locationId: selectedLocationId,
        cashierType: selectedCashierType,
      },
      { skip: !companyId || !canSelectCashier },
    );

  useEffect(() => {
    if (!canSelectCashier) return;
    setCashierUserId('__all__');
  }, [canSelectCashier, date, selectedBranchId, selectedLocationId, selectedCashierType]);

  useEffect(() => {
    if (!canSelectCashier) return;
    if (isCashierOptionsFetching) return;
    if (cashierUserId === '__all__') return;
    if (cashierOptions.some((cashier) => cashier.id === cashierUserId)) return;
    setCashierUserId('__all__');
  }, [canSelectCashier, cashierOptions, cashierUserId, isCashierOptionsFetching]);

  useEffect(() => {
    setAppliedFilters((current) => {
      if (!current) return current;
      return current.branchId === effectiveBranchId
        ? current
        : { ...current, branchId: effectiveBranchId };
    });
  }, [effectiveBranchId]);

  const hasPendingFilterChanges =
    !appliedFilters ||
    draftFilters.date !== appliedFilters.date ||
    draftFilters.branchId !== appliedFilters.branchId ||
    draftFilters.locationId !== appliedFilters.locationId ||
    draftFilters.cashierType !== appliedFilters.cashierType ||
    draftFilters.cashierUserId !== appliedFilters.cashierUserId ||
    activeReportTab !== appliedReportTab;

  const hasRequiredFilters =
    Boolean(date) &&
    Boolean(companyId) &&
    (isHeadOffice || Boolean(draftFilters.branchId)) &&
    (canSelectCashier ||
      (draftFilters.cashierType !== null && Boolean(draftFilters.cashierUserId)));

  const activeFilters = appliedFilters ?? draftFilters;
  const filters = [
    { label: 'Session Open Date', value: activeFilters.date },
    {
      label: 'Branch',
      value: isHeadOffice
        ? (branchOptions.find((branch) => branch.id === activeFilters.branchId)?.name ??
          'All branches')
        : (user?.branch?.name ?? 'My branch'),
    },
    {
      label: 'Location',
      value:
        locationOptions.find((location) => location.id === activeFilters.locationId)?.name ??
        'All locations',
    },
    {
      label: 'Cashier Type',
      value:
        activeFilters.cashierType !== null
          ? (CASHIER_TYPE_LABELS[activeFilters.cashierType] ?? String(activeFilters.cashierType))
          : 'All cashier types',
    },
    {
      label: 'Cashier',
      value: canSelectCashier
        ? (cashierOptions.find((cashier) => cashier.id === activeFilters.cashierUserId)?.name ??
          'All cashiers')
        : (user?.fullname ?? 'My sales'),
    },
  ];

  const printReport = useManagedReactPrint({
    contentRef: printRef,
    documentTitle: `daily-cashier-sales-${activeReportTab}-${appliedFilters?.date ?? date}`,
    pageStyle: PAGE_STYLES['report-a4'],
  });

  const handlePrintReport = async () => {
    if (getPrintRuntime() === 'desktop' && printRef.current) {
      const html = createPrintableHtmlDocument({
        title: `daily-cashier-sales-${activeReportTab}-${appliedFilters?.date ?? date}`,
        bodyHtml: printRef.current.outerHTML,
        pageStyle: PAGE_STYLES['report-a4'],
      });
      const result = await printViaDesktop({
        html,
        layout: 'report-a4',
        title: `daily-cashier-sales-${activeReportTab}-${appliedFilters?.date ?? date}`,
      });
      if (result.ok) return;
    }

    void printReport();
  };

  return {
    user,
    date,
    setDate,
    branchId,
    setBranchId,
    locationId,
    setLocationId,
    cashierType,
    setCashierType,
    cashierUserId,
    setCashierUserId,
    activeReportTab,
    setActiveReportTab,
    canSelectCashier,
    isHeadOffice,
    effectiveBranchId,
    branchOptions,
    locationOptions,
    cashierOptions,
    isCashierOptionsFetching,
    report,
    isFetching,
    isUninitialized,
    filters,
    printRef,
    hasPendingFilterChanges,
    hasRequiredFilters,
    handleLoadReport: () => {
      if (!hasRequiredFilters) return;
      setAppliedFilters(draftFilters);
      setAppliedReportTab(activeReportTab);
    },
    handlePrintReport,
  };
}
