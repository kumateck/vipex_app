import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ApprovalStatus,
  AttendanceStatus,
  CashConfirmationStatus,
  EmploymentStatus,
  EmploymentType,
  ExpenseFundingSource,
  ExpenseRequestStatus,
  LeaveRequestStatus,
  ParcelStatus,
  PayrollItemType,
} from '@/db/schemas/enums';
import { useListBranchOptionsQuery } from '@/features/branches';
import { useGetCustomerStatementQuery, useListCustomersQuery } from '@/features/customers/api';
import { useListDepartmentOptionsQuery, useListEmployeesQuery } from '@/features/hr';
import { useListPayrollCyclesQuery } from '@/features/payroll';
import { useListUserOptionsQuery } from '@/features/users/api/users.api';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import {
  useGetAttendanceReportQuery,
  useGetBranchProfitabilityReportQuery,
  useGetCreditExposureReportQuery,
  useGetCustomerCreditAgingDetailReportQuery,
  useGetDailyCashConfirmationReportQuery,
  useGetDeliveryPerformanceReportQuery,
  useGetEmployeeMasterReportQuery,
  useGetExpenseByCategoryReportQuery,
  useGetLeaveRequestsReportQuery,
  useGetParcelStatusSummaryReportQuery,
  useGetPayrollAdjustmentsReportQuery,
  useGetPayrollJournalReconciliationReportQuery,
  useGetPayrollOvertimeReportQuery,
  useGetPayrollRegisterReportQuery,
  useGetShiftRevenueReportQuery,
  useGetToBePaidCollectionsReconciliationReportQuery,
  useGetToBePaidOutstandingReportQuery,
} from '../api/reporting.api';
import {
  PrintableReportDocument,
  type PrintableReportSection,
} from '../components/printable-report-document';
import type { DateRange } from 'react-day-picker';

export type ReportKey =
  | 'employees'
  | 'attendance'
  | 'leave'
  | 'payroll-register'
  | 'payroll-overtime'
  | 'payroll-adjustments'
  | 'payroll-journal-reconciliation'
  | 'customer-statement'
  | 'parcel-status'
  | 'delivery-performance'
  | 'shift-revenue'
  | 'branch-profitability'
  | 'credit-exposure'
  | 'customer-credit-aging-detail'
  | 'tobepaid-outstanding'
  | 'tobepaid-collections-reconciliation'
  | 'daily-cash-confirmations'
  | 'expense-by-category';

type SummaryItem = {
  label: string;
  value: string;
};

type CurrentReport = {
  title: string;
  description: string;
  generatedAt?: string;
  filters: Array<{ label: string; value: string }>;
  summary: SummaryItem[];
  sections: PrintableReportSection[];
  loading: boolean;
  emptyMessage: string;
  csvFilename: string;
};

const REPORT_LABELS: Record<ReportKey, string> = {
  employees: 'Employee Master',
  attendance: 'Attendance Register',
  leave: 'Leave Requests',
  'payroll-register': 'Payroll Register',
  'payroll-overtime': 'Payroll Overtime',
  'payroll-adjustments': 'Payroll Adjustments',
  'payroll-journal-reconciliation': 'Payroll Journal Reconciliation',
  'customer-statement': 'Customer Statement',
  'parcel-status': 'Parcel Status Summary',
  'delivery-performance': 'Delivery Performance',
  'shift-revenue': 'Shift Revenue',
  'branch-profitability': 'Branch Profitability',
  'credit-exposure': 'Credit Exposure',
  'customer-credit-aging-detail': 'Customer Credit Aging Detail',
  'tobepaid-outstanding': 'To-Be-Paid Outstanding',
  'tobepaid-collections-reconciliation': 'To-Be-Paid Collections Reconciliation',
  'daily-cash-confirmations': 'Daily Cash Confirmations',
  'expense-by-category': 'Expense by Category',
};

const CREDIT_AGING_BUCKET_LABELS: Record<string, string> = {
  current: 'Current',
  '1-30': '1-30 days',
  '31-60': '31-60 days',
  '61-90': '61-90 days',
  '91+': '91+ days',
};

const CASH_CONFIRMATION_STATUS_LABELS: Record<number, string> = {
  [CashConfirmationStatus.DRAFT]: 'Draft',
  [CashConfirmationStatus.CONFIRMED]: 'Confirmed',
  [CashConfirmationStatus.POSTED]: 'Posted',
};

const EXPENSE_REQUEST_STATUS_LABELS: Record<number, string> = {
  [ExpenseRequestStatus.RECORDED]: 'Recorded',
  [ExpenseRequestStatus.SUBMITTED]: 'Submitted',
  [ExpenseRequestStatus.APPROVED]: 'Approved',
  [ExpenseRequestStatus.REJECTED]: 'Rejected',
  [ExpenseRequestStatus.PAID]: 'Paid',
  [ExpenseRequestStatus.POSTED]: 'Posted',
};

const EXPENSE_FUNDING_SOURCE_LABELS: Record<number, string> = {
  [ExpenseFundingSource.PETTY_CASH]: 'Petty cash',
  [ExpenseFundingSource.SALES_CASH]: 'Sales cash',
  [ExpenseFundingSource.COMPANY_BANK]: 'Company bank',
};

const EMPLOYMENT_STATUS_LABELS: Record<number, string> = {
  [EmploymentStatus.ACTIVE]: 'Active',
  [EmploymentStatus.PROBATION]: 'Probation',
  [EmploymentStatus.SUSPENDED]: 'Suspended',
  [EmploymentStatus.RESIGNED]: 'Resigned',
  [EmploymentStatus.TERMINATED]: 'Terminated',
  [EmploymentStatus.INACTIVE]: 'Inactive',
};

const EMPLOYMENT_TYPE_LABELS: Record<number, string> = {
  [EmploymentType.FULL_TIME]: 'Full time',
  [EmploymentType.PART_TIME]: 'Part time',
  [EmploymentType.CONTRACT]: 'Contract',
  [EmploymentType.INTERN]: 'Intern',
  [EmploymentType.CASUAL]: 'Casual',
};

const ATTENDANCE_STATUS_LABELS: Record<number, string> = {
  [AttendanceStatus.PRESENT]: 'Present',
  [AttendanceStatus.ABSENT]: 'Absent',
  [AttendanceStatus.LATE]: 'Late',
  [AttendanceStatus.HALF_DAY]: 'Half day',
  [AttendanceStatus.LEAVE]: 'Leave',
  [AttendanceStatus.OFF_DAY]: 'Off day',
};

const LEAVE_STATUS_LABELS: Record<number, string> = {
  [LeaveRequestStatus.PENDING]: 'Pending',
  [LeaveRequestStatus.APPROVED]: 'Approved',
  [LeaveRequestStatus.REJECTED]: 'Rejected',
  [LeaveRequestStatus.CANCELLED]: 'Cancelled',
};

const APPROVAL_STATUS_LABELS: Record<number, string> = {
  [ApprovalStatus.PENDING]: 'Pending',
  [ApprovalStatus.APPROVED]: 'Approved',
  [ApprovalStatus.REJECTED]: 'Rejected',
};

const PARCEL_STATUS_LABELS: Record<number, string> = {
  [ParcelStatus.CREATED]: 'Created',
  [ParcelStatus.PROCESSED]: 'Processed',
  [ParcelStatus.IN_TRANSIT]: 'In transit',
  [ParcelStatus.ARRIVED_AT_DESTINATION]: 'Arrived at destination',
  [ParcelStatus.CUSTOMER_CONTACTED]: 'Customer contacted',
  [ParcelStatus.AWAITING_PICKUP]: 'Awaiting pickup',
  [ParcelStatus.DELIVERED_BY_OFFICE]: 'Delivered by office',
  [ParcelStatus.HOME_DELIVERY_REQUESTED]: 'Home delivery requested',
  [ParcelStatus.ADDRESS_COLLECTED]: 'Address collected',
  [ParcelStatus.DISPATCHED]: 'Dispatched',
  [ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER]: 'Rider gave parcel to customer',
  [ParcelStatus.DELIVERED_AT_HOME]: 'Delivered at home',
  [ParcelStatus.RETURNED_TO_OFFICE]: 'Returned to office',
  [ParcelStatus.RETURNED_TO_SENDER]: 'Returned to sender',
  [ParcelStatus.CANCELLED]: 'Cancelled',
};

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

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatMinutes(minutes?: number | null) {
  const total = Number(minutes ?? 0);
  if (!total) return '-';
  const hours = Math.floor(total / 60);
  const remainder = total % 60;
  return `${hours}h ${remainder}m`;
}

function toDateTimeRange(from: string, to: string) {
  return {
    dateFrom: `${from}T00:00:00.000`,
    dateTo: `${to}T23:59:59.999`,
  };
}

function escapeCsv(value: string | number) {
  const stringValue = String(value);
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r')
  ) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }
  return stringValue;
}

