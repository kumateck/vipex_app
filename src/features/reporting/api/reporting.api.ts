import { api } from '@/services/api';

export interface EmployeeMasterReportRow {
  id: string;
  employeeNumber: string;
  displayName: string;
  email?: string | null;
  telephone: string;
  employmentStatus: number;
  employmentType: number;
  hireDate?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  locationId?: string | null;
  locationName?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  jobTitleId?: string | null;
  jobTitleName?: string | null;
  supervisorEmployeeId?: string | null;
  supervisorName?: string | null;
  hasUserAccount: boolean;
  paymentMethod?: string | null;
  bankName?: string | null;
  mobileMoneyNumber?: string | null;
  createdAt?: string | null;
}

export interface EmployeeMasterReport {
  filters: Record<string, unknown>;
  generatedAt: string;
  totals: {
    employees: number;
    activeEmployees: number;
    withUserAccounts: number;
  };
  rows: EmployeeMasterReportRow[];
}

export interface AttendanceReportRow {
  id: string;
  employeeId: string;
  employeeNumber?: string | null;
  employeeName?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  locationId?: string | null;
  locationName?: string | null;
  attendanceDate: string;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  minutesWorked?: number | null;
  status: number;
  createdAt?: string | null;
}

export interface AttendanceReport {
  filters: Record<string, unknown>;
  generatedAt: string;
  totals: {
    records: number;
    workedMinutes: number;
    checkedIn: number;
    checkedOut: number;
  };
  rows: AttendanceReportRow[];
}

export interface LeaveRequestsReportRow {
  id: string;
  employeeId: string;
  employeeNumber?: string | null;
  employeeName?: string | null;
  supervisorEmployeeId?: string | null;
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeIsPaid: boolean;
  dateFrom: string;
  dateTo: string;
  daysCount: number;
  managerApprovalStatus: number;
  status: number;
  reason?: string | null;
  rejectionReason?: string | null;
  approvedAt?: string | null;
  createdAt?: string | null;
}

export interface LeaveRequestsReport {
  filters: Record<string, unknown>;
  generatedAt: string;
  totals: {
    requests: number;
    daysRequested: number;
    approved: number;
    pending: number;
  };
  rows: LeaveRequestsReportRow[];
}

export interface PayrollRegisterReportRow {
  id: string;
  payrollRunId: string;
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  branchId?: string | null;
  branchName?: string | null;
  departmentName?: string | null;
  jobTitleName?: string | null;
  basePayPsw: number;
  grossPayPsw: number;
  totalDeductionsPsw: number;
  netPayPsw: number;
  currencyCode: string;
  status?: string | null;
}

export interface PayrollRegisterReport {
  filters: Record<string, unknown>;
  generatedAt: string;
  payrollCycle: {
    id: string;
    name: string;
    periodStart?: string | null;
    periodEnd?: string | null;
    paymentDate?: string | null;
    status: number;
  };
  payrollRun: {
    id: string;
    status: number;
    approvedAt?: string | null;
    createdAt?: string | null;
  };
  totals: {
    employees: number;
    basePayPsw: number;
    grossPayPsw: number;
    totalDeductionsPsw: number;
    netPayPsw: number;
  };
  rows: PayrollRegisterReportRow[];
}

export interface PayrollOvertimeReportRow {
  id: string;
  employeeId: string;
  employeeNumber?: string | null;
  employeeName?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  departmentName?: string | null;
  overtimeMinutes: number;
  ratePerHourPsw: number;
  multiplierPct: number;
  approvalStatus: number;
  approvedAt?: string | null;
  notes?: string | null;
  createdAt?: string | null;
}

export interface PayrollOvertimeReport {
  filters: Record<string, unknown>;
  generatedAt: string;
  payrollCycle: {
    id: string;
    name: string;
    periodStart?: string | null;
    periodEnd?: string | null;
    paymentDate?: string | null;
    status: number;
  };
  totals: {
    rows: number;
    overtimeMinutes: number;
    estimatedAmountPsw: number;
  };
  rows: PayrollOvertimeReportRow[];
}

export interface PayrollAdjustmentsReportRow {
  id: string;
  employeeId: string;
  employeeNumber?: string | null;
  employeeName?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  departmentName?: string | null;
  itemType: number;
  code: string;
  name: string;
  amountPsw: number;
  isTaxable: boolean;
  approvalStatus: number;
  approvedAt?: string | null;
  notes?: string | null;
  createdAt?: string | null;
}

