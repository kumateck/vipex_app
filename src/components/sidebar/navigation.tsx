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
        isActive: false,
      },
      {
        title: 'Analytics',
        url: '/analytics',
        icon: 'ChartLine',
        isActive: false,
      },
    ],
  },
  {
    title: 'Operations',
    menu: [
      {
        title: 'Parcels',
        icon: 'Package',
        items: [
          {
            title: 'Create Parcel',
            url: '/parcels/create',
          },
          {
            title: 'All Parcels',
            url: '/parcels',
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
            title: 'In Transit (Sent)',
            url: '/parcels/in-transit/outgoing',
          },
          {
            title: 'In Transit (Incoming)',
            url: '/parcels/in-transit/incoming',
          },
          {
            title: 'Scan to Receive',
            url: '/parcels/receive',
          },
          {
            title: 'Track Parcel',
            url: '/parcels/track',
          },
          {
            title: 'Parcel Status',
            url: '/parcels/status',
          },
          {
            title: 'Waiting for Pickup',
            url: '/parcels/waiting-pickup',
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
            title: 'Office Pickup',
            url: '/deliveries/office-pickup',
          },
          {
            title: 'Address Collection',
            url: '/parcels/home-delivery/address',
          },
          {
            title: 'Dispatch Parcels',
            url: '/parcels/home-delivery/dispatch',
          },
          {
            title: 'Delivery Cashier',
            url: '/parcels/delivery-cashier',
          },
          {
            title: 'Door-to-Door',
            url: '/deliveries/door-to-door',
          },
          {
            title: 'Assign Riders',
            url: '/deliveries/assign-riders',
          },
          {
            title: 'Active Deliveries',
            url: '/deliveries/active',
          },
          {
            title: 'Delivery History',
            url: '/deliveries/history',
          },
          {
            title: 'Rider Current',
            url: '/parcels/rider/current',
          },
          {
            title: 'Rider History',
            url: '/parcels/rider/history',
          },
        ],
      },
      {
        title: 'Branches',
        icon: 'Building2',
        items: [
          {
            title: 'All Branches',
            url: '/branches',
          },
          {
            title: 'Branch Performance',
            url: '/branches/performance',
          },
          {
            title: 'Branch Transfers',
            url: '/branches/transfers',
          },
        ],
      },
      {
        title: 'Locations',
        icon: 'MapPin',
        items: [
          {
            title: 'Manage Locations',
            url: '/locations',
          },
          {
            title: 'Zones',
            url: '/locations/zones',
          },
          {
            title: 'Pricing by Location',
            url: '/locations/pricing',
          },
        ],
      },
    ],
  },
  {
    title: 'Customers',
    menu: [
      {
        title: 'Customer Management',
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
          {
            title: 'Customer Addresses',
            url: '/customers/addresses',
          },
          {
            title: 'Customer History',
            url: '/customers/history',
          },
        ],
      },
      {
        title: 'Senders',
        icon: 'UserCheck',
        items: [
          {
            title: 'All Senders',
            url: '/senders',
          },
          {
            title: 'Sender Addresses',
            url: '/senders/addresses',
          },
        ],
      },
      {
        title: 'Recipients',
        icon: 'UserPlus',
        items: [
          {
            title: 'All Recipients',
            url: '/recipients',
          },
          {
            title: 'Recipient Addresses',
            url: '/recipients/addresses',
          },
        ],
      },
    ],
  },
  {
    title: 'Finance',
    menu: [
      {
        title: 'Payments',
        icon: 'CreditCard',
        items: [
          {
            title: 'All Payments',
            url: '/payments',
          },
          {
            title: 'Collect Payment',
            url: '/payments/collect',
          },
          {
            title: 'Payment History',
            url: '/payments/history',
          },
          {
            title: 'Refunds',
            url: '/payments/refunds',
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
        title: 'Invoices',
        icon: 'FileText',
        items: [
          {
            title: 'All Invoices',
            url: '/invoices',
          },
          {
            title: 'Create Invoice',
            url: '/invoices/create',
          },
          {
            title: 'Pending Invoices',
            url: '/invoices/pending',
          },
        ],
      },
      {
        title: 'Tax Reports',
        icon: 'Receipt',
        items: [
          {
            title: 'Tax Overview',
            url: '/tax/overview',
          },
          {
            title: 'VAT Reports',
            url: '/tax/vat-reports',
          },
          {
            title: 'NHIL Reports',
            url: '/tax/nhil-reports',
          },
          {
            title: 'COVID Levy Reports',
            url: '/tax/covid-levy-reports',
          },
        ],
      },
    ],
  },
  {
    title: 'Inventory',
    menu: [
      {
        title: 'Inventory Management',
        icon: 'Package2',
        items: [
          {
            title: 'Product Categories',
            url: '/inventory/categories',
            permissionKey: 'CanListProductCategories',
          },
          {
            title: 'Product Locations',
            url: '/inventory/locations',
            permissionKey: 'CanListProductLocations',
          },
          {
            title: 'Product Locations',
            url: '/inventory/locations',
            permissionKey: 'CanListProductLocations',
          },
          {
            title: 'All Inventory',
            url: '/inventory',
          },
          {
            title: 'Add Inventory',
            url: '/inventory/create',
          },
          {
            title: 'Stock Levels',
            url: '/inventory/stock-levels',
            permissionKey: 'CanListStockLevels',
          },
          {
            title: 'Low Stock Alerts',
            url: '/inventory/low-stock',
          },
        ],
      },
      {
        title: 'Inventory Transactions',
        icon: 'ArrowLeftRight',
        items: [
          {
            title: 'Stock Movements',
            url: '/inventory/stock-movements',
            permissionKey: 'CanListStockMovements',
          },
          {
            title: 'Stock Adjustments',
            url: '/inventory/stock-adjustments',
            permissionKey: 'CanListStockAdjustments',
          },
          {
            title: 'Stock Transfers',
            url: '/inventory/stock-transfers',
            permissionKey: 'CanListStockTransfers',
          },
          // {
          //   title: 'All Transactions',
          //   url: '/inventory/transactions',
          //   permissionKey: 'CanListStockTransfers',
          // },
          // {
          //   title: 'Stock In',
          //   url: '/inventory/transactions/in',
          //   permissionKey: 'CanListStockTransfers',
          // },
          // {
          //   title: 'Stock Out',
          //   url: '/inventory/transactions/out',
          //   permissionKey: 'CanListStockTransfers',
          // },
        ],
      },
    ],
  },
  {
    title: 'Human Resources',
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
            title: 'User Invites',
            url: '/users/invites',
          },
          {
            title: 'Active Users',
            url: '/users/active',
          },
          {
            title: 'Inactive Users',
            url: '/users/inactive',
          },
        ],
      },
      {
        title: 'Roles & Permissions',
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
          {
            title: 'Role Assignments',
            url: '/roles/assignments',
          },
        ],
      },
      {
        title: 'Riders',
        icon: 'Bike',
        items: [
          {
            title: 'All Riders',
            url: '/riders',
          },
          {
            title: 'Rider Performance',
            url: '/riders/performance',
          },
          {
            title: 'Rider Assignments',
            url: '/riders/assignments',
          },
        ],
      },
    ],
  },
  {
    title: 'Configuration',
    menu: [
      {
        title: 'Company Settings',
        icon: 'Building',
        items: [
          {
            title: 'Company Profile',
            url: '/settings/company',
          },
          {
            title: 'Branches',
            url: '/settings/branches',
          },
        ],
      },
      {
        title: 'Service Configuration',
        icon: 'Settings',
        items: [
          {
            title: 'Cards',
            url: '/settings/cards',
          },
          {
            title: 'Parcel Types',
            url: '/settings/parcel-types',
          },
          {
            title: 'Statuses',
            url: '/settings/statuses',
          },
          {
            title: 'Delivery Modes',
            url: '/settings/delivery-modes',
          },
        ],
      },
      {
        title: 'Pricing',
        icon: 'DollarSign',
        items: [
          {
            title: 'Price Structure',
            url: '/settings/pricing',
          },
          {
            title: 'Tax Configuration',
            url: '/settings/tax',
          },
          {
            title: 'Discounts & Promotions',
            url: '/settings/discounts',
          },
        ],
      },
      {
        title: 'System Settings',
        icon: 'Cog',
        items: [
          {
            title: 'General Settings',
            url: '/settings/general',
          },
          {
            title: 'Email Templates',
            url: '/settings/email-templates',
          },
          {
            title: 'SMS Settings',
            url: '/settings/sms',
          },
          {
            title: 'Backup & Restore',
            url: '/settings/backup',
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
        icon: 'TrendingUp',
        items: [
          {
            title: 'Revenue Reports',
            url: '/reports/revenue',
          },
          {
            title: 'Payment Reports',
            url: '/reports/payments',
          },
          {
            title: 'Tax Reports',
            url: '/reports/tax',
          },
        ],
      },
      {
        title: 'Operational Reports',
        icon: 'ChartBarBig',
        items: [
          {
            title: 'Parcel Reports',
            url: '/reports/parcels',
          },
          {
            title: 'Delivery Reports',
            url: '/reports/deliveries',
          },
          {
            title: 'Branch Performance',
            url: '/reports/branch-performance',
          },
          {
            title: 'Rider Performance',
            url: '/reports/rider-performance',
          },
        ],
      },
      {
        title: 'Customer Reports',
        icon: 'Users',
        items: [
          {
            title: 'Customer Activity',
            url: '/reports/customer-activity',
          },
          {
            title: 'Customer Revenue',
            url: '/reports/customer-revenue',
          },
        ],
      },
      {
        title: 'Inventory Reports',
        icon: 'ClipboardList',
        items: [
          {
            title: 'Stock Reports',
            url: '/reports/stock',
          },
          {
            title: 'Transaction Reports',
            url: '/reports/inventory-transactions',
          },
        ],
      },
    ],
  },
  {
    title: 'Audit & Compliance',
    menu: [
      {
        title: 'Audit Logs',
        icon: 'FileSearch',
        items: [
          {
            title: 'All Audit Logs',
            url: '/audit/logs',
          },
          {
            title: 'User Activity',
            url: '/audit/user-activity',
          },
          {
            title: 'System Changes',
            url: '/audit/system-changes',
          },
        ],
      },
      {
        title: 'Compliance',
        icon: 'ShieldCheck',
        items: [
          {
            title: 'Data Privacy',
            url: '/compliance/data-privacy',
          },
          {
            title: 'Tax Compliance',
            url: '/compliance/tax',
          },
        ],
      },
    ],
  },
];
