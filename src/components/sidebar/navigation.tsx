import { type LucideIconProps } from '@/components/ui';
import {
  PermissionKeys,
  type PermissionKey,
  RoutePermissionOverrides,
} from '@/shared/permissions/constants';

// Define the sub-item structure for nested menu items.
interface SubItem {
  title: string;
  url?: string;
  icon?: LucideIconProps;
  permissionKey?: PermissionKey;
  hiddenInSidebar?: boolean;
  children?: SubItem[];
}

// Define the main menu item structure.
export interface MenuItem {
  title: string;
  url?: string;
  icon: LucideIconProps;
  isActive?: boolean;
  permissionKey?: PermissionKey;
  hiddenInSidebar?: boolean;
  items?: SubItem[]; // Optional array of sub-items.
}

// Define the structure for each main route section.
export interface Route {
  title: string;
  menu: MenuItem[];
}

const IMPLEMENTED_STANDALONE_REPORT_URLS = new Set<string>([
  '/reports/financial/trial-balance',
  '/reports/financial/account-statement',
  '/reports/financial/income-statement',
  '/reports/financial/profit-loss',
  '/reports/financial/balance-sheet',
  '/reports/financial/cash-flow',
  '/reports/financial/general-ledger',
  '/reports/financial/journal-listing',
  '/reports/financial/account-activity',
  '/reports/branch/monthly-summary',
  '/reports/branch/profit-summary',
  '/reports/payroll/register-employee',
  '/reports/payroll/earnings',
  '/reports/payroll/deductions',
  '/reports/payroll/overtime',
  '/reports/payroll/journal-posting',
  '/reports/hr/master-list',
  '/reports/attendance/daily',
  '/reports/leave/requests',
  '/reports/expenses/by-category',
  '/reports/cash/daily-confirmation',
  '/reports/customers/statement',
  '/reports/customers/credit-summary',
  '/reports/customers/aging',
  '/reports/parcels/register',
  '/reports/parcels/delivered',
  '/reports/transfers/pending',
  '/reports/transfers/acknowledged',
  '/reports/cashier/shifts',
  '/reports/cashier/revenue',
]);

function isImplementedReportUrl(url?: string) {
  if (!url) return true;
  if (!url.startsWith('/reports/')) return true;
  return IMPLEMENTED_STANDALONE_REPORT_URLS.has(url);
}

function filterSubItems(items?: SubItem[]): SubItem[] | undefined {
  if (!items?.length) return items;
  const filtered: SubItem[] = [];
  for (const item of items) {
    const nextChildren = filterSubItems(item.children);
    const keepByUrl = isImplementedReportUrl(item.url);
    const hasChildren = Boolean(nextChildren?.length);
    if (!keepByUrl && !hasChildren) continue;
    filtered.push({ ...item, children: nextChildren });
  }
  return filtered.length ? filtered : undefined;
}

function applyPermissionOverridesToSubItem(item: SubItem): SubItem {
  const override = item.url ? RoutePermissionOverrides[item.url] : undefined;
  return {
    ...item,
    permissionKey: override ?? item.permissionKey,
    children: item.children?.map(applyPermissionOverridesToSubItem),
  };
}

function applyPermissionOverridesToMenuItem(menuItem: MenuItem): MenuItem {
  const override = menuItem.url ? RoutePermissionOverrides[menuItem.url] : undefined;
  return {
    ...menuItem,
    permissionKey: override ?? menuItem.permissionKey,
    items: menuItem.items?.map(applyPermissionOverridesToSubItem),
  };
}