function downloadCsv(filename: string, section: PrintableReportSection) {
  if (typeof window === 'undefined') return;
  const csv = [section.headers, ...section.rows]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

function SummaryGrid({ items }: { items: SummaryItem[] }) {
  if (!items.length) return null;

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-3">
            <CardDescription>{item.label}</CardDescription>
            <CardTitle className="text-xl">{item.value}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

type ReportsPageProps = {
  initialReport?: ReportKey;
  standalone?: boolean;
};

type ReportLoadFilters = {
  reportKey: ReportKey;
  branchId: string | null;
  destinationBranchId: string | null;
  departmentId: string | null;
  employeeId: string | null;
  customerId: string | null;
  payrollCycleId: string | null;
  riderUserId: string | null;
  from: string;
  to: string;
  employeeStatus: number | null;
  leaveStatus: number | null;
  cashConfirmationStatus: number | null;
  expenseRequestStatus: number | null;
  creditAgingBucket: string | null;
  employeeSearch: string;
};

export function ReportsPage({ initialReport = 'employees', standalone = false }: ReportsPageProps) {
  const user = useAuthStore((state) => state.user);
  const printRef = useRef<HTMLDivElement>(null);

  const [activeReport, setActiveReport] = useState<ReportKey>(initialReport);
  const [branchId, setBranchId] = useState('__all__');
  const [destinationBranchId, setDestinationBranchId] = useState('__all__');
  const [departmentId, setDepartmentId] = useState('__all__');
  const [employeeId, setEmployeeId] = useState('__all__');
  const [customerId, setCustomerId] = useState('__all__');
  const [payrollCycleId, setPayrollCycleId] = useState('__all__');
  const [riderUserId, setRiderUserId] = useState('__all__');
  const [from, setFrom] = useState(() => todayDateInputValue());
  const [to, setTo] = useState(() => todayDateInputValue());
  const [employeeStatus, setEmployeeStatus] = useState('__all__');
  const [leaveStatus, setLeaveStatus] = useState('__all__');
  const [cashConfirmationStatus, setCashConfirmationStatus] = useState('__all__');
  const [expenseRequestStatus, setExpenseRequestStatus] = useState('__all__');
  const [creditAgingBucket, setCreditAgingBucket] = useState('__all__');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const reportDateRange: DateRange | undefined = {
    from: parseDateInputValue(from),
    to: parseDateInputValue(to),
  };

  const setReportDateRange = (value: DateRange | undefined) => {
    setFrom(toDateInputValue(value?.from));
    setTo(toDateInputValue(value?.to));
  };

  const companyName = user?.company?.name ?? 'Company';
  const permissions = user?.permissions ?? [];

  const canEmployees = permissions.includes(PermissionKeys.CanListEmployees);
  const canAttendance = permissions.includes(PermissionKeys.CanListAttendance);
  const canLeave = permissions.includes(PermissionKeys.CanListLeaveRequests);
  const canPayrollRegister = permissions.includes(PermissionKeys.CanReadPayrollRun);
  const canPayrollInputs = permissions.includes(PermissionKeys.CanReadPayrollInputs);
  const canPayrollJournalReconciliation =
    permissions.includes(PermissionKeys.CanReadPayrollRun) &&
    permissions.includes(PermissionKeys.CanReadAccounting);
  const canCustomers = permissions.includes(PermissionKeys.CanReadCustomers);
  const canParcels = permissions.includes(PermissionKeys.CanGetParcelStatusSummaryReport);
  const canShiftRevenue = permissions.includes(PermissionKeys.CanGetShiftRevenueReport);
  const canBranchProfitability = permissions.includes(
    PermissionKeys.CanGetBranchProfitabilityReport,
  );
  const canCreditExposure = permissions.includes(PermissionKeys.CanGetCreditExposureReport);
  const canToBePaidOutstanding = permissions.includes(
    PermissionKeys.CanGetOutstandingToBePaidReport,
  );
  const canAccountingReports = permissions.includes(PermissionKeys.CanReadAccounting);

  const allAvailableReports = useMemo(
    () =>
      [
        canEmployees ? 'employees' : null,
        canAttendance ? 'attendance' : null,
        canLeave ? 'leave' : null,
        canPayrollRegister ? 'payroll-register' : null,
        canPayrollInputs ? 'payroll-overtime' : null,
        canPayrollInputs ? 'payroll-adjustments' : null,
        canPayrollJournalReconciliation ? 'payroll-journal-reconciliation' : null,
        canCustomers ? 'customer-statement' : null,
        canParcels ? 'parcel-status' : null,
        canParcels ? 'delivery-performance' : null,
        canShiftRevenue ? 'shift-revenue' : null,
        canBranchProfitability ? 'branch-profitability' : null,
        canCreditExposure ? 'credit-exposure' : null,
        canCreditExposure ? 'customer-credit-aging-detail' : null,
        canToBePaidOutstanding ? 'tobepaid-outstanding' : null,
        canToBePaidOutstanding ? 'tobepaid-collections-reconciliation' : null,
        canAccountingReports ? 'daily-cash-confirmations' : null,
        canAccountingReports ? 'expense-by-category' : null,
      ].filter(Boolean) as ReportKey[],
    [
      canAccountingReports,
      canAttendance,
      canBranchProfitability,
      canCreditExposure,
      canCustomers,
      canEmployees,
      canLeave,
      canParcels,
      canPayrollJournalReconciliation,
      canPayrollInputs,
      canPayrollRegister,
      canShiftRevenue,
      canToBePaidOutstanding,
    ],
  );

  const availableReports = useMemo(
    () =>
      standalone
        ? allAvailableReports.filter((report) => report === initialReport)
        : allAvailableReports,
    [allAvailableReports, initialReport, standalone],
  );

  useEffect(() => {
    const nextReport = availableReports[0];
    if (!nextReport) return;
    if (!availableReports.includes(activeReport)) {
      setActiveReport(nextReport);
    }
  }, [activeReport, availableReports]);

  useEffect(() => {
    setActiveReport(initialReport);
  }, [initialReport]);

  const selectedBranchId = branchId !== '__all__' ? branchId : null;
  const selectedDestinationBranchId =
    destinationBranchId !== '__all__' ? destinationBranchId : null;
  const selectedDepartmentId = departmentId !== '__all__' ? departmentId : null;
  const selectedEmployeeId = employeeId !== '__all__' ? employeeId : null;
  const selectedCustomerId = customerId !== '__all__' ? customerId : null;
  const selectedPayrollCycleId = payrollCycleId !== '__all__' ? payrollCycleId : null;
  const selectedRiderUserId = riderUserId !== '__all__' ? riderUserId : null;
  const selectedEmployeeStatus = employeeStatus !== '__all__' ? Number(employeeStatus) : null;
  const selectedLeaveStatus = leaveStatus !== '__all__' ? Number(leaveStatus) : null;
  const selectedCashConfirmationStatus =
    cashConfirmationStatus !== '__all__' ? Number(cashConfirmationStatus) : null;
  const selectedExpenseRequestStatus =
    expenseRequestStatus !== '__all__' ? Number(expenseRequestStatus) : null;
  const selectedCreditAgingBucket = creditAgingBucket !== '__all__' ? creditAgingBucket : null;
  const [loadedFilters, setLoadedFilters] = useState<ReportLoadFilters | null>(null);

  const { data: branchOptions = [] } = useListBranchOptionsQuery();
  const { data: departmentOptions = [] } = useListDepartmentOptionsQuery();
  const { data: employeesData } = useListEmployeesQuery({ pageSize: 100 });
  const { data: payrollCyclesData } = useListPayrollCyclesQuery({ pageSize: 100 });
  const { data: customersData } = useListCustomersQuery({ pageSize: 100 });
  const { data: riderOptions = [] } = useListUserOptionsQuery({ status: 1 }, { skip: !canParcels });

  const employeeOptions = employeesData?.data ?? [];
  const payrollCycleOptions = payrollCyclesData?.data ?? [];
  const customerOptions = customersData?.data ?? [];

  const draftLoadFilters: ReportLoadFilters = {
    reportKey: activeReport,
    branchId: selectedBranchId,
    destinationBranchId: selectedDestinationBranchId,
    departmentId: selectedDepartmentId,
    employeeId: selectedEmployeeId,
    customerId: selectedCustomerId,
    payrollCycleId: selectedPayrollCycleId,
    riderUserId: selectedRiderUserId,
    from,
    to,
    employeeStatus: selectedEmployeeStatus,
    leaveStatus: selectedLeaveStatus,
    cashConfirmationStatus: selectedCashConfirmationStatus,
    expenseRequestStatus: selectedExpenseRequestStatus,
    creditAgingBucket: selectedCreditAgingBucket,
    employeeSearch: employeeSearch || '',
  };

  const isLoadedForActiveReport = loadedFilters?.reportKey === activeReport;
  const hasPendingFilterChanges = useMemo(() => {
    if (!isLoadedForActiveReport || !loadedFilters) return true;
    return (
      draftLoadFilters.branchId !== loadedFilters.branchId ||
      draftLoadFilters.destinationBranchId !== loadedFilters.destinationBranchId ||
      draftLoadFilters.departmentId !== loadedFilters.departmentId ||
      draftLoadFilters.employeeId !== loadedFilters.employeeId ||
      draftLoadFilters.customerId !== loadedFilters.customerId ||
      draftLoadFilters.payrollCycleId !== loadedFilters.payrollCycleId ||
      draftLoadFilters.riderUserId !== loadedFilters.riderUserId ||
      draftLoadFilters.from !== loadedFilters.from ||
      draftLoadFilters.to !== loadedFilters.to ||
      draftLoadFilters.employeeStatus !== loadedFilters.employeeStatus ||
      draftLoadFilters.leaveStatus !== loadedFilters.leaveStatus ||
      draftLoadFilters.cashConfirmationStatus !== loadedFilters.cashConfirmationStatus ||
      draftLoadFilters.expenseRequestStatus !== loadedFilters.expenseRequestStatus ||
      draftLoadFilters.creditAgingBucket !== loadedFilters.creditAgingBucket ||
      draftLoadFilters.employeeSearch !== loadedFilters.employeeSearch
    );
  }, [draftLoadFilters, isLoadedForActiveReport, loadedFilters]);

  const appliedFilters = isLoadedForActiveReport ? loadedFilters : null;

  const { data: employeeReport, isFetching: isEmployeeReportFetching } =
    useGetEmployeeMasterReportQuery(
      {
        branchId: appliedFilters?.branchId ?? null,
        departmentId: appliedFilters?.departmentId ?? null,
        status: appliedFilters?.employeeStatus ?? null,
        search: appliedFilters?.employeeSearch || null,
      },
      { skip: activeReport !== 'employees' || !canEmployees || !appliedFilters },
    );

  const { data: attendanceReport, isFetching: isAttendanceReportFetching } =
    useGetAttendanceReportQuery(
      {
        from: appliedFilters?.from ?? from,
        to: appliedFilters?.to ?? to,
        employeeId: appliedFilters?.employeeId ?? null,
        branchId: appliedFilters?.branchId ?? null,
      },
      { skip: activeReport !== 'attendance' || !canAttendance || !appliedFilters },
    );

  const { data: leaveReport, isFetching: isLeaveReportFetching } = useGetLeaveRequestsReportQuery(
    {
      from: appliedFilters?.from ?? from,
      to: appliedFilters?.to ?? to,
      employeeId: appliedFilters?.employeeId ?? null,
      status: appliedFilters?.leaveStatus ?? null,
    },
    { skip: activeReport !== 'leave' || !canLeave || !appliedFilters },
  );

  const { data: payrollRegisterReport, isFetching: isPayrollRegisterFetching } =
    useGetPayrollRegisterReportQuery(
      { payrollCycleId: appliedFilters?.payrollCycleId ?? '' },
      {
        skip:
          activeReport !== 'payroll-register' ||
          !canPayrollRegister ||
          !appliedFilters?.payrollCycleId,
      },
    );

  const { data: payrollOvertimeReport, isFetching: isPayrollOvertimeFetching } =
    useGetPayrollOvertimeReportQuery(
      { payrollCycleId: appliedFilters?.payrollCycleId ?? '' },
      {
        skip:
          activeReport !== 'payroll-overtime' ||
          !canPayrollInputs ||
          !appliedFilters?.payrollCycleId,
      },
    );

  const { data: payrollAdjustmentsReport, isFetching: isPayrollAdjustmentsFetching } =
    useGetPayrollAdjustmentsReportQuery(
      { payrollCycleId: appliedFilters?.payrollCycleId ?? '' },
      {
        skip:
          activeReport !== 'payroll-adjustments' ||
          !canPayrollInputs ||
          !appliedFilters?.payrollCycleId,
      },
    );

  const {
    data: payrollJournalReconciliationReport,
    isFetching: isPayrollJournalReconciliationFetching,
  } = useGetPayrollJournalReconciliationReportQuery(
    { payrollCycleId: appliedFilters?.payrollCycleId ?? '' },
    {
      skip:
        activeReport !== 'payroll-journal-reconciliation' ||
        !canPayrollJournalReconciliation ||
        !appliedFilters?.payrollCycleId,
    },
  );

  const { data: customerStatement, isFetching: isCustomerStatementFetching } =
    useGetCustomerStatementQuery(
      {
        customerId: appliedFilters?.customerId ?? '',
        ...toDateTimeRange(appliedFilters?.from ?? from, appliedFilters?.to ?? to),
      },
      {
        skip: activeReport !== 'customer-statement' || !canCustomers || !appliedFilters?.customerId,
      },
    );

  const { data: parcelStatusReport, isFetching: isParcelStatusFetching } =
    useGetParcelStatusSummaryReportQuery(
      {
        branchId: appliedFilters?.branchId ?? null,
        from: appliedFilters?.from ?? from,
        to: appliedFilters?.to ?? to,
      },
      { skip: activeReport !== 'parcel-status' || !canParcels || !appliedFilters },
    );

  const { data: deliveryPerformanceReport, isFetching: isDeliveryPerformanceFetching } =
    useGetDeliveryPerformanceReportQuery(
      {
        branchId: appliedFilters?.branchId ?? null,
        riderUserId: appliedFilters?.riderUserId ?? null,
        from: appliedFilters?.from ?? from,
        to: appliedFilters?.to ?? to,
      },
      { skip: activeReport !== 'delivery-performance' || !canParcels || !appliedFilters },
    );

  const { data: shiftRevenueReport, isFetching: isShiftRevenueFetching } =
    useGetShiftRevenueReportQuery(
      {
        branchId: appliedFilters?.branchId ?? null,
        from: appliedFilters?.from ?? from,
        to: appliedFilters?.to ?? to,
      },
      { skip: activeReport !== 'shift-revenue' || !canShiftRevenue || !appliedFilters },
    );

  const { data: branchProfitabilityReport, isFetching: isBranchProfitabilityFetching } =
    useGetBranchProfitabilityReportQuery(
      {
        branchId: appliedFilters?.branchId ?? null,
        from: appliedFilters?.from ?? from,
        to: appliedFilters?.to ?? to,
      },
      {
        skip: activeReport !== 'branch-profitability' || !canBranchProfitability || !appliedFilters,
      },
    );

  const { data: dailyCashConfirmationReport, isFetching: isDailyCashConfirmationFetching } =
    useGetDailyCashConfirmationReportQuery(
      {
        branchId: appliedFilters?.branchId ?? null,
        from: appliedFilters?.from ?? from,
        to: appliedFilters?.to ?? to,
        status: appliedFilters?.cashConfirmationStatus ?? null,
      },
      {
        skip:
          activeReport !== 'daily-cash-confirmations' || !canAccountingReports || !appliedFilters,
      },
    );

  const { data: expenseByCategoryReport, isFetching: isExpenseByCategoryFetching } =
    useGetExpenseByCategoryReportQuery(
      {
        branchId: appliedFilters?.branchId ?? null,
        from: appliedFilters?.from ?? from,
        to: appliedFilters?.to ?? to,
        status: appliedFilters?.expenseRequestStatus ?? null,
      },
      { skip: activeReport !== 'expense-by-category' || !canAccountingReports || !appliedFilters },
    );

  const { data: creditExposureReport, isFetching: isCreditExposureFetching } =
    useGetCreditExposureReportQuery(
      {
        agingBucket: appliedFilters?.creditAgingBucket ?? null,
      },
      { skip: activeReport !== 'credit-exposure' || !canCreditExposure || !appliedFilters },
    );

  const { data: customerCreditAgingDetailReport, isFetching: isCustomerCreditAgingDetailFetching } =
    useGetCustomerCreditAgingDetailReportQuery(
      {
        customerId: appliedFilters?.customerId ?? null,
        agingBucket: appliedFilters?.creditAgingBucket ?? null,
        from: appliedFilters?.from ?? from,
        to: appliedFilters?.to ?? to,
      },
      {
        skip:
          activeReport !== 'customer-credit-aging-detail' || !canCreditExposure || !appliedFilters,
      },
    );

  const { data: toBePaidOutstandingReport, isFetching: isToBePaidOutstandingFetching } =
    useGetToBePaidOutstandingReportQuery(
      {
        sourceBranchId: appliedFilters?.branchId ?? null,
        destinationBranchId: appliedFilters?.destinationBranchId ?? null,
        from: appliedFilters?.from ?? from,
        to: appliedFilters?.to ?? to,
      },
      {
        skip: activeReport !== 'tobepaid-outstanding' || !canToBePaidOutstanding || !appliedFilters,
      },
    );

  const {
    data: toBePaidCollectionsReconciliationReport,
    isFetching: isToBePaidCollectionsReconciliationFetching,
  } = useGetToBePaidCollectionsReconciliationReportQuery(
    {
      sourceBranchId: appliedFilters?.branchId ?? null,
      destinationBranchId: appliedFilters?.destinationBranchId ?? null,
      from: appliedFilters?.from ?? from,
      to: appliedFilters?.to ?? to,
    },
    {
      skip:
        activeReport !== 'tobepaid-collections-reconciliation' ||
        !canToBePaidOutstanding ||
        !appliedFilters,
    },
  );

  const currentReport = useMemo<CurrentReport>(() => {
    switch (activeReport) {
      case 'employees':
        return {
          title: 'Employee Master Report',
          description: 'A full employee listing with assignment and access details.',
          generatedAt: employeeReport?.generatedAt,
          filters: [
            {
              label: 'Branch',
              value:
                branchOptions.find((item) => item.id === selectedBranchId)?.name ?? 'All branches',
            },
            {
              label: 'Department',
              value:
                departmentOptions.find((item) => item.id === selectedDepartmentId)?.name ??
                'All departments',
            },
            {
              label: 'Status',
              value:
                selectedEmployeeStatus !== null
                  ? (EMPLOYMENT_STATUS_LABELS[selectedEmployeeStatus] ??
                    String(selectedEmployeeStatus))
                  : 'All statuses',
            },
          ],
          summary: [
            { label: 'Employees', value: String(employeeReport?.totals.employees ?? 0) },
            { label: 'Active', value: String(employeeReport?.totals.activeEmployees ?? 0) },
            {
              label: 'With user accounts',
              value: String(employeeReport?.totals.withUserAccounts ?? 0),
            },
          ],
          sections: [
            {
              heading: 'Employees',
              headers: [
                'Employee #',
                'Name',
                'Department',
                'Job Title',
                'Branch',
                'Status',
                'Type',
                'User Account',
              ],
              rows:
                employeeReport?.rows.map((row) => [
                  row.employeeNumber,
                  row.displayName,
                  row.departmentName ?? '-',
                  row.jobTitleName ?? '-',
                  row.branchName ?? '-',
                  EMPLOYMENT_STATUS_LABELS[row.employmentStatus] ?? String(row.employmentStatus),
                  EMPLOYMENT_TYPE_LABELS[row.employmentType] ?? String(row.employmentType),
                  row.hasUserAccount ? 'Yes' : 'No',
                ]) ?? [],
            },
          ],
          loading: isEmployeeReportFetching,
          emptyMessage: 'No employees matched the selected filters.',
          csvFilename: 'employee-master-report.csv',
        };
      case 'attendance':
        return {
          title: 'Attendance Register',
          description: 'Daily attendance records with worked-time detail.',
          generatedAt: attendanceReport?.generatedAt,
          filters: [
            { label: 'From', value: from },
            { label: 'To', value: to },
            {
              label: 'Employee',
              value:
                employeeOptions.find((item) => item.id === selectedEmployeeId)?.displayName ??
                'All employees',
            },
            {
              label: 'Branch',
              value:
                branchOptions.find((item) => item.id === selectedBranchId)?.name ?? 'All branches',
            },
          ],
          summary: [
            { label: 'Records', value: String(attendanceReport?.totals.records ?? 0) },
            {
              label: 'Worked time',
              value: formatMinutes(attendanceReport?.totals.workedMinutes ?? 0),
            },
            { label: 'Checked in', value: String(attendanceReport?.totals.checkedIn ?? 0) },
            { label: 'Checked out', value: String(attendanceReport?.totals.checkedOut ?? 0) },
          ],
          sections: [
            {
              heading: 'Attendance Detail',
              headers: [
                'Date',
                'Employee',
                'Branch',
                'Location',
                'Status',
                'Check in',
                'Check out',
                'Worked',
              ],
              rows:
                attendanceReport?.rows.map((row) => [
                  formatDate(row.attendanceDate),
                  row.employeeName ?? '-',
                  row.branchName ?? '-',
                  row.locationName ?? '-',
                  ATTENDANCE_STATUS_LABELS[row.status] ?? String(row.status),
                  formatDateTime(row.checkInAt),
                  formatDateTime(row.checkOutAt),
                  formatMinutes(row.minutesWorked),
                ]) ?? [],
            },
          ],
          loading: isAttendanceReportFetching,
          emptyMessage: 'No attendance records were found for the selected range.',
          csvFilename: 'attendance-report.csv',
        };
      case 'leave':
        return {
          title: 'Leave Requests Report',
          description: 'Leave activity, approval state, and paid/unpaid classification.',
          generatedAt: leaveReport?.generatedAt,
          filters: [
            { label: 'From', value: from },
            { label: 'To', value: to },
            {
              label: 'Employee',
              value:
                employeeOptions.find((item) => item.id === selectedEmployeeId)?.displayName ??
                'All employees',
            },
            {
              label: 'Status',
              value:
                selectedLeaveStatus !== null
                  ? (LEAVE_STATUS_LABELS[selectedLeaveStatus] ?? String(selectedLeaveStatus))
                  : 'All statuses',
            },
          ],
          summary: [
            { label: 'Requests', value: String(leaveReport?.totals.requests ?? 0) },
            {
              label: 'Days requested',
              value: String(leaveReport?.totals.daysRequested ?? 0),
            },
            { label: 'Approved', value: String(leaveReport?.totals.approved ?? 0) },
            { label: 'Pending', value: String(leaveReport?.totals.pending ?? 0) },
          ],
          sections: [
            {
              heading: 'Leave Requests',
              headers: [
                'Employee',
                'Leave Type',
                'Paid',
                'Date From',
                'Date To',
                'Days',
                'Manager',
                'Final Status',
              ],
              rows:
                leaveReport?.rows.map((row) => [
                  row.employeeName ?? '-',
                  row.leaveTypeName,
                  row.leaveTypeIsPaid ? 'Yes' : 'No',
                  formatDate(row.dateFrom),
                  formatDate(row.dateTo),
                  String(row.daysCount),
                  APPROVAL_STATUS_LABELS[row.managerApprovalStatus] ??
                    String(row.managerApprovalStatus),
                  LEAVE_STATUS_LABELS[row.status] ?? String(row.status),
                ]) ?? [],
            },
          ],
          loading: isLeaveReportFetching,
          emptyMessage: 'No leave requests matched the selected filters.',
          csvFilename: 'leave-requests-report.csv',
        };
      case 'payroll-register':
        return {
          title: 'Payroll Register',
          description: 'Gross-to-net payroll view for the latest run on the selected cycle.',
          generatedAt: payrollRegisterReport?.generatedAt,
          filters: [
            {
              label: 'Payroll cycle',
              value:
                payrollCycleOptions.find((item) => item.id === selectedPayrollCycleId)?.name ??
                'Select a cycle',
            },
          ],
          summary: [
            { label: 'Employees', value: String(payrollRegisterReport?.totals.employees ?? 0) },
            {
              label: 'Gross pay',
              value: formatMoneyPsw(payrollRegisterReport?.totals.grossPayPsw ?? 0),
            },
            {
              label: 'Deductions',
              value: formatMoneyPsw(payrollRegisterReport?.totals.totalDeductionsPsw ?? 0),
            },
            {
              label: 'Net pay',
              value: formatMoneyPsw(payrollRegisterReport?.totals.netPayPsw ?? 0),
            },
          ],
          sections: [
            {
              heading: 'Payroll Register',
              headers: [
                'Employee #',
                'Employee',
                'Branch',
                'Department',
                'Base Pay',
                'Gross Pay',
                'Deductions',
                'Net Pay',
              ],
              rows:
                payrollRegisterReport?.rows.map((row) => [
                  row.employeeNumber,
                  row.employeeName,
                  row.branchName ?? '-',
                  row.departmentName ?? '-',
                  formatMoneyPsw(row.basePayPsw, row.currencyCode),
                  formatMoneyPsw(row.grossPayPsw, row.currencyCode),
                  formatMoneyPsw(row.totalDeductionsPsw, row.currencyCode),
                  formatMoneyPsw(row.netPayPsw, row.currencyCode),
                ]) ?? [],
            },
          ],
          loading: isPayrollRegisterFetching,
          emptyMessage: selectedPayrollCycleId
            ? 'No payroll run data found for the selected cycle.'
            : 'Select a payroll cycle to load the register.',
          csvFilename: 'payroll-register-report.csv',
        };
      case 'payroll-overtime':
        return {
          title: 'Payroll Overtime Report',
          description: 'Approved, pending, and rejected overtime inputs for a cycle.',
          generatedAt: payrollOvertimeReport?.generatedAt,
          filters: [
            {
              label: 'Payroll cycle',
              value:
                payrollCycleOptions.find((item) => item.id === selectedPayrollCycleId)?.name ??
                'Select a cycle',
            },
          ],
          summary: [
            { label: 'Entries', value: String(payrollOvertimeReport?.totals.rows ?? 0) },
            {
              label: 'Overtime minutes',
              value: String(payrollOvertimeReport?.totals.overtimeMinutes ?? 0),
            },
            {
              label: 'Estimated value',
              value: formatMoneyPsw(payrollOvertimeReport?.totals.estimatedAmountPsw ?? 0),
            },
          ],
          sections: [
            {
              heading: 'Overtime Inputs',
              headers: [
                'Employee',
                'Branch',
                'Department',
                'Minutes',
                'Rate / Hour',
                'Multiplier',
                'Approval',
                'Created',
              ],
              rows:
                payrollOvertimeReport?.rows.map((row) => [
                  row.employeeName ?? '-',
                  row.branchName ?? '-',
                  row.departmentName ?? '-',
                  String(row.overtimeMinutes),
                  formatMoneyPsw(row.ratePerHourPsw),
                  `${row.multiplierPct}%`,
                  APPROVAL_STATUS_LABELS[row.approvalStatus] ?? String(row.approvalStatus),
                  formatDateTime(row.createdAt),
                ]) ?? [],
            },
          ],
          loading: isPayrollOvertimeFetching,
          emptyMessage: selectedPayrollCycleId
            ? 'No overtime inputs found for the selected cycle.'
            : 'Select a payroll cycle to load overtime inputs.',
          csvFilename: 'payroll-overtime-report.csv',
        };
      case 'payroll-adjustments':
        return {
          title: 'Payroll Adjustments Report',
          description: 'Manual earnings and deductions loaded into payroll.',
          generatedAt: payrollAdjustmentsReport?.generatedAt,
          filters: [
            {
              label: 'Payroll cycle',
              value:
                payrollCycleOptions.find((item) => item.id === selectedPayrollCycleId)?.name ??
                'Select a cycle',
            },
          ],
          summary: [
            { label: 'Entries', value: String(payrollAdjustmentsReport?.totals.rows ?? 0) },
            {
              label: 'Earnings',
              value: formatMoneyPsw(payrollAdjustmentsReport?.totals.earningsPsw ?? 0),
            },
            {
              label: 'Deductions',
              value: formatMoneyPsw(payrollAdjustmentsReport?.totals.deductionsPsw ?? 0),
            },
          ],
          sections: [
            {
              heading: 'Manual Adjustments',
              headers: [
                'Employee',
                'Branch',
                'Type',
                'Code',
                'Name',
                'Amount',
                'Approval',
                'Created',
              ],
              rows:
                payrollAdjustmentsReport?.rows.map((row) => [
                  row.employeeName ?? '-',
                  row.branchName ?? '-',
                  row.itemType === PayrollItemType.DEDUCTION ? 'Deduction' : 'Earning',
                  row.code,
                  row.name,
                  formatMoneyPsw(row.amountPsw),
                  APPROVAL_STATUS_LABELS[row.approvalStatus] ?? String(row.approvalStatus),
                  formatDateTime(row.createdAt),
                ]) ?? [],
            },
          ],
          loading: isPayrollAdjustmentsFetching,
          emptyMessage: selectedPayrollCycleId
            ? 'No manual adjustments found for the selected cycle.'
            : 'Select a payroll cycle to load manual adjustments.',
          csvFilename: 'payroll-adjustments-report.csv',
        };
      case 'payroll-journal-reconciliation':
        return {
          title: 'Payroll Journal Reconciliation',
          description:
            'Compares approved payroll totals with the posted accounting journal batch for the selected payroll cycle.',
          generatedAt: payrollJournalReconciliationReport?.generatedAt,
          filters: [
            {
              label: 'Payroll cycle',
              value:
                payrollCycleOptions.find((item) => item.id === selectedPayrollCycleId)?.name ??
                'Select a cycle',
            },
          ],
          summary: [
            {
              label: 'Payroll gross pay',
              value: formatMoneyPsw(
                payrollJournalReconciliationReport?.totals.payrollGrossPayPsw ?? 0,
              ),
            },
            {
              label: 'Journal debits',
              value: formatMoneyPsw(
                payrollJournalReconciliationReport?.totals.journalDebitPsw ?? 0,
              ),
            },
            {
              label: 'Difference',
              value: formatMoneyPsw(
                payrollJournalReconciliationReport?.totals.grossVsJournalDebitDifferencePsw ?? 0,
              ),
            },
            {
              label: 'Balanced',
              value: payrollJournalReconciliationReport?.totals.journalBalanced ? 'Yes' : 'No',
            },
          ],
          sections: [
            {
              heading: 'Reconciliation Summary',
              headers: [
                'Payroll Cycle',
                'Payroll Group',
                'Run Status',
                'Journal Batch',
                'Match Gross Pay',
                'Journal Balanced',
              ],
              rows: payrollJournalReconciliationReport
                ? [
                    [
                      payrollJournalReconciliationReport.payrollCycle.name,
                      payrollJournalReconciliationReport.payrollCycle.payrollGroupName ?? '-',
                      String(payrollJournalReconciliationReport.payrollRun.status),
                      payrollJournalReconciliationReport.journalBatch?.id ?? 'Not journalized',
                      payrollJournalReconciliationReport.totals.matchedToGrossPay ? 'Yes' : 'No',
                      payrollJournalReconciliationReport.totals.journalBalanced ? 'Yes' : 'No',
                    ],
                  ]
                : [],
            },
            {
              heading: 'Journal Account Summary',
              headers: ['Account Code', 'Account Name', 'Debit', 'Credit'],
              rows:
                payrollJournalReconciliationReport?.accountSummary.map((row) => [
                  row.accountCode,
                  row.accountName,
                  formatMoneyPsw(row.debitPsw),
                  formatMoneyPsw(row.creditPsw),
                ]) ?? [],
            },
            {
              heading: 'Journal Lines',
              headers: ['Date', 'Account', 'Branch', 'Description', 'Debit', 'Credit'],
              rows:
                payrollJournalReconciliationReport?.journalLines.map((row) => [
                  formatDateTime(row.entryDate),
                  `${row.accountCode} - ${row.accountName}`,
                  row.branchName ?? '-',
                  row.description ?? '-',
                  formatMoneyPsw(row.debitPsw),
                  formatMoneyPsw(row.creditPsw),
                ]) ?? [],
            },
          ],
          loading: isPayrollJournalReconciliationFetching,
          emptyMessage: selectedPayrollCycleId
            ? 'No payroll journal data found for the selected cycle.'
            : 'Select a payroll cycle to load the reconciliation report.',
          csvFilename: 'payroll-journal-reconciliation-report.csv',
        };
      case 'daily-cash-confirmations':
        return {
          title: 'Daily Cash Confirmation Report',
          description: 'Counted cash, expected cash, and variance by daily confirmation entry.',
          generatedAt: dailyCashConfirmationReport?.generatedAt,
          filters: [
            {
              label: 'Branch',
              value:
                branchOptions.find((item) => item.id === selectedBranchId)?.name ?? 'All branches',
            },
            {
              label: 'Status',
              value:
                selectedCashConfirmationStatus !== null
                  ? (CASH_CONFIRMATION_STATUS_LABELS[selectedCashConfirmationStatus] ??
                    String(selectedCashConfirmationStatus))
                  : 'All statuses',
            },
            { label: 'From', value: from },
            { label: 'To', value: to },
          ],
          summary: [
            {
              label: 'Confirmations',
              value: String(dailyCashConfirmationReport?.totals.confirmations ?? 0),
            },
            {
              label: 'Expected cash',
              value: formatMoneyPsw(dailyCashConfirmationReport?.totals.expectedCashPsw ?? 0),
            },
            {
              label: 'Counted cash',
              value: formatMoneyPsw(dailyCashConfirmationReport?.totals.countedCashPsw ?? 0),
            },
            {
              label: 'Shortage',
              value: formatMoneyPsw(dailyCashConfirmationReport?.totals.shortagePsw ?? 0),
            },
          ],
          sections: [
            {
              heading: 'Daily Cash Confirmations',
              headers: [
                'Date',
                'Branch',
                'Location',
                'Cashier',
                'Accountant',
                'Expected',
                'Counted',
                'Shortage',
                'Overage',
                'Status',
              ],
              rows:
                dailyCashConfirmationReport?.rows.map((row) => [
                  formatDate(row.confirmationDate),
                  row.branchName ?? '-',
                  row.locationName ?? '-',
                  row.cashierName ?? '-',
                  row.accountantName ?? '-',
                  formatMoneyPsw(row.expectedCashPsw),
                  formatMoneyPsw(row.countedCashPsw),
                  formatMoneyPsw(row.shortagePsw),
                  formatMoneyPsw(row.overagePsw),
                  CASH_CONFIRMATION_STATUS_LABELS[row.status] ?? String(row.status),
                ]) ?? [],
            },
          ],
          loading: isDailyCashConfirmationFetching,
          emptyMessage: 'No daily cash confirmations matched the selected filters.',
          csvFilename: 'daily-cash-confirmations-report.csv',
        };
      case 'expense-by-category':
        return {
          title: 'Expense by Category Report',
          description: 'Expense requests grouped by category, with detailed request lines.',
          generatedAt: expenseByCategoryReport?.generatedAt,
          filters: [
            {
              label: 'Branch',
              value:
                branchOptions.find((item) => item.id === selectedBranchId)?.name ?? 'All branches',
            },
            {
              label: 'Status',
              value:
                selectedExpenseRequestStatus !== null
                  ? (EXPENSE_REQUEST_STATUS_LABELS[selectedExpenseRequestStatus] ??
                    String(selectedExpenseRequestStatus))
                  : 'All statuses',
            },
            { label: 'From', value: from },
            { label: 'To', value: to },
          ],
          summary: [
            {
              label: 'Categories',
              value: String(expenseByCategoryReport?.totals.categories ?? 0),
            },
            {
              label: 'Requests',
              value: String(expenseByCategoryReport?.totals.requests ?? 0),
            },
            {
              label: 'Total amount',
              value: formatMoneyPsw(expenseByCategoryReport?.totals.totalAmountPsw ?? 0),
            },
            {
              label: 'Posted',
              value: formatMoneyPsw(expenseByCategoryReport?.totals.postedPsw ?? 0),
            },
          ],
          sections: [
            {
              heading: 'Category Summary',
              headers: [
                'Code',
                'Category',
                'Ledger Account',
                'Requests',
                'Total',
                'Approved',
                'Paid',
                'Posted',
              ],
              rows:
                expenseByCategoryReport?.summaryRows.map((row) => [
                  row.expenseCategoryCode,
                  row.expenseCategoryName,
                  row.accountName ?? '-',
                  String(row.requests),
                  formatMoneyPsw(row.totalAmountPsw),
                  formatMoneyPsw(row.approvedPsw),
                  formatMoneyPsw(row.paidPsw),
                  formatMoneyPsw(row.postedPsw),
                ]) ?? [],
            },
            {
              heading: 'Expense Detail',
              headers: [
                'Created',
                'Branch',
                'Category',
                'Purpose',
                'Funding Source',
                'Amount',
                'Status',
                'Requested By',
              ],
              rows:
                expenseByCategoryReport?.detailRows.map((row) => [
                  formatDateTime(row.createdAt),
                  row.branchName ?? '-',
                  row.expenseCategoryName,
                  row.purpose,
                  EXPENSE_FUNDING_SOURCE_LABELS[row.fundingSource] ?? String(row.fundingSource),
                  formatMoneyPsw(row.amountPsw),
                  EXPENSE_REQUEST_STATUS_LABELS[row.status] ?? String(row.status),
                  row.requestedByName ?? '-',
                ]) ?? [],
            },
          ],
          loading: isExpenseByCategoryFetching,
          emptyMessage: 'No expense requests matched the selected filters.',
          csvFilename: 'expense-by-category-report.csv',
        };
      case 'customer-statement':
        return {
          title: 'Customer Statement',
          description: 'Unified customer ledger for parcels, payments, and credit entries.',
          generatedAt: new Date().toISOString(),
          filters: [
            {
              label: 'Customer',
              value:
                customerOptions.find((item) => item.id === selectedCustomerId)?.fullname ??
                'Select a customer',
            },
            { label: 'From', value: from },
            { label: 'To', value: to },
          ],
          summary: [
            {
              label: 'Closing balance',
              value: formatMoneyPsw(customerStatement?.summary.closingCreditBalancePsw ?? 0),
            },
            {
              label: 'Rows',
              value: String(customerStatement?.rows?.length ?? 0),
            },
          ],
          sections: [
            {
              heading: 'Statement Lines',
              headers: ['Timestamp', 'Type', 'Direction', 'Booking', 'Tracking', 'Notes', 'Amount'],
              rows:
                customerStatement?.rows.map((row) => [
                  formatDateTime(row.timestamp),
                  row.entryType,
                  row.direction,
                  row.bookingCode ?? '-',
                  row.trackingCode ?? '-',
                  row.notes,
                  row.amountPsw === null ? '-' : formatMoneyPsw(row.amountPsw),
                ]) ?? [],
            },
          ],
          loading: isCustomerStatementFetching,
          emptyMessage: selectedCustomerId
            ? 'No statement rows found for the selected customer and date range.'
            : 'Select a customer to load the statement.',
          csvFilename: 'customer-statement-report.csv',
        };
      case 'parcel-status':
        return {
          title: 'Parcel Status Summary',
          description: 'Parcel detail and status distribution across the selected range.',
          generatedAt: parcelStatusReport?.generatedAt,
          filters: [
            {
              label: 'Branch',
              value:
                branchOptions.find((item) => item.id === selectedBranchId)?.name ?? 'All branches',
            },
            { label: 'From', value: from },
            { label: 'To', value: to },
          ],
          summary: [
            { label: 'Parcels', value: String(parcelStatusReport?.totals.parcels ?? 0) },
            {
              label: 'Charge total',
              value: formatMoneyPsw(parcelStatusReport?.totals.chargePsw ?? 0),
            },
            {
              label: 'To be paid total',
              value: formatMoneyPsw(parcelStatusReport?.totals.toBePaidPsw ?? 0),
            },
          ],
          sections: [
            {
              heading: 'Status Breakdown',
              headers: ['Status', 'Count'],
              rows:
                parcelStatusReport?.summary.map((row) => [
                  PARCEL_STATUS_LABELS[row.status] ?? String(row.status),
                  String(row.count),
                ]) ?? [],
            },
            {
              heading: 'Parcel Detail',
              headers: [
                'Tracking',
                'Booking',
                'Status',
                'Source',
                'Destination',
                'Sender',
                'Receiver',
                'Created',
              ],
              rows:
                parcelStatusReport?.rows.map((row) => [
                  row.trackingCode,
                  row.bookingCode,
                  PARCEL_STATUS_LABELS[row.status] ?? String(row.status),
                  row.sourceBranchName ?? '-',
                  row.destinationBranchName ?? '-',
                  row.senderName ?? '-',
                  row.receiverName ?? '-',
                  formatDateTime(row.createdAt),
                ]) ?? [],
            },
          ],
          loading: isParcelStatusFetching,
          emptyMessage: 'No parcels matched the selected filters.',
          csvFilename: 'parcel-status-summary-report.csv',
        };
      case 'delivery-performance':
        return {
          title: 'Delivery Performance Report',
          description: 'Delivery workload, outcomes, and fee collections by branch and rider.',
          generatedAt: deliveryPerformanceReport?.generatedAt,
          filters: [
            {
              label: 'Destination branch',
              value:
                branchOptions.find((item) => item.id === selectedBranchId)?.name ?? 'All branches',
            },
            {
              label: 'Rider',
              value:
                riderOptions.find((item) => item.id === selectedRiderUserId)?.fullname ??
                'All riders',
            },
            { label: 'From', value: from },
            { label: 'To', value: to },
          ],
          summary: [
            {
              label: 'Deliveries',
              value: String(deliveryPerformanceReport?.totals.deliveries ?? 0),
            },
            { label: 'Delivered', value: String(deliveryPerformanceReport?.totals.delivered ?? 0) },
            {
              label: 'Returned',
              value: String(deliveryPerformanceReport?.totals.returnedToOffice ?? 0),
            },
            {
              label: 'Fees',
              value: formatMoneyPsw(deliveryPerformanceReport?.totals.deliveryFeesPsw ?? 0),
            },
          ],
          sections: [
            {
              heading: 'Status Summary',
              headers: ['Delivery Status', 'Count'],
              rows:
                deliveryPerformanceReport?.statusSummary.map((row) => [
                  row.status,
                  String(row.count),
                ]) ?? [],
            },
            {
              heading: 'Delivery Detail',
              headers: [
                'Created',
                'Tracking',
                'Booking',
                'Rider',
                'Destination',
                'Receiver',
                'Delivery Status',
                'Parcel Status',
                'Fee',
                'Paid',
                'Delivered At',
              ],
              rows:
                deliveryPerformanceReport?.rows.map((row) => [
                  formatDateTime(row.createdAt),
                  row.trackingCode,
                  row.bookingCode,
                  row.riderName ?? '-',
                  row.destinationBranchName ?? '-',
                  row.receiverName ?? '-',
                  row.deliveryStatus,
                  PARCEL_STATUS_LABELS[row.parcelStatus] ?? String(row.parcelStatus),
                  formatMoneyPsw(row.deliveryFeePsw),
                  formatMoneyPsw(row.amountPaidPsw),
                  formatDateTime(row.deliveredAt),
                ]) ?? [],
            },
          ],
          loading: isDeliveryPerformanceFetching,
          emptyMessage: 'No deliveries matched the selected filters.',
          csvFilename: 'delivery-performance-report.csv',
        };
      case 'shift-revenue':
        return {
          title: 'Shift Revenue Report',
          description: 'Revenue and payment mix by cashier session.',
          generatedAt: shiftRevenueReport?.generatedAt,
          filters: [
            {
              label: 'Branch',
              value:
                branchOptions.find((item) => item.id === selectedBranchId)?.name ?? 'All branches',
            },
            { label: 'From', value: from },
            { label: 'To', value: to },
          ],
          summary: [
            { label: 'Sessions', value: String(shiftRevenueReport?.totals.sessions ?? 0) },
            {
              label: 'Transactions',
              value: String(shiftRevenueReport?.totals.transactionCount ?? 0),
            },
            {
              label: 'Net revenue',
              value: formatMoneyPsw(shiftRevenueReport?.totals.netPsw ?? 0),
            },
            {
              label: 'Cash collected',
              value: formatMoneyPsw(shiftRevenueReport?.totals.cashPsw ?? 0),
            },
          ],
          sections: [
            {
              heading: 'Shift Revenue',
              headers: [
                'Cashier',
                'Branch',
                'Shift Type',
                'Scheduled Start',
                'Status',
                'Transactions',
                'Gross',
                'Net',
                'Tax',
              ],
              rows:
                shiftRevenueReport?.rows.map((row) => [
                  row.cashierName,
                  row.branchName,
                  row.shiftTypeName ?? '-',
                  formatDateTime(row.scheduledStartTime),
                  row.status,
                  String(row.transactionCount),
                  formatMoneyPsw(row.grossPsw),
                  formatMoneyPsw(row.netPsw),
                  formatMoneyPsw(row.taxPsw),
                ]) ?? [],
            },
          ],
          loading: isShiftRevenueFetching,
          emptyMessage: 'No shift sessions matched the selected filters.',
          csvFilename: 'shift-revenue-report.csv',
        };
      case 'branch-profitability':
        return {
          title: 'Branch Profitability Report',
          description: 'Income, expense, and net profit by branch from posted journal lines.',
          generatedAt: branchProfitabilityReport?.generatedAt,
          filters: [
            {
              label: 'Branch',
              value:
                branchOptions.find((item) => item.id === selectedBranchId)?.name ?? 'All branches',
            },
            { label: 'From', value: from },
            { label: 'To', value: to },
          ],
          summary: [
            {
              label: 'Branches',
              value: String(branchProfitabilityReport?.totals.branches ?? 0),
            },
            {
              label: 'Income',
              value: formatMoneyPsw(branchProfitabilityReport?.totals.incomePsw ?? 0),
            },
            {
              label: 'Expense',
              value: formatMoneyPsw(branchProfitabilityReport?.totals.expensePsw ?? 0),
            },
            {
              label: 'Net profit',
              value: formatMoneyPsw(branchProfitabilityReport?.totals.netProfitPsw ?? 0),
            },
          ],
          sections: [
            {
              heading: 'Branch Profitability',
              headers: ['Branch', 'Income', 'Expense', 'Net Profit', 'Ledger Lines'],
              rows:
                branchProfitabilityReport?.rows.map((row) => [
                  row.branchName,
                  formatMoneyPsw(row.incomePsw),
                  formatMoneyPsw(row.expensePsw),
                  formatMoneyPsw(row.netProfitPsw),
                  String(row.lineCount),
                ]) ?? [],
            },
          ],
          loading: isBranchProfitabilityFetching,
          emptyMessage: 'No profitability rows matched the selected filters.',
          csvFilename: 'branch-profitability-report.csv',
        };
      case 'credit-exposure':
        return {
          title: 'Credit Exposure Report',
          description: 'Outstanding customer credit balances with aging buckets.',
          generatedAt: creditExposureReport?.generatedAt,
          filters: [
            {
              label: 'Aging bucket',
              value:
                selectedCreditAgingBucket !== null
                  ? (CREDIT_AGING_BUCKET_LABELS[selectedCreditAgingBucket] ??
                    selectedCreditAgingBucket)
                  : 'All buckets',
            },
          ],
          summary: [
            { label: 'Customers', value: String(creditExposureReport?.totals.customers ?? 0) },
            {
              label: 'Outstanding',
              value: formatMoneyPsw(creditExposureReport?.totals.outstandingPsw ?? 0),
            },
            {
              label: '31-60 days',
              value: formatMoneyPsw(creditExposureReport?.totals.bucket31To60Psw ?? 0),
            },
            {
              label: '91+ days',
              value: formatMoneyPsw(creditExposureReport?.totals.bucket91PlusPsw ?? 0),
            },
          ],
          sections: [
            {
              heading: 'Customer Credit Exposure',
              headers: [
                'Customer',
                'Telephone',
                'Credit Limit',
                'Outstanding',
                'Current',
                '1-30',
                '31-60',
                '61-90',
                '91+',
              ],
              rows:
                creditExposureReport?.rows.map((row) => [
                  row.customerName,
                  row.telephone ?? '-',
                  formatMoneyPsw(row.creditLimitPsw),
                  formatMoneyPsw(row.outstandingPsw),
                  formatMoneyPsw(row.bucketCurrentPsw),
                  formatMoneyPsw(row.bucket1To30Psw),
                  formatMoneyPsw(row.bucket31To60Psw),
                  formatMoneyPsw(row.bucket61To90Psw),
                  formatMoneyPsw(row.bucket91PlusPsw),
                ]) ?? [],
            },
          ],
          loading: isCreditExposureFetching,
          emptyMessage: 'No outstanding customer credit exposure found.',
          csvFilename: 'credit-exposure-report.csv',
        };
      case 'customer-credit-aging-detail':
        return {
          title: 'Customer Credit Aging Detail Report',
          description:
            'Open customer credit items with age, allocation progress, and outstanding balance.',
          generatedAt: customerCreditAgingDetailReport?.generatedAt,
          filters: [
            {
              label: 'Customer',
              value:
                customerOptions.find((item) => item.id === selectedCustomerId)?.fullname ??
                'All customers',
            },
            {
              label: 'Aging bucket',
              value:
                selectedCreditAgingBucket !== null
                  ? (CREDIT_AGING_BUCKET_LABELS[selectedCreditAgingBucket] ??
                    selectedCreditAgingBucket)
                  : 'All buckets',
            },
            { label: 'From', value: from },
            { label: 'To', value: to },
          ],
          summary: [
            {
              label: 'Open items',
              value: String(customerCreditAgingDetailReport?.totals.items ?? 0),
            },
            {
              label: 'Customers',
              value: String(customerCreditAgingDetailReport?.totals.customers ?? 0),
            },
            {
              label: 'Outstanding',
              value: formatMoneyPsw(
                customerCreditAgingDetailReport?.totals.outstandingAmountPsw ?? 0,
              ),
            },
            {
              label: 'Allocated',
              value: formatMoneyPsw(
                customerCreditAgingDetailReport?.totals.allocatedAmountPsw ?? 0,
              ),
            },
          ],
          sections: [
            {
              heading: 'Open Credit Items',
              headers: [
                'Charge Date',
                'Customer',
                'Telephone',
                'Source',
                'Reference',
                'Bucket',
                'Age (days)',
                'Charge',
                'Allocated',
                'Outstanding',
              ],
              rows:
                customerCreditAgingDetailReport?.rows.map((row) => [
                  formatDate(row.chargeCreatedAt),
                  row.customerName,
                  row.telephone ?? '-',
                  row.sourceLabel,
                  row.referenceId ?? row.notes ?? '-',
                  CREDIT_AGING_BUCKET_LABELS[row.agingBucket] ?? row.agingBucket,
                  String(row.ageDays),
                  formatMoneyPsw(row.chargeAmountPsw),
                  formatMoneyPsw(row.allocatedAmountPsw),
                  formatMoneyPsw(row.outstandingAmountPsw),
                ]) ?? [],
            },
          ],
          loading: isCustomerCreditAgingDetailFetching,
          emptyMessage: 'No open credit items matched the selected filters.',
          csvFilename: 'customer-credit-aging-detail-report.csv',
        };
      case 'tobepaid-outstanding':
        return {
          title: 'To-Be-Paid Outstanding Report',
          description: 'Parcels with receiver principal still outstanding after recorded payments.',
          generatedAt: toBePaidOutstandingReport?.generatedAt,
          filters: [
            {
              label: 'Source branch',
              value:
                branchOptions.find((item) => item.id === selectedBranchId)?.name ?? 'All branches',
            },
            {
              label: 'Destination branch',
              value:
                branchOptions.find((item) => item.id === selectedDestinationBranchId)?.name ??
                'All branches',
            },
            { label: 'From', value: from },
            { label: 'To', value: to },
          ],
          summary: [
            { label: 'Parcels', value: String(toBePaidOutstandingReport?.totals.parcels ?? 0) },
            {
              label: 'Outstanding',
              value: formatMoneyPsw(toBePaidOutstandingReport?.totals.outstandingPsw ?? 0),
            },
            {
              label: 'Planned to be paid',
              value: formatMoneyPsw(toBePaidOutstandingReport?.totals.plannedToBePaidPsw ?? 0),
            },
            {
              label: 'Paid principal',
              value: formatMoneyPsw(toBePaidOutstandingReport?.totals.paidPrincipalPsw ?? 0),
            },
          ],
          sections: [
            {
              heading: 'Outstanding Parcels',
              headers: [
                'Tracking',
                'Booking',
                'Status',
                'Source',
                'Destination',
                'Receiver',
                'Planned',
                'Paid',
                'Outstanding',
              ],
              rows:
                toBePaidOutstandingReport?.rows.map((row) => [
                  row.trackingCode,
                  row.bookingCode,
                  PARCEL_STATUS_LABELS[row.status] ?? String(row.status),
                  row.sourceBranchName ?? '-',
                  row.destinationBranchName ?? '-',
                  row.receiverName ?? '-',
                  formatMoneyPsw(row.plannedToBePaidPsw),
                  formatMoneyPsw(row.paidPrincipalPsw),
                  formatMoneyPsw(row.outstandingPsw),
                ]) ?? [],
            },
          ],
          loading: isToBePaidOutstandingFetching,
          emptyMessage: 'No outstanding to-be-paid parcels matched the selected filters.',
          csvFilename: 'tobepaid-outstanding-report.csv',
        };
      case 'tobepaid-collections-reconciliation':
        return {
          title: 'To-Be-Paid Collections Reconciliation Report',
          description:
            'Reconciles planned to-be-paid principal against collected cash and credit-posted principal.',
          generatedAt: toBePaidCollectionsReconciliationReport?.generatedAt,
          filters: [
            {
              label: 'Source branch',
              value:
                branchOptions.find((item) => item.id === selectedBranchId)?.name ?? 'All branches',
            },
            {
              label: 'Destination branch',
              value:
                branchOptions.find((item) => item.id === selectedDestinationBranchId)?.name ??
                'All branches',
            },
            { label: 'From', value: from },
            { label: 'To', value: to },
          ],
          summary: [
            {
              label: 'Parcels',
              value: String(toBePaidCollectionsReconciliationReport?.totals.parcels ?? 0),
            },
            {
              label: 'Planned',
              value: formatMoneyPsw(
                toBePaidCollectionsReconciliationReport?.totals.plannedToBePaidPsw ?? 0,
              ),
            },
            {
              label: 'Collected',
              value: formatMoneyPsw(
                toBePaidCollectionsReconciliationReport?.totals.collectedPrincipalPsw ?? 0,
              ),
            },
            {
              label: 'Credited',
              value: formatMoneyPsw(
                toBePaidCollectionsReconciliationReport?.totals.creditedPrincipalPsw ?? 0,
              ),
            },
          ],
          sections: [
            {
              heading: 'Reconciliation Detail',
              headers: [
                'Tracking',
                'Booking',
                'Status',
                'Source',
                'Destination',
                'Receiver',
                'Planned',
                'Collected',
                'Credited',
                'Recognized',
                'Outstanding',
                'Variance',
              ],
              rows:
                toBePaidCollectionsReconciliationReport?.rows.map((row) => [
                  row.trackingCode,
                  row.bookingCode,
                  PARCEL_STATUS_LABELS[row.status] ?? String(row.status),
                  row.sourceBranchName ?? '-',
                  row.destinationBranchName ?? '-',
                  row.receiverName ?? '-',
                  formatMoneyPsw(row.plannedToBePaidPsw),
                  formatMoneyPsw(row.collectedPrincipalPsw),
                  formatMoneyPsw(row.creditedPrincipalPsw),
                  formatMoneyPsw(row.recognizedPrincipalPsw),
                  formatMoneyPsw(row.outstandingPsw),
                  formatMoneyPsw(row.variancePsw),
                ]) ?? [],
            },
          ],
          loading: isToBePaidCollectionsReconciliationFetching,
          emptyMessage: 'No to-be-paid parcels matched the selected reconciliation filters.',
          csvFilename: 'tobepaid-collections-reconciliation-report.csv',
        };
    }
  }, [
    activeReport,
    attendanceReport,
    branchProfitabilityReport,
    branchOptions,
    creditExposureReport,
    customerCreditAgingDetailReport,
    customerOptions,
    customerStatement,
    dailyCashConfirmationReport,
    deliveryPerformanceReport,
    departmentOptions,
    employeeOptions,
    employeeReport,
    expenseByCategoryReport,
    from,
    isAttendanceReportFetching,
    isBranchProfitabilityFetching,
    isCreditExposureFetching,
    isCustomerCreditAgingDetailFetching,
    isCustomerStatementFetching,
    isDailyCashConfirmationFetching,
    isDeliveryPerformanceFetching,
    isEmployeeReportFetching,
    isExpenseByCategoryFetching,
    isLeaveReportFetching,
    isParcelStatusFetching,
    isPayrollAdjustmentsFetching,
    isPayrollJournalReconciliationFetching,
    isPayrollOvertimeFetching,
    isPayrollRegisterFetching,
    isShiftRevenueFetching,
    isToBePaidOutstandingFetching,
    isToBePaidCollectionsReconciliationFetching,
    leaveReport,
    parcelStatusReport,
    payrollAdjustmentsReport,
    payrollJournalReconciliationReport,
    payrollCycleOptions,
    payrollOvertimeReport,
    payrollRegisterReport,
    selectedBranchId,
    selectedCashConfirmationStatus,
    selectedDestinationBranchId,
    selectedCustomerId,
    selectedCreditAgingBucket,
    selectedDepartmentId,
    selectedEmployeeId,
    selectedEmployeeStatus,
    selectedExpenseRequestStatus,
    selectedLeaveStatus,
    selectedPayrollCycleId,
    selectedRiderUserId,
    riderOptions,
    shiftRevenueReport,
    toBePaidCollectionsReconciliationReport,
    toBePaidOutstandingReport,
    to,
  ]);

  const printReport = useReactToPrint({
    contentRef: printRef,
    documentTitle: REPORT_LABELS[activeReport].toLowerCase().replaceAll(/\s+/g, '-'),
  });

  const handleLoadReport = () => {
    setLoadedFilters(draftLoadFilters);
  };

  if (!availableReports.length) {
    return (
      <div className="w-full p-4">
        <Card>
          <CardHeader>
            <CardTitle>Reports</CardTitle>
            <CardDescription>
              Your current role does not include access to any report set in this area.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const currentSection = currentReport.sections.at(-1) ?? currentReport.sections[0];

  return (
    <div className="w-full space-y-4 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {standalone ? REPORT_LABELS[activeReport] : 'Reports Center'}
          </h1>
          {!standalone ? (
            <p className="text-sm text-muted-foreground">
              Operational, HR, payroll, customer, and parcel reports with print-ready output.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {!standalone ? (
            <Button asChild variant="outline">
              <Link to="/accounting/reports">Open accounting reports</Link>
            </Button>
          ) : null}
          <Button
            onClick={handleLoadReport}
            disabled={currentReport.loading || !hasPendingFilterChanges}
          >
            Load report
          </Button>
          <Button
            variant="outline"
            disabled={
              !isLoadedForActiveReport || !currentSection || currentSection.rows.length === 0
            }
            onClick={() => {
              if (!currentSection) return;
              downloadCsv(currentReport.csvFilename, currentSection);
            }}
          >
            Export CSV
          </Button>
          <Button
            disabled={
              !isLoadedForActiveReport ||
              !currentReport.sections.some((section) => section.rows.length > 0)
            }
            onClick={() => void printReport()}
          >
            Print report
          </Button>
        </div>
      </div>

      <Tabs
        value={activeReport}
        onValueChange={(value) => setActiveReport(value as ReportKey)}
        className="space-y-4"
      >
        {!standalone ? (
          <TabsList className="flex h-auto flex-wrap justify-start gap-2">
            {availableReports.map((reportKey) => (
              <TabsTrigger key={reportKey} value={reportKey}>
                {REPORT_LABELS[reportKey]}
              </TabsTrigger>
            ))}
          </TabsList>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>{currentReport.title}</CardTitle>
            <CardDescription>{currentReport.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isLoadedForActiveReport ? (
              <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                Select filters and click Load report.
              </div>
            ) : null}
            {activeReport === 'employees' ? (
              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All branches</SelectItem>
                      {branchOptions.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={departmentId} onValueChange={setDepartmentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All departments</SelectItem>
                      {departmentOptions.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={employeeStatus} onValueChange={setEmployeeStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All statuses</SelectItem>
                      {Object.entries(EMPLOYMENT_STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Search</Label>
                  <Input
                    value={employeeSearch}
                    onChange={(event) => setEmployeeSearch(event.target.value)}
                    placeholder="Employee name, number, phone..."
                  />
                </div>
              </div>
            ) : null}

            {activeReport === 'attendance' ? (
              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <Select value={employeeId} onValueChange={setEmployeeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All employees</SelectItem>
                      {employeeOptions.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All branches</SelectItem>
                      {branchOptions.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Date range</Label>
                  <DateRangePicker
                    value={reportDateRange}
                    onChange={setReportDateRange}
                    placeholder="Select date range"
                  />
                </div>
              </div>
            ) : null}

            {activeReport === 'leave' ? (
              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <Select value={employeeId} onValueChange={setEmployeeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All employees</SelectItem>
                      {employeeOptions.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={leaveStatus} onValueChange={setLeaveStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All statuses</SelectItem>
                      {Object.entries(LEAVE_STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Date range</Label>
                  <DateRangePicker
                    value={reportDateRange}
                    onChange={setReportDateRange}
                    placeholder="Select date range"
                  />
                </div>
              </div>
            ) : null}

            {activeReport === 'payroll-register' ||
            activeReport === 'payroll-overtime' ||
            activeReport === 'payroll-adjustments' ||
            activeReport === 'payroll-journal-reconciliation' ? (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Payroll cycle</Label>
                  <Select value={payrollCycleId} onValueChange={setPayrollCycleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payroll cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Select payroll cycle</SelectItem>
                      {payrollCycleOptions.map((cycle) => (
                        <SelectItem key={cycle.id} value={cycle.id}>
                          {cycle.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}

            {activeReport === 'customer-statement' ? (
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Select customer</SelectItem>
                      {customerOptions.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.fullname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Date range</Label>
                  <DateRangePicker
                    value={reportDateRange}
                    onChange={setReportDateRange}
                    placeholder="Select date range"
                  />
                </div>
              </div>
            ) : null}

            {activeReport === 'parcel-status' ? (
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All branches</SelectItem>
                      {branchOptions.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Date range</Label>
                  <DateRangePicker
                    value={reportDateRange}
                    onChange={setReportDateRange}
                    placeholder="Select date range"
                  />
                </div>
              </div>
            ) : null}

            {activeReport === 'delivery-performance' ? (
              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Destination branch</Label>
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All branches</SelectItem>
                      {branchOptions.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rider</Label>
                  <Select value={riderUserId} onValueChange={setRiderUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All riders" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All riders</SelectItem>
                      {riderOptions.map((rider) => (
                        <SelectItem key={rider.id} value={rider.id}>
                          {rider.fullname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Date range</Label>
                  <DateRangePicker
                    value={reportDateRange}
                    onChange={setReportDateRange}
                    placeholder="Select date range"
                  />
                </div>
              </div>
            ) : null}

            {activeReport === 'shift-revenue' || activeReport === 'branch-profitability' ? (
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All branches</SelectItem>
                      {branchOptions.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Date range</Label>
                  <DateRangePicker
                    value={reportDateRange}
                    onChange={setReportDateRange}
                    placeholder="Select date range"
                  />
                </div>
              </div>
            ) : null}

            {activeReport === 'daily-cash-confirmations' ? (
              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All branches</SelectItem>
                      {branchOptions.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={cashConfirmationStatus} onValueChange={setCashConfirmationStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All statuses</SelectItem>
                      {Object.entries(CASH_CONFIRMATION_STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Date range</Label>
                  <DateRangePicker
                    value={reportDateRange}
                    onChange={setReportDateRange}
                    placeholder="Select date range"
                  />
                </div>
              </div>
            ) : null}

            {activeReport === 'expense-by-category' ? (
              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All branches</SelectItem>
                      {branchOptions.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={expenseRequestStatus} onValueChange={setExpenseRequestStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All statuses</SelectItem>
                      {Object.entries(EXPENSE_REQUEST_STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Date range</Label>
                  <DateRangePicker
                    value={reportDateRange}
                    onChange={setReportDateRange}
                    placeholder="Select date range"
                  />
                </div>
              </div>
            ) : null}

            {activeReport === 'credit-exposure' ? (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Aging bucket</Label>
                  <Select value={creditAgingBucket} onValueChange={setCreditAgingBucket}>
                    <SelectTrigger>
                      <SelectValue placeholder="All buckets" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All buckets</SelectItem>
                      {Object.entries(CREDIT_AGING_BUCKET_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}

            {activeReport === 'customer-credit-aging-detail' ? (
              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All customers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All customers</SelectItem>
                      {customerOptions.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.fullname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Aging bucket</Label>
                  <Select value={creditAgingBucket} onValueChange={setCreditAgingBucket}>
                    <SelectTrigger>
                      <SelectValue placeholder="All buckets" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All buckets</SelectItem>
                      {Object.entries(CREDIT_AGING_BUCKET_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Date range</Label>
                  <DateRangePicker
                    value={reportDateRange}
                    onChange={setReportDateRange}
                    placeholder="Select date range"
                  />
                </div>
              </div>
            ) : null}

            {activeReport === 'tobepaid-outstanding' ? (
              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Source branch</Label>
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All branches</SelectItem>
                      {branchOptions.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Destination branch</Label>
                  <Select value={destinationBranchId} onValueChange={setDestinationBranchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All branches</SelectItem>
                      {branchOptions.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Date range</Label>
                  <DateRangePicker
                    value={reportDateRange}
                    onChange={setReportDateRange}
                    placeholder="Select date range"
                  />
                </div>
              </div>
            ) : null}

            {activeReport === 'tobepaid-collections-reconciliation' ? (
              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Source branch</Label>
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All branches</SelectItem>
                      {branchOptions.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Destination branch</Label>
                  <Select value={destinationBranchId} onValueChange={setDestinationBranchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All branches</SelectItem>
                      {branchOptions.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Date range</Label>
                  <DateRangePicker
                    value={reportDateRange}
                    onChange={setReportDateRange}
                    placeholder="Select date range"
                  />
                </div>
              </div>
            ) : null}

            <SummaryGrid items={currentReport.summary} />

            {currentReport.generatedAt ? (
              <div className="text-xs text-muted-foreground">
                Generated {formatDateTime(currentReport.generatedAt)}
              </div>
            ) : null}

            {currentReport.sections.map((section) => (
              <div key={section.heading} className="space-y-3">
                <div className="font-medium">{section.heading}</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {section.headers.map((header) => (
                        <TableHead key={header}>{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentReport.loading ? (
                      <TableRow>
                        <TableCell colSpan={section.headers.length}>Loading report...</TableCell>
                      </TableRow>
                    ) : section.rows.length ? (
                      section.rows.map((row, rowIndex) => (
                        <TableRow key={`${section.heading}-${rowIndex}`}>
                          {row.map((cell, cellIndex) => (
                            <TableCell key={`${section.heading}-${rowIndex}-${cellIndex}`}>
                              {cell}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={section.headers.length}>
                          {currentReport.emptyMessage}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ))}
          </CardContent>
        </Card>
      </Tabs>

      <div className="absolute -left-[10000px] top-0 w-[8.5in]">
        <PrintableReportDocument
          ref={printRef}
          companyName={companyName}
          title={currentReport.title}
          subtitle={currentReport.description}
          generatedAt={currentReport.generatedAt ?? new Date().toISOString()}
          filters={currentReport.filters}
          sections={currentReport.sections}
        />
      </div>
    </div>
  );
}