export interface PayrollAdjustmentsReport {
  filters: Record<string, unknown>;
  generatedAt: string;
  payrollCycle: {
    id: string;
    name: string;
    periodStart?: string | null;
    periodEnd?: string | null;
    paymentDate?: string | null;
    status: number;
  };
  totals: {
    rows: number;
    earningsPsw: number;
    deductionsPsw: number;
  };
  rows: PayrollAdjustmentsReportRow[];
}

export interface DailyCashConfirmationReportRow {
  id: string;
  branchId: string;
  branchName?: string | null;
  locationId?: string | null;
  locationName?: string | null;
  cashierUserId?: string | null;
  cashierName?: string | null;
  accountantUserId?: string | null;
  accountantName?: string | null;
  confirmationDate: string;
  expectedCashPsw: number;
  countedCashPsw: number;
  shortagePsw: number;
  overagePsw: number;
  status: number;
  notes?: string | null;
  confirmedAt?: string | null;
  postedAt?: string | null;
  createdAt: string;
}

export interface DailyCashConfirmationReport {
  filters: Record<string, unknown>;
  generatedAt: string;
  totals: {
    confirmations: number;
    expectedCashPsw: number;
    countedCashPsw: number;
    shortagePsw: number;
    overagePsw: number;
    confirmed: number;
    posted: number;
  };
  rows: DailyCashConfirmationReportRow[];
}

export interface ExpenseByCategoryReportSummaryRow {
  expenseCategoryId: string;
  expenseCategoryCode: string;
  expenseCategoryName: string;
  accountName?: string | null;
  requests: number;
  totalAmountPsw: number;
  recordedPsw: number;
  submittedPsw: number;
  approvedPsw: number;
  paidPsw: number;
  postedPsw: number;
}

export interface ExpenseByCategoryReportDetailRow {
  id: string;
  branchId: string;
  branchName?: string | null;
  locationId?: string | null;
  locationName?: string | null;
  expenseCategoryId: string;
  expenseCategoryCode: string;
  expenseCategoryName: string;
  amountPsw: number;
  fundingSource: number;
  status: number;
  purpose: string;
  referenceNo?: string | null;
  requestedByUserId: string;
  requestedByName?: string | null;
  approvedByUserId?: string | null;
  approvedByName?: string | null;
  paidByUserId?: string | null;
  paidByName?: string | null;
  paidAt?: string | null;
  postedAt?: string | null;
  createdAt: string;
}

export interface ExpenseByCategoryReport {
  filters: Record<string, unknown>;
  generatedAt: string;
  totals: {
    categories: number;
    requests: number;
    totalAmountPsw: number;
    approvedPsw: number;
    paidPsw: number;
    postedPsw: number;
  };
  summaryRows: ExpenseByCategoryReportSummaryRow[];
  detailRows: ExpenseByCategoryReportDetailRow[];
}

export interface PayrollJournalReconciliationAccountSummaryRow {
  accountCode: string;
  accountName: string;
  debitPsw: number;
  creditPsw: number;
}

export interface PayrollJournalReconciliationLineRow {
  lineId: string;
  entryId: string;
  batchId: string;
  entryDate: string;
  memo?: string | null;
  accountId: string;
  accountCode: string;
  accountName: string;
  branchId?: string | null;
  branchName?: string | null;
  debitPsw: number;
  creditPsw: number;
  description?: string | null;
  metadata: unknown;
}

export interface PayrollJournalReconciliationReport {
  filters: Record<string, unknown>;
  generatedAt: string;
  payrollCycle: {
    id: string;
    name: string;
    payrollGroupName?: string | null;
    periodStart?: string | null;
    periodEnd?: string | null;
    paymentDate?: string | null;
    status: number;
    currencyCode: string;
  };
  payrollRun: {
    id: string;
    status: number;
    approvedBy?: string | null;
    approvedAt?: string | null;
    journalBatchId?: string | null;
  };
  journalBatch: {
    id: string;
    sourceType: number;
    sourceId?: string | null;
    batchDate: string;
    description?: string | null;
    postedAt?: string | null;
    postedBy?: string | null;
    postedByName?: string | null;
  } | null;
  totals: {
    payrollEmployees: number;
    payrollGrossPayPsw: number;
    payrollDeductionsPsw: number;
    payrollNetPayPsw: number;
    journalLines: number;
    journalDebitPsw: number;
    journalCreditPsw: number;
    grossVsJournalDebitDifferencePsw: number;
    journalBalanced: boolean;
    matchedToGrossPay: boolean;
  };
  accountSummary: PayrollJournalReconciliationAccountSummaryRow[];
  journalLines: PayrollJournalReconciliationLineRow[];
}

