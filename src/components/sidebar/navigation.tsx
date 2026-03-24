import { type LucideIconProps } from '@/components/ui';

// Define the sub-item structure for nested menu items.
interface SubItem {
  title: string;
  url?: string;
  icon?: LucideIconProps;
  permissionKey?: string;
  children?: SubItem[];
}

// Define the main menu item structure.
export interface MenuItem {
  title: string;
  url?: string;
  icon: LucideIconProps;
  isActive?: boolean;
  permissionKey?: string;
  items?: SubItem[]; // Optional array of sub-items.
}

// Define the structure for each main route section.
export interface Route {
  title: string;
  menu: MenuItem[];
}

export const ROUTES: Route[] = [
  {
    title: 'Main',
    menu: [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: 'LayoutDashboard',
      },
      {
        title: 'All Parcels',
        url: '/parcels',
        icon: 'Package',
      },
    ],
  },
  {
    title: 'Operations',
    menu: [
      {
        title: 'Sending',
        icon: 'PackagePlus',
        items: [
          {
            title: 'Create Parcel',
            url: '/parcels/create',
          },
          {
            title: 'Sender Payments',
            url: '/parcels/sender-payments',
          },
          {
            title: 'Processed Consignments',
            url: '/parcels/processed',
          },
          {
            title: 'In Transit (Outgoing)',
            url: '/parcels/in-transit/outgoing',
          },
        ],
      },
      {
        title: 'Receiving',
        icon: 'PackageCheck',
        items: [
          {
            title: 'In Transit (Incoming)',
            url: '/parcels/in-transit/incoming',
          },
          {
            title: 'Scan to Receive',
            url: '/parcels/receive',
          },
          {
            title: 'Internal Transfers',
            url: '/parcels/internal-transfers',
            permissionKey: 'CanReadParcelInternalTransfers',
          },
          {
            title: 'Transfer Acknowledgement',
            url: '/parcels/internal-transfers/acknowledge',
            permissionKey: 'CanReadParcelInternalTransfers',
          },
          {
            title: 'Pickup Queue',
            url: '/parcels/pickup-queue',
          },
          {
            title: 'Queue Board (Sender)',
            url: '/parcels/pickup-queue/sender',
          },
          {
            title: 'Waiting for Pickup',
            url: '/parcels/waiting-pickup',
          },
          {
            title: 'Queue Board (Receiver)',
            url: '/parcels/pickup-queue/receiver',
          },
          {
            title: 'Receiver Cashier',
            url: '/parcels/receiver-cashier',
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
          },
          {
            title: 'Delivery Cashier',
            url: '/parcels/delivery-cashier',
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
          },
          {
            title: 'Address Collection',
            url: '/parcels/home-delivery/address',
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
          },
          {
            title: 'Add Customer',
            url: '/customers/create',
          },
        ],
      },
    ],
  },
  {
    title: 'Finance',
    menu: [
      {
        title: 'Reports Center',
        url: '/reports',
        icon: 'FileText',
      },
      {
        title: 'Accounting',
        icon: 'BookOpen',
        items: [
          {
            title: 'Daily Cash',
            url: '/accounting/daily-cash',
            // permissionKey: 'CanPostAccountingEntries',
          },
          {
            title: 'Expenses',
            url: '/accounting/expenses',
            // permissionKey: 'CanPostAccountingEntries',
          },
          {
            title: 'Reports',
            url: '/accounting/reports',
            // permissionKey: 'CanReadAccounting',
          },
          {
            title: 'Accounting Setup',
            url: '/accounting/setup',
            // permissionKey: 'CanManageAccountingSetup',
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
            // permissionKey: 'CanManageTaxFiling',
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
            // permissionKey: 'CanReadCompensation',
          },
          {
            title: 'Payroll Groups',
            url: '/payroll/groups',
            // permissionKey: 'CanReadPayrollGroups',
          },
          {
            title: 'Payroll Cycles',
            url: '/payroll/cycles',
            // permissionKey: 'CanListPayrollCycles',
          },
          {
            title: 'Payroll Inputs',
            url: '/payroll/inputs',
            // permissionKey: 'CanReadPayrollInputs',
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
          },
          {
            title: 'Session History',
            url: '/cashier/sessions/history',
          },
          {
            title: 'Open Session',
            url: '/cashier/sessions/open',
          },
          {
            title: 'Close Session',
            url: '/cashier/sessions/close',
          },
        ],
      },
      {
        title: 'Cashiers',
        url: '/cashiers',
        icon: 'UsersRound',
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
        // permissionKey: 'CanListEmployees',
      },
      {
        title: 'Departments',
        url: '/hr/departments',
        icon: 'Network',
        // permissionKey: 'CanReadDepartments',
      },
      {
        title: 'Job Titles',
        url: '/hr/job-titles',
        icon: 'UserCog',
        // permissionKey: 'CanReadJobTitles',
      },
      {
        title: 'Attendance',
        url: '/hr/attendance',
        icon: 'Clock3',
        // permissionKey: 'CanListAttendance',
      },
      {
        title: 'Leave Mgt',
        url: '/hr/leave',
        icon: 'CalendarDays',
        // permissionKey: 'CanListLeaveRequests',
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
          },
          {
            title: 'Add User',
            url: '/users/create',
          },
          {
            title: 'Active Users',
            url: '/users/active',
          },
          {
            title: 'Inactive Users',
            url: '/users/inactive',
          },
          {
            title: 'User Invites',
            url: '/users/invites',
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
          },
          {
            title: 'Permissions',
            url: '/permissions',
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
          },
          {
            title: 'History',
            url: '/parcels/rider/history',
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
          },
          {
            title: 'Module Management',
            url: '/settings/modules',
            // permissionKey: 'CanManageCompanyModules',
          },
          {
            title: 'Branch Management',
            url: '/branches',
          },
          {
            title: 'Location Management',
            url: '/locations',
          },
          {
            title: 'Warehouse Management',
            url: '/warehouses',
            permissionKey: 'CanReadWarehouses',
          },
          {
            title: 'Status Management',
            url: '/statuses',
          },
          {
            title: 'Card Management',
            url: '/settings/cards',
          },
          {
            title: 'Appearance',
            url: '/settings/appearance',
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
          },
          {
            title: 'Products',
            url: '/inventory/products',
          },
          {
            title: 'Categories',
            url: '/inventory/categories',
            // permissionKey: 'CanListProductCategories',
          },
          {
            title: 'Locations',
            url: '/inventory/locations',
            // permissionKey: 'CanListProductLocations',
          },
          {
            title: 'Stock Levels',
            url: '/inventory/stock-levels',
            // permissionKey: 'CanListStockLevels',
          },
          {
            title: 'Stock Movements',
            url: '/inventory/stock-movements',
            // permissionKey: 'CanListStockMovements',
          },
          {
            title: 'Stock Adjustments',
            url: '/inventory/stock-adjustments',
            // permissionKey: 'CanListStockAdjustments',
          },
          {
            title: 'Stock Transfers',
            url: '/inventory/stock-transfers',
            // permissionKey: 'CanListStockTransfers',
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
          { title: 'Trial Balance', url: '/reports/financial/trial-balance' },
          { title: 'Account Statement', url: '/reports/financial/account-statement' },
          { title: 'Income Statement', url: '/reports/financial/income-statement' },
          { title: 'Profit & Loss', url: '/reports/financial/profit-loss' },
          { title: 'Balance Sheet', url: '/reports/financial/balance-sheet' },
          { title: 'Cash Flow', url: '/reports/financial/cash-flow' },
          { title: 'General Ledger', url: '/reports/financial/general-ledger' },
          { title: 'Journal Listing', url: '/reports/financial/journal-listing' },
          { title: 'Account Activity', url: '/reports/financial/account-activity' },
        ],
      },

      {
        title: 'Branch & Performance',
        icon: 'Building2',
        items: [
          { title: 'Monthly Branch Summary', url: '/reports/branch/monthly-summary' },
          { title: 'Branch Revenue', url: '/reports/branch/revenue' },
          { title: 'Branch Expense', url: '/reports/branch/expense' },
          { title: 'Branch Profit Summary', url: '/reports/branch/profit-summary' },
          { title: 'Payroll Cost by Branch', url: '/reports/branch/payroll-cost' },
        ],
      },

      {
        title: 'Payroll & Payslips',
        icon: 'Wallet',
        items: [
          { title: 'Payslip', url: '/reports/payroll/payslip' },
          { title: 'Payroll Cycle Summary', url: '/reports/payroll/cycle-summary' },
          { title: 'Gross to Net', url: '/reports/payroll/gross-to-net' },
          { title: 'Payroll Register (Employee)', url: '/reports/payroll/register-employee' },
          { title: 'Payroll Register (Branch)', url: '/reports/payroll/register-branch' },
          { title: 'Payroll Register (Department)', url: '/reports/payroll/register-department' },
          { title: 'Earnings Report', url: '/reports/payroll/earnings' },
          { title: 'Deductions Report', url: '/reports/payroll/deductions' },
          { title: 'Overtime Report', url: '/reports/payroll/overtime' },
          { title: 'Payroll Comparison', url: '/reports/payroll/comparison' },
          { title: 'Bank Payment Schedule', url: '/reports/payroll/bank-schedule' },
          { title: 'Mobile Money Schedule', url: '/reports/payroll/momo-schedule' },
          { title: 'Cash Payment Schedule', url: '/reports/payroll/cash-schedule' },
          { title: 'Payroll Journal Posting', url: '/reports/payroll/journal-posting' },
        ],
      },

      {
        title: 'HR & Employees',
        icon: 'Users',
        items: [
          { title: 'Employee Master List', url: '/reports/hr/master-list' },
          { title: 'Employee Profile Sheet', url: '/reports/hr/profile-sheet' },
          { title: 'Employee Contact List', url: '/reports/hr/contact-list' },
          { title: 'Employee by Department', url: '/reports/hr/by-department' },
          { title: 'Employee by Job Title', url: '/reports/hr/by-job-title' },
          { title: 'Employee by Status', url: '/reports/hr/by-status' },
          { title: 'New Hires', url: '/reports/hr/new-hires' },
          { title: 'Confirmed Employees', url: '/reports/hr/confirmed' },
          { title: 'Terminated/Resigned', url: '/reports/hr/terminated' },
          { title: 'Manager-Subordinate', url: '/reports/hr/hierarchy' },
        ],
      },

      {
        title: 'Attendance & Leave',
        icon: 'CalendarCheck',
        items: [
          { title: 'Daily Attendance', url: '/reports/attendance/daily' },
          { title: 'Monthly Attendance', url: '/reports/attendance/monthly' },
          { title: 'Late Arrivals', url: '/reports/attendance/late' },
          { title: 'Absence Report', url: '/reports/attendance/absence' },
          { title: 'Worked Hours', url: '/reports/attendance/worked-hours' },
          { title: 'Check-in/Out Details', url: '/reports/attendance/checkin-checkout' },
          { title: 'Leave Requests', url: '/reports/leave/requests' },
          { title: 'Leave Approval Status', url: '/reports/leave/status' },
          { title: 'Leave by Employee', url: '/reports/leave/by-employee' },
          { title: 'Leave Calendar', url: '/reports/leave/calendar' },
        ],
      },

      {
        title: 'Expenses & Cash',
        icon: 'Receipt',
        items: [
          { title: 'Expense Requests', url: '/reports/expenses/requests' },
          { title: 'Approved Expenses', url: '/reports/expenses/approved' },
          { title: 'Paid Expenses', url: '/reports/expenses/paid' },
          { title: 'Unpaid Expenses', url: '/reports/expenses/unpaid' },
          { title: 'Expense by Category', url: '/reports/expenses/by-category' },
          { title: 'Cash Confirmation', url: '/reports/cash/daily-confirmation' },
          { title: 'Cash Variance', url: '/reports/cash/variance' },
          { title: 'Cash Overage', url: '/reports/cash/overage' },
          { title: 'Cash Shortage', url: '/reports/cash/shortage' },
        ],
      },

      {
        title: 'Customers & CRM',
        icon: 'UserRound',
        items: [
          { title: 'Customer Master List', url: '/reports/customers/master-list' },
          { title: 'Customer Statement', url: '/reports/customers/statement' },
          { title: 'Customer Transactions', url: '/reports/customers/transactions' },
          { title: 'Customer Payments', url: '/reports/customers/payments' },
          { title: 'Customer Credit Summary', url: '/reports/customers/credit-summary' },
          { title: 'Customer Aging', url: '/reports/customers/aging' },
          { title: 'Top Customers', url: '/reports/customers/top' },
          { title: 'Inactive Customers', url: '/reports/customers/inactive' },
        ],
      },

      {
        title: 'Parcels & Logistics',
        icon: 'Truck',
        items: [
          { title: 'Booking Register', url: '/reports/parcels/bookings' },
          { title: 'Parcel Register', url: '/reports/parcels/register' },
          { title: 'Parcel Tracking', url: '/reports/parcels/tracking' },
          { title: 'In-Transit Outgoing', url: '/reports/parcels/in-transit-out' },
          { title: 'In-Transit Incoming', url: '/reports/parcels/in-transit-in' },
          { title: 'Delivered Parcels', url: '/reports/parcels/delivered' },
          { title: 'Undelivered Parcels', url: '/reports/parcels/failed' },
          { title: 'Parcel Aging', url: '/reports/parcels/aging' },
          { title: 'Uncollected Parcels', url: '/reports/parcels/uncollected' },
        ],
      },

      {
        title: 'Consignments & Transfers',
        icon: 'Repeat',
        items: [
          { title: 'Consignment Manifest', url: '/reports/consignments/manifest' },
          { title: 'Consignment Summary', url: '/reports/consignments/summary' },
          { title: 'Branch Dispatch Manifest', url: '/reports/consignments/dispatch' },
          { title: 'Branch Receiving Manifest', url: '/reports/consignments/receiving' },
          { title: 'Internal Transfers', url: '/reports/transfers/internal' },
          { title: 'Pending Transfers', url: '/reports/transfers/pending' },
          { title: 'Acknowledged Transfers', url: '/reports/transfers/acknowledged' },
        ],
      },

      {
        title: 'Cashier & Shift',
        icon: 'Clock',
        items: [
          { title: 'Shift Sessions', url: '/reports/cashier/shifts' },
          { title: 'Open Shifts', url: '/reports/cashier/open-shifts' },
          { title: 'Closed Shifts', url: '/reports/cashier/closed-shifts' },
          { title: 'Shift Revenue', url: '/reports/cashier/revenue' },
          { title: 'Cashier Summary', url: '/reports/cashier/summary' },
          { title: 'Cashier Variance', url: '/reports/cashier/variance' },
          { title: 'Payment Method Mix', url: '/reports/cashier/payment-mix' },
        ],
      },

      {
        title: 'Inventory',
        icon: 'Package',
        items: [
          { title: 'Stock Levels', url: '/reports/inventory/stock-levels' },
          { title: 'Low Stock', url: '/reports/inventory/low-stock' },
          { title: 'Stock Movement', url: '/reports/inventory/movement' },
          { title: 'Stock Adjustments', url: '/reports/inventory/adjustments' },
          { title: 'Stock Transfers', url: '/reports/inventory/transfers' },
          { title: 'Inventory by Location', url: '/reports/inventory/by-location' },
          { title: 'Product Master List', url: '/reports/inventory/products' },
        ],
      },

      {
        title: 'Audit & Control',
        icon: 'ShieldCheck',
        items: [
          { title: 'Audit Trail by User', url: '/reports/audit/user' },
          { title: 'Audit Trail by Module', url: '/reports/audit/module' },
          { title: 'Audit Trail by Entity', url: '/reports/audit/entity' },
          { title: 'Suspicious Changes', url: '/reports/audit/suspicious' },
          { title: 'Deleted Records', url: '/reports/audit/deleted' },
          { title: 'User Role Permissions', url: '/reports/audit/roles' },
        ],
      },
    ],
  },
];
