import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useListLocationOptionsQuery } from '@/features/locations/api/locations.api';
import { PrintableReportDocument } from '@/features/reporting/components/printable-report-document';
import { useGetDailyCashierSalesReportQuery } from '@/features/reporting/api/reporting.api';
import {
  PAGE_STYLES,
  createPrintableHtmlDocument,
  getPrintRuntime,
  printViaDesktop,
  useManagedReactPrint,
} from '@/features/printing';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import { BranchType, CashierType, PaymentMethod } from '@/db/schemas/enums';

function todayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function parseDateInputValue(value: string) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toDateInputValue(date?: Date) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatMoneyPsw(amountPsw?: number | null, currencyCode = 'GHS') {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amountPsw ?? 0) / 100);
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

const CASHIER_TYPE_LABELS: Record<number, string> = {
  [CashierType.SENDING]: 'Sender Cashier',
  [CashierType.TOBEPAID]: 'Receiver Cashier',
  [CashierType.DELIVERY]: 'Delivery Cashier',
};

const PAYMENT_METHOD_LABELS: Record<number, string> = {
  [PaymentMethod.CASH]: 'Cash',
  [PaymentMethod.MTN]: 'MTN Mobile Money',
  [PaymentMethod.TELECEL]: 'Telecel Cash',
  [PaymentMethod.AIRTEL]: 'AirtelTigo Cash',
  [PaymentMethod.CREDIT]: 'Credit',
};

type DailyCashierSalesFilters = {
  date: string;
  branchId: string | null;
  locationId: string | null;
  cashierType: number | null;
  cashierUserId: string | null;
};