export interface DeliveryPerformanceStatusSummaryRow {
  status: string;
  count: number;
}

export interface DeliveryPerformanceReportRow {
  deliveryId: string;
  parcelId: string;
  mode: number;
  deliveryStatus: string;
  parcelStatus: number;
  riderUserId?: string | null;
  riderName?: string | null;
  destinationBranchId: string;
  destinationBranchName?: string | null;
  receiverName?: string | null;
  receiverPhone?: string | null;
  trackingCode: string;
  bookingCode: string;
  deliveryFeePsw: number;
  amountPaidPsw: number;
  plannedToBePaidPsw: number;
  dropoffAddress?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryPerformanceReport {
  filters: Record<string, unknown>;
  generatedAt: string;
  totals: {
    deliveries: number;
    delivered: number;
    returnedToOffice: number;
    outForDelivery: number;
    deliveryFeesPsw: number;
    amountPaidPsw: number;
  };
  statusSummary: DeliveryPerformanceStatusSummaryRow[];
  rows: DeliveryPerformanceReportRow[];
}

export interface ParcelStatusSummaryRow {
  id: string;
  bookingCode: string;
  trackingCode: string;
  status: number;
  parcelDetails: string;
  parcelContent: string;
  chargePsw: number;
  plannedToBePaidPsw: number;
  sourceBranchId: string;
  sourceBranchName?: string | null;
  destinationBranchId: string;
  destinationBranchName?: string | null;
  senderName?: string | null;
  receiverName?: string | null;
  createdAt?: string | null;
  receivedAt?: string | null;
}

export interface ParcelStatusSummaryReport {
  filters: Record<string, unknown>;
  generatedAt: string;
  totals: {
    parcels: number;
    chargePsw: number;
    toBePaidPsw: number;
  };
  summary: Array<{ status: number; count: number }>;
  rows: ParcelStatusSummaryRow[];
}

export interface ShiftRevenueReportRow {
  id: string;
  cashierId: string;
  cashierName: string;
  branchId: string;
  branchName: string;
  shiftTypeId?: string | null;
  shiftTypeName?: string | null;
  scheduledStartTime: string;
  scheduledEndTime: string;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  status: string;
  openingBalancePsw: number;
  closingBalancePsw: number;
  transactionCount: number;
  grossPsw: number;
  netPsw: number;
  taxPsw: number;
  cashPsw: number;
  mobileMoneyPsw: number;
  creditPsw: number;
}

export interface ShiftRevenueReport {
  filters: Record<string, unknown>;
  generatedAt: string;
  totals: {
    sessions: number;
    transactionCount: number;
    grossPsw: number;
    netPsw: number;
    taxPsw: number;
    cashPsw: number;
    mobileMoneyPsw: number;
    creditPsw: number;
  };
  rows: ShiftRevenueReportRow[];
}

export interface DailyCashierSalesSessionRow {
  id: string;
  cashierId: string;
  cashierName: string;
  branchId: string;
  branchName: string;
  locationId?: string | null;
  locationName?: string | null;
  scheduledStartTime: string;
  scheduledEndTime: string;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  status: string;
  openingBalancePsw: number;
  closingBalancePsw?: number | null;
  totals: {
    transactionCount: number;
    grossPsw: number;
    netPsw: number;
    taxPsw: number;
    cashPsw: number;
    mtnPsw: number;
    telecelPsw: number;
    airtelPsw: number;
    creditPsw: number;
  };
}

export interface DailyCashierSalesTransactionRow {
  paymentId: string;
  sessionId?: string | null;
  parcelId: string;
  bookingCode: string;
  trackingCode: string;
  payerName: string;
  whoPaid: string;
  cashierId?: string | null;
  cashierName: string;
  branchId?: string | null;
  branchName: string;
  locationId?: string | null;
  locationName?: string | null;
  cashierType: number;
  method: number;
  component: number;
  payer: number;
  grossAmountPsw: number;
  netAmountPsw: number;
  taxTotalPsw: number;
  receivedAt: string;
  receiptNo?: string | null;
}

export interface DailyCashierSalesToBePaidRow {
  parcelId: string;
  sessionId?: string | null;
  bookingCode: string;
  senderName?: string | null;
  receiverName?: string | null;
  plannedToBePaidPsw: number;
  createdAt: string;
}

export interface DailyCashierSalesReport {
  filters: Record<string, unknown>;
  generatedAt: string;
  totals: {
    sessions: number;
    transactions: number;
    toBePaidPsw: number;
    grossPsw: number;
    netPsw: number;
    taxPsw: number;
  };
  paymentModeTotals: {
    cashPsw: number;
    mtnPsw: number;
    telecelPsw: number;
    airtelPsw: number;
    creditPsw: number;
  };
  cashierTypeTotals: {
    senderPsw: number;
    receiverPsw: number;
    deliveryPsw: number;
  };
  sessions: DailyCashierSalesSessionRow[];
  transactions: DailyCashierSalesTransactionRow[];
  toBePaidRows: DailyCashierSalesToBePaidRow[];
}

export interface DailyCashierSalesCashierOption {
  id: string;
  name: string;
}

export interface BranchProfitabilityReportRow {
  branchId: string;
  branchName: string;
  incomePsw: number;
  expensePsw: number;
  netProfitPsw: number;
  lineCount: number;
}

export interface BranchProfitabilityReport {
  filters: Record<string, unknown>;
  generatedAt: string;
  totals: {
    branches: number;
    incomePsw: number;
    expensePsw: number;
    netProfitPsw: number;
  };
  rows: BranchProfitabilityReportRow[];
}

export interface CreditExposureReportRow {
  customerId: string;
  customerName: string;
  telephone?: string | null;
  creditLimitPsw: number;
  outstandingPsw: number;
  oldestChargeAt?: string | null;
  bucketCurrentPsw: number;
  bucket1To30Psw: number;
  bucket31To60Psw: number;
  bucket61To90Psw: number;
  bucket91PlusPsw: number;
}

export interface CreditExposureReport {
  filters: Record<string, unknown>;
  generatedAt: string;
  totals: {
    customers: number;
    outstandingPsw: number;
    creditLimitPsw: number;
    currentPsw: number;
    bucket1To30Psw: number;
    bucket31To60Psw: number;
    bucket61To90Psw: number;
    bucket91PlusPsw: number;
  };
  rows: CreditExposureReportRow[];
}

export interface CustomerCreditAgingDetailReportRow {
  customerId: string;
  customerName: string;
  telephone?: string | null;
  chargeTransactionId: string;
  chargeCreatedAt: string;
  sourceType: number;
  sourceLabel: string;
  referenceId?: string | null;
  notes?: string | null;
  chargeAmountPsw: number;
  allocatedAmountPsw: number;
  outstandingAmountPsw: number;
  ageDays: number;
  agingBucket: 'current' | '1-30' | '31-60' | '61-90' | '91+';
}

export interface CustomerCreditAgingDetailReport {
  filters: Record<string, unknown>;
  generatedAt: string;
  totals: {
    items: number;
    customers: number;
    chargeAmountPsw: number;
    allocatedAmountPsw: number;
    outstandingAmountPsw: number;
  };
  rows: CustomerCreditAgingDetailReportRow[];
}

export interface ToBePaidOutstandingReportRow {
  parcelId: string;
  bookingCode: string;
  trackingCode: string;
  createdAt: string;
  status: number;
  sourceBranchId: string;
  sourceBranchName?: string | null;
  destinationBranchId: string;
  destinationBranchName?: string | null;
  senderName?: string | null;
  receiverName?: string | null;
  plannedToBePaidPsw: number;
  paidPrincipalPsw: number;
  outstandingPsw: number;
}

export interface ToBePaidOutstandingReport {
  filters: Record<string, unknown>;
  generatedAt: string;
  totals: {
    parcels: number;
    plannedToBePaidPsw: number;
    paidPrincipalPsw: number;
    outstandingPsw: number;
  };
  rows: ToBePaidOutstandingReportRow[];
}

export interface ToBePaidCollectionsReconciliationReportRow {
  parcelId: string;
  bookingCode: string;
  trackingCode: string;
  createdAt: string;
  status: number;
  sourceBranchId: string;
  sourceBranchName?: string | null;
  destinationBranchId: string;
  destinationBranchName?: string | null;
  senderName?: string | null;
  receiverName?: string | null;
  plannedToBePaidPsw: number;
  collectedPrincipalPsw: number;
  creditedPrincipalPsw: number;
  recognizedPrincipalPsw: number;
  outstandingPsw: number;
  variancePsw: number;
}

export interface ToBePaidCollectionsReconciliationReport {
  filters: Record<string, unknown>;
  generatedAt: string;
  totals: {
    parcels: number;
    plannedToBePaidPsw: number;
    collectedPrincipalPsw: number;
    creditedPrincipalPsw: number;
    recognizedPrincipalPsw: number;
    outstandingPsw: number;
    variancePsw: number;
  };
  rows: ToBePaidCollectionsReconciliationReportRow[];
}

export interface StorageWaiverFinancialReportRow {
  waiverId: string;
  parcelId: string;
  bookingCode: string;
  trackingCode: string;
  destinationBranchId: string;
  destinationBranchName?: string | null;
  waivedAmountPsw: number;
  reason: string;
  waivedByUserId: string;
  waivedByName?: string | null;
  waivedAt: string;
  accountingJournalEntryId?: string | null;
  accountingPostedAt?: string | null;
}

export interface StorageWaiverFinancialReport {
  filters: Record<string, unknown>;
  generatedAt: string;
  totals: {
    waivers: number;
    waivedAmountPsw: number;
    postedCount: number;
  };
  rows: StorageWaiverFinancialReportRow[];
}

export const reportingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getEmployeeMasterReport: builder.query<
      EmployeeMasterReport,
      {
        branchId?: string | null;
        departmentId?: string | null;
        status?: number | null;
        search?: string | null;
      }
    >({
      query: (params) => ({
        url: '/reports/employees',
        params,
      }),
    }),
    getAttendanceReport: builder.query<
      AttendanceReport,
      {
        from: string;
        to: string;
        employeeId?: string | null;
        branchId?: string | null;
      }
    >({
      query: (params) => ({
        url: '/reports/attendance',
        params,
      }),
    }),
    getLeaveRequestsReport: builder.query<
      LeaveRequestsReport,
      {
        from: string;
        to: string;
        employeeId?: string | null;
        status?: number | null;
      }
    >({
      query: (params) => ({
        url: '/reports/leave-requests',
        params,
      }),
    }),
    getPayrollRegisterReport: builder.query<PayrollRegisterReport, { payrollCycleId: string }>({
      query: (params) => ({
        url: '/reports/payroll-register',
        params,
      }),
    }),
    getPayrollOvertimeReport: builder.query<PayrollOvertimeReport, { payrollCycleId: string }>({
      query: (params) => ({
        url: '/reports/payroll-overtime',
        params,
      }),
    }),
    getPayrollAdjustmentsReport: builder.query<
      PayrollAdjustmentsReport,
      { payrollCycleId: string }
    >({
      query: (params) => ({
        url: '/reports/payroll-adjustments',
        params,
      }),
    }),
    getPayrollJournalReconciliationReport: builder.query<
      PayrollJournalReconciliationReport,
      { payrollCycleId: string }
    >({
      query: (params) => ({
        url: '/reports/payroll-journal-reconciliation',
        params,
      }),
    }),
    getDailyCashConfirmationReport: builder.query<
      DailyCashConfirmationReport,
      {
        branchId?: string | null;
        from: string;
        to: string;
        status?: number | null;
      }
    >({
      query: (params) => ({
        url: '/reports/daily-cash-confirmations',
        params,
      }),
    }),
    getExpenseByCategoryReport: builder.query<
      ExpenseByCategoryReport,
      {
        branchId?: string | null;
        from: string;
        to: string;
        status?: number | null;
      }
    >({
      query: (params) => ({
        url: '/reports/expense-by-category',
        params,
      }),
    }),
    getDeliveryPerformanceReport: builder.query<
      DeliveryPerformanceReport,
      {
        branchId?: string | null;
        riderUserId?: string | null;
        from: string;
        to: string;
      }
    >({
      query: (params) => ({
        url: '/reports/delivery-performance',
        params,
      }),
    }),
    getParcelStatusSummaryReport: builder.query<
      ParcelStatusSummaryReport,
      {
        branchId?: string | null;
        from?: string | null;
        to?: string | null;
      }
    >({
      query: (params) => ({
        url: '/reports/parcel-status-summary',
        params,
      }),
    }),
    getShiftRevenueReport: builder.query<
      ShiftRevenueReport,
      {
        branchId?: string | null;
        locationId?: string | null;
        shiftSessionId?: string | null;
        from: string;
        to: string;
      }
    >({
      query: (params) => ({
        url: '/reports/shift-revenue',
        params,
      }),
    }),
    getDailyCashierSalesReport: builder.query<
      DailyCashierSalesReport,
      {
        date: string;
        branchId?: string | null;
        locationId?: string | null;
        cashierUserId?: string | null;
        cashierType?: number | null;
      }
    >({
      query: (params) => ({
        url: '/reports/daily-cashier-sales',
        params,
      }),
    }),
    listDailyCashierSalesCashiers: builder.query<
      DailyCashierSalesCashierOption[],
      {
        date: string;
        branchId?: string | null;
        locationId?: string | null;
        cashierType?: number | null;
      }
    >({
      query: (params) => ({
        url: '/reports/daily-cashier-sales/cashiers',
        params,
      }),
    }),
    getBranchProfitabilityReport: builder.query<
      BranchProfitabilityReport,
      {
        branchId?: string | null;
        from: string;
        to: string;
      }
    >({
      query: (params) => ({
        url: '/reports/branch-profitability',
        params,
      }),
    }),
    getCreditExposureReport: builder.query<
      CreditExposureReport,
      {
        branchId?: string | null;
        agingBucket?: string | null;
      }
    >({
      query: (params) => ({
        url: '/reports/credit-exposure',
        params,
      }),
    }),
    getCustomerCreditAgingDetailReport: builder.query<
      CustomerCreditAgingDetailReport,
      {
        customerId?: string | null;
        agingBucket?: string | null;
        from?: string | null;
        to?: string | null;
      }
    >({
      query: (params) => ({
        url: '/reports/customer-credit-aging-detail',
        params,
      }),
    }),
    getToBePaidOutstandingReport: builder.query<
      ToBePaidOutstandingReport,
      {
        sourceBranchId?: string | null;
        destinationBranchId?: string | null;
        from?: string | null;
        to?: string | null;
      }
    >({
      query: (params) => ({
        url: '/reports/tobepaid-outstanding',
        params,
      }),
    }),
    getToBePaidCollectionsReconciliationReport: builder.query<
      ToBePaidCollectionsReconciliationReport,
      {
        sourceBranchId?: string | null;
        destinationBranchId?: string | null;
        from?: string | null;
        to?: string | null;
      }
    >({
      query: (params) => ({
        url: '/reports/tobepaid-collections-reconciliation',
        params,
      }),
    }),
    getStorageWaiverFinancialReport: builder.query<
      StorageWaiverFinancialReport,
      {
        branchId?: string | null;
        from: string;
        to: string;
      }
    >({
      query: (params) => ({
        url: '/reports/accounting/storage-waivers',
        params,
      }),
    }),
  }),
});

export const {
  useGetEmployeeMasterReportQuery,
  useGetAttendanceReportQuery,
  useGetLeaveRequestsReportQuery,
  useGetPayrollRegisterReportQuery,
  useGetPayrollOvertimeReportQuery,
  useGetPayrollAdjustmentsReportQuery,
  useGetPayrollJournalReconciliationReportQuery,
  useGetDailyCashConfirmationReportQuery,
  useGetExpenseByCategoryReportQuery,
  useGetDeliveryPerformanceReportQuery,
  useGetParcelStatusSummaryReportQuery,
  useGetShiftRevenueReportQuery,
  useGetDailyCashierSalesReportQuery,
  useListDailyCashierSalesCashiersQuery,
  useGetBranchProfitabilityReportQuery,
  useGetCreditExposureReportQuery,
  useGetCustomerCreditAgingDetailReportQuery,
  useGetToBePaidOutstandingReportQuery,
  useGetToBePaidCollectionsReconciliationReportQuery,
  useGetStorageWaiverFinancialReportQuery,
} = reportingApi;