const BASE_ROUTES: Route[] = [
  {
    title: 'Main',
    menu: [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: 'LayoutDashboard',
      },
      {
        title: 'Super Search',
        url: '/parcels',
        icon: 'Package',
        permissionKey: PermissionKeys.CanReadParcels,
      },
    ],
  },
  {
    title: 'Operations',
    menu: [
      {
        title: 'Sending',
        icon: 'PackagePlus',
        permissionKey: PermissionKeys.CanReadParcelSendingModule,
        items: [
          {
            title: 'Create Parcel',
            url: '/parcels/create',
            permissionKey: PermissionKeys.CanCreateBookingWithParcels,
          },
          {
            title: 'Sender Payments',
            url: '/parcels/sender-payments',
            permissionKey: PermissionKeys.CanCreateSenderPayments,
          },
          {
            title: 'Processed Consignments',
            url: '/parcels/processed',
            permissionKey: PermissionKeys.CanReadConsignments,
          },
          {
            title: 'In Transit (Outgoing)',
            url: '/parcels/in-transit/outgoing',
            permissionKey: PermissionKeys.CanReadParcelOutgoing,
          },
        ],
      },
      {
        title: 'Receiving',
        icon: 'PackageCheck',
        permissionKey: PermissionKeys.CanReadParcelReceivingModule,
        items: [
          {
            title: 'In Transit (Incoming)',
            url: '/parcels/in-transit/incoming',
            permissionKey: PermissionKeys.CanReadParcelIncoming,
          },
          {
            title: 'Scan to Receive',
            url: '/parcels/receive',
            permissionKey: PermissionKeys.CanReadParcelScan,
          },
          {
            title: 'Internal Transfers',
            url: '/parcels/internal-transfers',
            permissionKey: PermissionKeys.CanReadParcelInternalTransfers,
          },
          {
            title: 'Transfer Acknowledgement',
            url: '/parcels/internal-transfers/acknowledge',
            permissionKey: PermissionKeys.CanReadParcelInternalTransfers,
          },
          {
            title: 'Pickup Queue',
            url: '/parcels/pickup-queue',
            permissionKey: PermissionKeys.CanCreatePickupQueue,
          },
          {
            title: 'Queue Board (Sender)',
            url: '/parcels/pickup-queue/sender',
            permissionKey: PermissionKeys.CanReadSenderPickupQueue,
          },
          {
            title: 'Waiting for Pickup',
            url: '/parcels/waiting-pickup',
            permissionKey: PermissionKeys.CanCompleteOfficePickup,
          },
          {
            title: 'Queue Board (Receiver)',
            url: '/parcels/pickup-queue/receiver',
            permissionKey: PermissionKeys.CanReadReceiverPickupQueue,
          },
          {
            title: 'Receiver Cashier',
            url: '/parcels/receiver-cashier',
            permissionKey: PermissionKeys.CanCreateReceiverPayments,
          },
        ],
      },
      {
        title: 'Deliveries',
        icon: 'Truck',
        items: [
          {
            title: 'Dispatch Parcels',
            url: '/parcels/home-delivery/dispatch',
            permissionKey: PermissionKeys.CanDispatchForDelivery,
          },
          {
            title: 'Delivery Cashier',
            url: '/parcels/delivery-cashier',
            permissionKey: PermissionKeys.CanCompleteDoorstepDelivery,
          },
        ],
      },
      {
        title: 'Call Center',
        icon: 'Search',
        items: [
          {
            title: 'Parcel Status',
            url: '/parcels/status',
            permissionKey: PermissionKeys.CanReadCallCenterParcelStatus,
          },
          {
            title: 'Address Collection',
            url: '/parcels/home-delivery/address',
            permissionKey: PermissionKeys.CanMarkDoorstepCalled,
          },
        ],
      },
    ],
  },
  {
    title: 'CRM',
    menu: [
      {
        title: 'Customer Mgt',
        icon: 'Users',
        items: [
          {
            title: 'All Customers',
            url: '/customers',
            permissionKey: PermissionKeys.CanReadCustomers,
          },
          {
            title: 'Add Customer',
            url: '/customers/create',
            permissionKey: PermissionKeys.CanCreateCustomers,
          },
        ],
      },
    ],
  },
  {
    title: 'Finance',
    menu: [
      {
        title: 'Accounting',
        icon: 'BookOpen',
        items: [
          {
            title: 'Daily Cash',
            url: '/accounting/daily-cash',
            permissionKey: PermissionKeys.CanCreateDailyCashConfirmation,
          },
          {
            title: 'Expenses',
            url: '/accounting/expenses',
            permissionKey: PermissionKeys.CanCreateExpenseRequest,
          },
          {
            title: 'Reports',
            url: '/accounting/reports',
            permissionKey: PermissionKeys.CanReadAccounting,
          },
          {
            title: 'Accounting Setup',
            url: '/accounting/setup',
            permissionKey: PermissionKeys.CanReadAccountingSetup,
          },
          {
            title: 'Journal Entries',
            url: '/accounting/journal-entries',
            permissionKey: PermissionKeys.CanReadAccountingManualEntries,
          },
          {
            title: 'Journal Approvals',
            url: '/accounting/journal-approvals',
            permissionKey: PermissionKeys.CanApproveAccountingManualEntries,
          },
        ],
      },
      {
        title: 'Taxes',
        icon: 'Receipt',
        items: [
          {
            title: 'Tax Filing',
            url: '/accounting/tax',
            permissionKey: PermissionKeys.CanCreateTaxFilingPeriod,
          },
        ],
      },
      {
        title: 'Payroll',
        icon: 'BadgeDollarSign',
        items: [
          {
            title: 'Compensation Setup',
            url: '/payroll/compensation',
            permissionKey: PermissionKeys.CanReadCompensation,
          },
          {
            title: 'Payroll Groups',
            url: '/payroll/groups',
            permissionKey: PermissionKeys.CanReadPayrollGroups,
          },
          {
            title: 'Payroll Cycles',
            url: '/payroll/cycles',
            permissionKey: PermissionKeys.CanListPayrollCycles,
          },
          {
            title: 'Payroll Inputs',
            url: '/payroll/inputs',
            permissionKey: PermissionKeys.CanReadPayrollInputs,
          },
        ],
      },
      {
        title: 'Cashier Sessions',
        icon: 'Wallet',
        items: [
          {
            title: 'Active Sessions',
            url: '/cashier/sessions/active',
            permissionKey: PermissionKeys.CanReadActiveCashierSessions,
          },
          {
            title: 'Session History',
            url: '/cashier/sessions/history',
            permissionKey: PermissionKeys.CanReadCashierSessionsHistory,
          },
          {
            title: 'Open Session',
            url: '/cashier/sessions/open',
            permissionKey: PermissionKeys.CanReadOpenCashierSessions,
          },
          {
            title: 'Close Session',
            url: '/cashier/sessions/close',
            permissionKey: PermissionKeys.CanReadCloseCashierSessions,
          },
        ],
      },
    ],
  },
  {
    title: 'HR',
    menu: [
      {
        title: 'Employees',
        url: '/hr/employees',
        icon: 'Briefcase',
        permissionKey: PermissionKeys.CanListEmployees,
      },
      {
        title: 'Departments',
        url: '/hr/departments',
        icon: 'Network',
        permissionKey: PermissionKeys.CanReadDepartments,
      },
      {
        title: 'Job Titles',
        url: '/hr/job-titles',
        icon: 'UserCog',
        permissionKey: PermissionKeys.CanReadJobTitles,
      },
      {
        title: 'Attendance',
        url: '/hr/attendance',
        icon: 'Clock3',
        permissionKey: PermissionKeys.CanReadAttendance,
      },
      {
        title: 'Leave Mgt',
        url: '/hr/leave',
        icon: 'CalendarDays',
        permissionKey: PermissionKeys.CanReadLeaveRequests,
      },
    ],
  },
  {
    title: 'IT',
    menu: [
      {
        title: 'User Management',
        icon: 'UserCog',
        items: [
          {
            title: 'All Users',
            url: '/users',
            permissionKey: PermissionKeys.CanReadUsers,
          },
          {
            title: 'Add User',
            url: '/users/create',
            permissionKey: PermissionKeys.CanCreateUsers,
          },
          {
            title: 'Active Users',
            url: '/users/active',
            permissionKey: PermissionKeys.CanReadActiveUsers,
          },
          {
            title: 'Inactive Users',
            url: '/users/inactive',
            permissionKey: PermissionKeys.CanReadInactiveUsers,
          },
          {
            title: 'User Invites',
            url: '/users/invites',
            permissionKey: PermissionKeys.CanResendSetupInvite,
          },
        ],
      },
      {
        title: 'Role Management',
        icon: 'Shield',
        items: [
          {
            title: 'Manage Roles',
            url: '/roles',
            permissionKey: PermissionKeys.CanReadRoles,
          },
          {
            title: 'Permissions',
            url: '/permissions',
            permissionKey: PermissionKeys.CanReadPermissions,
          },
        ],
      },
      {
        title: 'Riders',
        icon: 'Bike',
        items: [
          {
            title: 'Current Status',
            url: '/parcels/rider/current',
            permissionKey: PermissionKeys.CanReadRiderCurrentParcels,
          },
          {
            title: 'History',
            url: '/parcels/rider/history',
            permissionKey: PermissionKeys.CanReadRiderHistory,
          },
        ],
      },
    ],
  },
  {
    title: 'Setups',
    menu: [
      {
        title: 'Company Setup',
        icon: 'Building',
        items: [
          {
            title: 'Company Profile',
            url: '/settings/company',
            permissionKey: PermissionKeys.CanReadCompanyProfile,
          },
          {
            title: 'Module Management',
            url: '/settings/modules',
            permissionKey: PermissionKeys.CanManageCompanyModules,
          },
          {
            title: 'Branch Management',
            url: '/branches',
            permissionKey: PermissionKeys.CanReadBranches,
          },
          {
            title: 'Location Management',
            url: '/locations',
            permissionKey: PermissionKeys.CanReadLocations,
          },
          {
            title: 'Warehouse Management',
            url: '/warehouses',
            permissionKey: PermissionKeys.CanReadWarehouses,
          },
          {
            title: 'Card Management',
            url: '/settings/cards',
            permissionKey: PermissionKeys.CanReadCards,
          },
          {
            title: 'Appearance',
            url: '/settings/appearance',
            permissionKey: PermissionKeys.CanManageAppearance,
          },
          {
            title: 'App Updates',
            url: '/settings/app-updates',
            permissionKey: PermissionKeys.CanManageDesktopUpdates,
          },
        ],
      },
      {
        title: 'Inventory Setup',
        icon: 'Package2',
        items: [
          {
            title: 'All Inventory',
            url: '/inventory',
            permissionKey: PermissionKeys.CanReadInventoryOverview,
          },
          {
            title: 'Products',
            url: '/inventory/products',
            permissionKey: PermissionKeys.CanReadProducts,
          },
          {
            title: 'Categories',
            url: '/inventory/categories',
            permissionKey: PermissionKeys.CanReadProductCategories,
          },
          {
            title: 'Locations',
            url: '/inventory/locations',
            permissionKey: PermissionKeys.CanReadInventoryLocations,
          },
          {
            title: 'Stock Levels',
            url: '/inventory/stock-levels',
            permissionKey: PermissionKeys.CanReadStockLevels,
          },
          {
            title: 'Stock Movements',
            url: '/inventory/stock-movements',
            permissionKey: PermissionKeys.CanReadStockMovements,
          },
          {
            title: 'Stock Adjustments',
            url: '/inventory/stock-adjustments',
            permissionKey: PermissionKeys.CanReadStockAdjustments,
          },
          {
            title: 'Stock Transfers',
            url: '/inventory/stock-transfers',
            permissionKey: PermissionKeys.CanReadStockTransfers,
          },
        ],
      },
    ],
  },
  {
    title: 'Reports',
    menu: [
      {
        title: 'Financial Reports',
        icon: 'ChartBar',
        items: [
          {
            title: 'Trial Balance',
            url: '/reports/financial/trial-balance',
            permissionKey: PermissionKeys.CanViewReportFinancialTrialBalance,
          },
          {
            title: 'Account Statement',
            url: '/reports/financial/account-statement',
            permissionKey: PermissionKeys.CanViewReportFinancialAccountStatement,
          },
          {
            title: 'Income Statement',
            url: '/reports/financial/income-statement',
            permissionKey: PermissionKeys.CanViewReportFinancialIncomeStatement,
          },
          {
            title: 'Profit & Loss',
            url: '/reports/financial/profit-loss',
            permissionKey: PermissionKeys.CanViewReportFinancialProfitLoss,
          },
          {
            title: 'Balance Sheet',
            url: '/reports/financial/balance-sheet',
            permissionKey: PermissionKeys.CanViewReportFinancialBalanceSheet,
          },
          {
            title: 'Cash Flow',
            url: '/reports/financial/cash-flow',
            permissionKey: PermissionKeys.CanViewReportFinancialCashFlow,
          },
          {
            title: 'General Ledger',
            url: '/reports/financial/general-ledger',
            permissionKey: PermissionKeys.CanViewReportFinancialGeneralLedger,
          },
          {
            title: 'Journal Listing',
            url: '/reports/financial/journal-listing',
            permissionKey: PermissionKeys.CanViewReportFinancialJournalListing,
          },
          {
            title: 'Account Activity',
            url: '/reports/financial/account-activity',
            permissionKey: PermissionKeys.CanViewReportFinancialAccountActivity,
          },
        ],
      },

      {
        title: 'Branch & Performance',
        icon: 'Building2',
        items: [
          {
            title: 'Monthly Branch Summary',
            url: '/reports/branch/monthly-summary',
            permissionKey: PermissionKeys.CanViewReportBranchMonthlySummary,
          },
          {
            title: 'Branch Revenue',
            url: '/reports/branch/revenue',
            permissionKey: PermissionKeys.CanViewReportBranchRevenue,
          },
          {
            title: 'Branch Expense',
            url: '/reports/branch/expense',
            permissionKey: PermissionKeys.CanViewReportBranchExpense,
          },
          {
            title: 'Branch Profit Summary',
            url: '/reports/branch/profit-summary',
            permissionKey: PermissionKeys.CanViewReportBranchProfitSummary,
          },
          {
            title: 'Payroll Cost by Branch',
            url: '/reports/branch/payroll-cost',
            permissionKey: PermissionKeys.CanViewReportBranchPayrollCost,
          },
        ],
      },

      {
        title: 'Payroll & Payslips',
        icon: 'Wallet',
        items: [
          {
            title: 'Payslip',
            url: '/reports/payroll/payslip',
            permissionKey: PermissionKeys.CanViewReportPayrollPayslip,
          },
          {
            title: 'Payroll Cycle Summary',
            url: '/reports/payroll/cycle-summary',
            permissionKey: PermissionKeys.CanViewReportPayrollCycleSummary,
          },
          {
            title: 'Gross to Net',
            url: '/reports/payroll/gross-to-net',
            permissionKey: PermissionKeys.CanViewReportPayrollGrossToNet,
          },
          {
            title: 'Payroll Register (Employee)',
            url: '/reports/payroll/register-employee',
            permissionKey: PermissionKeys.CanViewReportPayrollRegisterEmployee,
          },
          {
            title: 'Payroll Register (Branch)',
            url: '/reports/payroll/register-branch',
            permissionKey: PermissionKeys.CanViewReportPayrollRegisterBranch,
          },
          {
            title: 'Payroll Register (Department)',
            url: '/reports/payroll/register-department',
            permissionKey: PermissionKeys.CanViewReportPayrollRegisterDepartment,
          },
          {
            title: 'Earnings Report',
            url: '/reports/payroll/earnings',
            permissionKey: PermissionKeys.CanViewReportPayrollEarnings,
          },
          {
            title: 'Deductions Report',
            url: '/reports/payroll/deductions',
            permissionKey: PermissionKeys.CanViewReportPayrollDeductions,
          },
          {
            title: 'Overtime Report',
            url: '/reports/payroll/overtime',
            permissionKey: PermissionKeys.CanViewReportPayrollOvertime,
          },
          {
            title: 'Payroll Comparison',
            url: '/reports/payroll/comparison',
            permissionKey: PermissionKeys.CanViewReportPayrollComparison,
          },
          {
            title: 'Bank Payment Schedule',
            url: '/reports/payroll/bank-schedule',
            permissionKey: PermissionKeys.CanViewReportPayrollBankSchedule,
          },
          {
            title: 'Mobile Money Schedule',
            url: '/reports/payroll/momo-schedule',
            permissionKey: PermissionKeys.CanViewReportPayrollMomoSchedule,
          },
          {
            title: 'Cash Payment Schedule',
            url: '/reports/payroll/cash-schedule',
            permissionKey: PermissionKeys.CanViewReportPayrollCashSchedule,
          },
          {
            title: 'Payroll Journal Posting',
            url: '/reports/payroll/journal-posting',
            permissionKey: PermissionKeys.CanViewReportPayrollJournalPosting,
          },
        ],
      },

      {
        title: 'HR & Employees',
        icon: 'Users',
        items: [
          {
            title: 'Employee Master List',
            url: '/reports/hr/master-list',
            permissionKey: PermissionKeys.CanViewReportHrMasterList,
          },
          {
            title: 'Employee Profile Sheet',
            url: '/reports/hr/profile-sheet',
            permissionKey: PermissionKeys.CanViewReportHrProfileSheet,
          },
          {
            title: 'Employee Contact List',
            url: '/reports/hr/contact-list',
            permissionKey: PermissionKeys.CanViewReportHrContactList,
          },
          {
            title: 'Employee by Department',
            url: '/reports/hr/by-department',
            permissionKey: PermissionKeys.CanViewReportHrByDepartment,
          },
          {
            title: 'Employee by Job Title',
            url: '/reports/hr/by-job-title',
            permissionKey: PermissionKeys.CanViewReportHrByJobTitle,
          },
          {
            title: 'Employee by Status',
            url: '/reports/hr/by-status',
            permissionKey: PermissionKeys.CanViewReportHrByStatus,
          },
          {
            title: 'New Hires',
            url: '/reports/hr/new-hires',
            permissionKey: PermissionKeys.CanViewReportHrNewHires,
          },
          {
            title: 'Confirmed Employees',
            url: '/reports/hr/confirmed',
            permissionKey: PermissionKeys.CanViewReportHrConfirmed,
          },
          {
            title: 'Terminated/Resigned',
            url: '/reports/hr/terminated',
            permissionKey: PermissionKeys.CanViewReportHrTerminated,
          },
          {
            title: 'Manager-Subordinate',
            url: '/reports/hr/hierarchy',
            permissionKey: PermissionKeys.CanViewReportHrHierarchy,
          },
        ],
      },

      {
        title: 'Attendance & Leave',
        icon: 'CalendarCheck',
        items: [
          {
            title: 'Daily Attendance',
            url: '/reports/attendance/daily',
            permissionKey: PermissionKeys.CanViewReportAttendanceDaily,
          },
          {
            title: 'Monthly Attendance',
            url: '/reports/attendance/monthly',
            permissionKey: PermissionKeys.CanViewReportAttendanceMonthly,
          },
          {
            title: 'Late Arrivals',
            url: '/reports/attendance/late',
            permissionKey: PermissionKeys.CanViewReportAttendanceLate,
          },
          {
            title: 'Absence Report',
            url: '/reports/attendance/absence',
            permissionKey: PermissionKeys.CanViewReportAttendanceAbsence,
          },
          {
            title: 'Worked Hours',
            url: '/reports/attendance/worked-hours',
            permissionKey: PermissionKeys.CanViewReportAttendanceWorkedHours,
          },
          {
            title: 'Check-in/Out Details',
            url: '/reports/attendance/checkin-checkout',
            permissionKey: PermissionKeys.CanViewReportAttendanceCheckinCheckout,
          },
          {
            title: 'Leave Requests',
            url: '/reports/leave/requests',
            permissionKey: PermissionKeys.CanViewReportLeaveRequests,
          },
          {
            title: 'Leave Approval Status',
            url: '/reports/leave/status',
            permissionKey: PermissionKeys.CanViewReportLeaveStatus,
          },
          {
            title: 'Leave by Employee',
            url: '/reports/leave/by-employee',
            permissionKey: PermissionKeys.CanViewReportLeaveByEmployee,
          },
          {
            title: 'Leave Calendar',
            url: '/reports/leave/calendar',
            permissionKey: PermissionKeys.CanViewReportLeaveCalendar,
          },
        ],
      },

      {
        title: 'Expenses & Cash',
        icon: 'Receipt',
        items: [
          {
            title: 'Expense Requests',
            url: '/reports/expenses/requests',
            permissionKey: PermissionKeys.CanViewReportExpensesRequests,
          },
          {
            title: 'Approved Expenses',
            url: '/reports/expenses/approved',
            permissionKey: PermissionKeys.CanViewReportExpensesApproved,
          },
          {
            title: 'Paid Expenses',
            url: '/reports/expenses/paid',
            permissionKey: PermissionKeys.CanViewReportExpensesPaid,
          },
          {
            title: 'Unpaid Expenses',
            url: '/reports/expenses/unpaid',
            permissionKey: PermissionKeys.CanViewReportExpensesUnpaid,
          },
          {
            title: 'Expense by Category',
            url: '/reports/expenses/by-category',
            permissionKey: PermissionKeys.CanViewReportExpensesByCategory,
          },
          {
            title: 'Cash Confirmation',
            url: '/reports/cash/daily-confirmation',
            permissionKey: PermissionKeys.CanViewReportCashDailyConfirmation,
          },
          {
            title: 'Cash Variance',
            url: '/reports/cash/variance',
            permissionKey: PermissionKeys.CanViewReportCashVariance,
          },
          {
            title: 'Cash Overage',
            url: '/reports/cash/overage',
            permissionKey: PermissionKeys.CanViewReportCashOverage,
          },
          {
            title: 'Cash Shortage',
            url: '/reports/cash/shortage',
            permissionKey: PermissionKeys.CanViewReportCashShortage,
          },
        ],
      },

      {
        title: 'Customers & CRM',
        icon: 'UserRound',
        items: [
          {
            title: 'Customer Master List',
            url: '/reports/customers/master-list',
            permissionKey: PermissionKeys.CanViewReportCustomersMasterList,
          },
          {
            title: 'Customer Statement',
            url: '/reports/customers/statement',
            permissionKey: PermissionKeys.CanViewReportCustomersStatement,
          },
          {
            title: 'Customer Transactions',
            url: '/reports/customers/transactions',
            permissionKey: PermissionKeys.CanViewReportCustomersTransactions,
          },
          {
            title: 'Customer Payments',
            url: '/reports/customers/payments',
            permissionKey: PermissionKeys.CanViewReportCustomersPayments,
          },
          {
            title: 'Customer Credit Summary',
            url: '/reports/customers/credit-summary',
            permissionKey: PermissionKeys.CanViewReportCustomersCreditSummary,
          },
          {
            title: 'Customer Aging',
            url: '/reports/customers/aging',
            permissionKey: PermissionKeys.CanViewReportCustomersAging,
          },
          {
            title: 'Top Customers',
            url: '/reports/customers/top',
            permissionKey: PermissionKeys.CanViewReportCustomersTop,
          },
          {
            title: 'Inactive Customers',
            url: '/reports/customers/inactive',
            permissionKey: PermissionKeys.CanViewReportCustomersInactive,
          },
        ],
      },

      {
        title: 'Parcels & Logistics',
        icon: 'Truck',
        items: [
          {
            title: 'Booking Register',
            url: '/reports/parcels/bookings',
            permissionKey: PermissionKeys.CanViewReportParcelsBookings,
          },
          {
            title: 'Parcel Register',
            url: '/reports/parcels/register',
            permissionKey: PermissionKeys.CanViewReportParcelsRegister,
          },
          {
            title: 'Parcel Tracking',
            url: '/reports/parcels/tracking',
            permissionKey: PermissionKeys.CanViewReportParcelsTracking,
          },
          {
            title: 'In-Transit Outgoing',
            url: '/reports/parcels/in-transit-out',
            permissionKey: PermissionKeys.CanViewReportParcelsInTransitOutgoing,
          },
          {
            title: 'In-Transit Incoming',
            url: '/reports/parcels/in-transit-in',
            permissionKey: PermissionKeys.CanViewReportParcelsInTransitIncoming,
          },
          {
            title: 'Delivered Parcels',
            url: '/reports/parcels/delivered',
            permissionKey: PermissionKeys.CanViewReportParcelsDelivered,
          },
          {
            title: 'Undelivered Parcels',
            url: '/reports/parcels/failed',
            permissionKey: PermissionKeys.CanViewReportParcelsFailed,
          },
          {
            title: 'Parcel Aging',
            url: '/reports/parcels/aging',
            permissionKey: PermissionKeys.CanViewReportParcelsAging,
          },
          {
            title: 'Uncollected Parcels',
            url: '/reports/parcels/uncollected',
            permissionKey: PermissionKeys.CanViewReportParcelsUncollected,
          },
        ],
      },

      {
        title: 'Consignments & Transfers',
        icon: 'Repeat',
        items: [
          {
            title: 'Consignment Manifest',
            url: '/reports/consignments/manifest',
            permissionKey: PermissionKeys.CanViewReportConsignmentsManifest,
          },
          {
            title: 'Consignment Summary',
            url: '/reports/consignments/summary',
            permissionKey: PermissionKeys.CanViewReportConsignmentsSummary,
          },
          {
            title: 'Branch Dispatch Manifest',
            url: '/reports/consignments/dispatch',
            permissionKey: PermissionKeys.CanViewReportConsignmentsDispatch,
          },
          {
            title: 'Branch Receiving Manifest',
            url: '/reports/consignments/receiving',
            permissionKey: PermissionKeys.CanViewReportConsignmentsReceiving,
          },
          {
            title: 'Internal Transfers',
            url: '/reports/transfers/internal',
            permissionKey: PermissionKeys.CanViewReportTransfersInternal,
          },
          {
            title: 'Pending Transfers',
            url: '/reports/transfers/pending',
            permissionKey: PermissionKeys.CanViewReportTransfersPending,
          },
          {
            title: 'Acknowledged Transfers',
            url: '/reports/transfers/acknowledged',
            permissionKey: PermissionKeys.CanViewReportTransfersAcknowledged,
          },
        ],
      },

      {
        title: 'Cashier & Shift',
        icon: 'Clock',
        items: [
          {
            title: 'Shift Sessions',
            url: '/reports/cashier/shifts',
            permissionKey: PermissionKeys.CanViewReportCashierShifts,
          },
          {
            title: 'Open Shifts',
            url: '/reports/cashier/open-shifts',
            permissionKey: PermissionKeys.CanViewReportCashierOpenShifts,
          },
          {
            title: 'Closed Shifts',
            url: '/reports/cashier/closed-shifts',
            permissionKey: PermissionKeys.CanViewReportCashierClosedShifts,
          },
          {
            title: 'Shift Revenue',
            url: '/reports/cashier/revenue',
            permissionKey: PermissionKeys.CanViewReportCashierRevenue,
          },
          {
            title: 'Cashier Summary',
            url: '/reports/cashier/summary',
            permissionKey: PermissionKeys.CanViewReportCashierSummary,
          },
          {
            title: 'Cashier Variance',
            url: '/reports/cashier/variance',
            permissionKey: PermissionKeys.CanViewReportCashierVariance,
          },
          {
            title: 'Payment Method Mix',
            url: '/reports/cashier/payment-mix',
            permissionKey: PermissionKeys.CanViewReportCashierPaymentMix,
          },
        ],
      },

      {
        title: 'Inventory',
        icon: 'Package',
        items: [
          {
            title: 'Stock Levels',
            url: '/reports/inventory/stock-levels',
            permissionKey: PermissionKeys.CanViewReportInventoryStockLevels,
          },
          {
            title: 'Low Stock',
            url: '/reports/inventory/low-stock',
            permissionKey: PermissionKeys.CanViewReportInventoryLowStock,
          },
          {
            title: 'Stock Movement',
            url: '/reports/inventory/movement',
            permissionKey: PermissionKeys.CanViewReportInventoryMovement,
          },
          {
            title: 'Stock Adjustments',
            url: '/reports/inventory/adjustments',
            permissionKey: PermissionKeys.CanViewReportInventoryAdjustments,
          },
          {
            title: 'Stock Transfers',
            url: '/reports/inventory/transfers',
            permissionKey: PermissionKeys.CanViewReportInventoryTransfers,
          },
          {
            title: 'Inventory by Location',
            url: '/reports/inventory/by-location',
            permissionKey: PermissionKeys.CanViewReportInventoryByLocation,
          },
          {
            title: 'Product Master List',
            url: '/reports/inventory/products',
            permissionKey: PermissionKeys.CanViewReportInventoryProducts,
          },
        ],
      },

      {
        title: 'Audit & Control',
        icon: 'ShieldCheck',
        items: [
          {
            title: 'Audit Trail by User',
            url: '/reports/audit/user',
            permissionKey: PermissionKeys.CanViewReportAuditUser,
          },
          {
            title: 'Audit Trail by Module',
            url: '/reports/audit/module',
            permissionKey: PermissionKeys.CanViewReportAuditModule,
          },
          {
            title: 'Audit Trail by Entity',
            url: '/reports/audit/entity',
            permissionKey: PermissionKeys.CanViewReportAuditEntity,
          },
          {
            title: 'Suspicious Changes',
            url: '/reports/audit/suspicious',
            permissionKey: PermissionKeys.CanViewReportAuditSuspicious,
          },
          {
            title: 'Deleted Records',
            url: '/reports/audit/deleted',
            permissionKey: PermissionKeys.CanViewReportAuditDeleted,
          },
          {
            title: 'User Role Permissions',
            url: '/reports/audit/roles',
            permissionKey: PermissionKeys.CanViewReportAuditRoles,
          },
        ],
      },
    ],
  },
];

export const ROUTES: Route[] = BASE_ROUTES.map((route) => {
  const filteredMenu: MenuItem[] = [];
  for (const menuItem of route.menu) {
    const nextItems = filterSubItems(menuItem.items);
    const keepByUrl = isImplementedReportUrl(menuItem.url);
    const hasItems = Boolean(nextItems?.length);
    if (!keepByUrl && !hasItems) continue;
    filteredMenu.push(applyPermissionOverridesToMenuItem({ ...menuItem, items: nextItems }));
  }
  return { ...route, menu: filteredMenu };
}).filter((route) => route.menu.length > 0);