export function DailyCashierSalesPage() {
  const user = useAuthStore((state) => state.user);
  const printRef = useRef<HTMLDivElement>(null);
  const [date, setDate] = useState(() => todayDateInputValue());
  const [branchId, setBranchId] = useState('__all__');
  const [locationId, setLocationId] = useState('__all__');
  const [cashierType, setCashierType] = useState('__all__');
  const [cashierUserId, setCashierUserId] = useState('__all__');

  const canSelectCashier = Boolean(user?.permissions.includes(PermissionKeys.CanReadAccounting));
  const isHeadOffice = user?.branch?.type === BranchType.HEADOFFICE;
  const userBranchId = user?.branch?.id ?? null;
  const companyId = user?.company?.id ?? null;

  useEffect(() => {
    if (!isHeadOffice && userBranchId) {
      setBranchId(userBranchId);
    }
  }, [isHeadOffice, userBranchId]);

  const selectedBranchId = branchId !== '__all__' ? branchId : null;
  const selectedCashierType = cashierType !== '__all__' ? Number(cashierType) : null;
  const selectedCashierUserId = cashierUserId !== '__all__' ? cashierUserId : null;
  const effectiveCashierUserId = canSelectCashier ? selectedCashierUserId : (user?.id ?? null);
  const effectiveBranchId = isHeadOffice ? selectedBranchId : userBranchId;
  const selectedLocationId = effectiveBranchId && locationId !== '__all__' ? locationId : null;
  const [appliedFilters, setAppliedFilters] = useState<DailyCashierSalesFilters | null>(null);

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

  const { data: locationOptions = [] } = useListLocationOptionsQuery(
    { branchId: effectiveBranchId, includeDeleted: false },
    { skip: !effectiveBranchId || !canSelectCashier },
  );

  const {
    data: report,
    isFetching,
    isUninitialized,
  } = useGetDailyCashierSalesReportQuery(
    appliedFilters ?? {
      date,
      branchId: effectiveBranchId,
      locationId: selectedLocationId,
      cashierType: selectedCashierType,
      cashierUserId: effectiveCashierUserId,
    },
    {
      skip: !companyId || !appliedFilters,
    },
  );

  const cashierOptions = useMemo(() => {
    const byCashier = new Map<string, { id: string; name: string }>();
    for (const transaction of report?.transactions ?? []) {
      if (!transaction.cashierId) continue;
      byCashier.set(transaction.cashierId, {
        id: transaction.cashierId,
        name: transaction.cashierName,
      });
    }
    return Array.from(byCashier.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [report?.transactions]);

  useEffect(() => {
    if (!canSelectCashier) return;
    setCashierUserId('__all__');
  }, [canSelectCashier, date, selectedBranchId, selectedLocationId, selectedCashierType]);

  useEffect(() => {
    if (!canSelectCashier) return;
    if (cashierUserId === '__all__') return;
    if (cashierOptions.some((cashier) => cashier.id === cashierUserId)) return;
    setCashierUserId('__all__');
  }, [canSelectCashier, cashierOptions, cashierUserId]);

  useEffect(() => {
    setAppliedFilters((current) => {
      if (!current) return current;
      return current.branchId === effectiveBranchId
        ? current
        : { ...current, branchId: effectiveBranchId };
    });
  }, [effectiveBranchId]);

  const draftFilters: DailyCashierSalesFilters = {
    date,
    branchId: effectiveBranchId,
    locationId: selectedLocationId,
    cashierType: selectedCashierType,
    cashierUserId: effectiveCashierUserId,
  };

  const hasPendingFilterChanges =
    !appliedFilters ||
    draftFilters.date !== appliedFilters.date ||
    draftFilters.branchId !== appliedFilters.branchId ||
    draftFilters.locationId !== appliedFilters.locationId ||
    draftFilters.cashierType !== appliedFilters.cashierType ||
    draftFilters.cashierUserId !== appliedFilters.cashierUserId;

  const handleLoadReport = () => {
    setAppliedFilters(draftFilters);
  };

  const activeFilters = appliedFilters ?? draftFilters;

  const filters = [
    { label: 'Date', value: activeFilters.date },
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
    documentTitle: `daily-cashier-sales-${appliedFilters?.date ?? date}`,
    pageStyle: PAGE_STYLES['report-a4'],
  });

  const handlePrintReport = async () => {
    if (getPrintRuntime() === 'desktop' && printRef.current) {
      const html = createPrintableHtmlDocument({
        title: `daily-cashier-sales-${appliedFilters?.date ?? date}`,
        bodyHtml: printRef.current.outerHTML,
        pageStyle: PAGE_STYLES['report-a4'],
      });
      const result = await printViaDesktop({
        html,
        layout: 'report-a4',
        title: `daily-cashier-sales-${appliedFilters?.date ?? date}`,
      });
      if (result.ok) return;
    }

    void printReport();
  };

  return (
    <div className="w-full space-y-4 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Daily Cashier Sales</h1>
          <p className="text-sm text-muted-foreground">
            Daily sales by session with sender, receiver, and delivery cashier breakdown.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleLoadReport} disabled={isFetching || !hasPendingFilterChanges}>
            Load report
          </Button>
          <Button
            onClick={() => void handlePrintReport()}
            disabled={!report || report.transactions.length === 0}
            variant="outline"
          >
            Print report
          </Button>
        </div>
      </div>

      <ScrollableWrapper>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Head office can select a branch or view consolidated results. Branch users are
                locked to their branch.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-5">
              <div className="space-y-2">
                <Label>Date</Label>
                <DatePicker
                  date={parseDateInputValue(date)}
                  onDateChange={(value) => setDate(toDateInputValue(value))}
                  placeholder="Select date"
                />
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                {isHeadOffice ? (
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All branches (consolidated)</SelectItem>
                      {branchOptions.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={user?.branch?.name ?? 'My branch'} disabled />
                )}
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Select
                  value={locationId}
                  onValueChange={setLocationId}
                  disabled={!canSelectCashier || !effectiveBranchId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All locations</SelectItem>
                    {locationOptions.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cashier Type</Label>
                <Select value={cashierType} onValueChange={setCashierType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All cashier types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All cashier types</SelectItem>
                    <SelectItem value={String(CashierType.SENDING)}>Sender cashier</SelectItem>
                    <SelectItem value={String(CashierType.TOBEPAID)}>Receiver cashier</SelectItem>
                    <SelectItem value={String(CashierType.DELIVERY)}>Delivery cashier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {canSelectCashier ? (
                <div className="space-y-2">
                  <Label>Cashier</Label>
                  <Select value={cashierUserId} onValueChange={setCashierUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All cashiers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All cashiers</SelectItem>
                      {cashierOptions.length === 0 ? (
                        <SelectItem value="__empty__" disabled>
                          Load report to list cashiers
                        </SelectItem>
                      ) : null}
                      {cashierOptions.map((cashier) => (
                        <SelectItem key={cashier.id} value={cashier.id}>
                          {cashier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Cashier</Label>
                  <Input value={user?.fullname ?? 'My sales'} disabled />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Sessions</CardDescription>
                <CardTitle>{report?.totals.sessions ?? 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Transactions</CardDescription>
                <CardTitle>{report?.totals.transactions ?? 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Gross Sales</CardDescription>
                <CardTitle>{formatMoneyPsw(report?.totals.grossPsw ?? 0)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Sender Sales</CardDescription>
                <CardTitle>{formatMoneyPsw(report?.cashierTypeTotals.senderPsw ?? 0)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Receiver Sales</CardDescription>
                <CardTitle>{formatMoneyPsw(report?.cashierTypeTotals.receiverPsw ?? 0)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Delivery Sales</CardDescription>
                <CardTitle>{formatMoneyPsw(report?.cashierTypeTotals.deliveryPsw ?? 0)}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Cash</CardDescription>
                <CardTitle>{formatMoneyPsw(report?.paymentModeTotals.cashPsw ?? 0)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>MTN</CardDescription>
                <CardTitle>{formatMoneyPsw(report?.paymentModeTotals.mtnPsw ?? 0)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Telecel</CardDescription>
                <CardTitle>{formatMoneyPsw(report?.paymentModeTotals.telecelPsw ?? 0)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>AirtelTigo</CardDescription>
                <CardTitle>{formatMoneyPsw(report?.paymentModeTotals.airtelPsw ?? 0)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Credit</CardDescription>
                <CardTitle>{formatMoneyPsw(report?.paymentModeTotals.creditPsw ?? 0)}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>Ordered by payment timestamp.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment Time</TableHead>
                    <TableHead>Cashier Type</TableHead>
                    <TableHead>Cashier</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Booking</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isFetching ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : isUninitialized ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        Select filters and click Load report.
                      </TableCell>
                    </TableRow>
                  ) : (report?.transactions.length ?? 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        No sales found for the selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    report?.transactions.map((row) => (
                      <TableRow key={row.paymentId}>
                        <TableCell>{formatDateTime(row.receivedAt)}</TableCell>
                        <TableCell>
                          {CASHIER_TYPE_LABELS[row.cashierType] ?? String(row.cashierType)}
                        </TableCell>
                        <TableCell>{row.cashierName}</TableCell>
                        <TableCell>{row.locationName ?? '-'}</TableCell>
                        <TableCell>{row.trackingCode}</TableCell>
                        <TableCell>{row.bookingCode}</TableCell>
                        <TableCell>
                          {PAYMENT_METHOD_LABELS[row.method] ?? String(row.method)}
                        </TableCell>
                        <TableCell>{row.receiptNo ?? '-'}</TableCell>
                        <TableCell className="text-right">
                          {formatMoneyPsw(row.grossAmountPsw)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </ScrollableWrapper>

      <div className="hidden">
        <PrintableReportDocument
          ref={printRef}
          companyName={user?.company?.name ?? 'Company'}
          title="Daily Cashier Sales Report"
          subtitle="Sender, receiver, and delivery cashier sales with payment mode breakdown."
          generatedAt={report?.generatedAt ?? new Date().toISOString()}
          filters={filters}
          sections={[
            {
              heading: 'Payment Mode Summary',
              headers: ['Mode', 'Amount'],
              rows: [
                ['Cash', formatMoneyPsw(report?.paymentModeTotals.cashPsw ?? 0)],
                ['MTN', formatMoneyPsw(report?.paymentModeTotals.mtnPsw ?? 0)],
                ['Telecel', formatMoneyPsw(report?.paymentModeTotals.telecelPsw ?? 0)],
                ['AirtelTigo', formatMoneyPsw(report?.paymentModeTotals.airtelPsw ?? 0)],
                ['Credit', formatMoneyPsw(report?.paymentModeTotals.creditPsw ?? 0)],
              ],
            },
            {
              heading: 'Cashier Type Summary',
              headers: ['Cashier Type', 'Amount'],
              rows: [
                ['Sender', formatMoneyPsw(report?.cashierTypeTotals.senderPsw ?? 0)],
                ['Receiver', formatMoneyPsw(report?.cashierTypeTotals.receiverPsw ?? 0)],
                ['Delivery', formatMoneyPsw(report?.cashierTypeTotals.deliveryPsw ?? 0)],
              ],
            },
            {
              heading: 'Transactions',
              headers: [
                'Payment Time',
                'Cashier Type',
                'Cashier',
                'Location',
                'Tracking',
                'Booking',
                'Method',
                'Receipt',
                'Gross',
              ],
              rows:
                report?.transactions.map((row) => [
                  formatDateTime(row.receivedAt),
                  CASHIER_TYPE_LABELS[row.cashierType] ?? String(row.cashierType),
                  row.cashierName,
                  row.locationName ?? '-',
                  row.trackingCode,
                  row.bookingCode,
                  PAYMENT_METHOD_LABELS[row.method] ?? String(row.method),
                  row.receiptNo ?? '-',
                  formatMoneyPsw(row.grossAmountPsw),
                ]) ?? [],
            },
          ]}
        />
      </div>
    </div>
  );
}
