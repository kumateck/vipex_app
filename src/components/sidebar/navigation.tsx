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
];
