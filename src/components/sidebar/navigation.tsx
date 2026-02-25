import { type LucideIconProps } from '@/components/ui';

interface SubItem {
  title: string;
  url: string;
  permissionKey?: string;
}

export interface MenuItem {
  title: string;
  url?: string;
  icon: LucideIconProps;
  isActive?: boolean;
  permissionKey?: string;
  items?: SubItem[];
}

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
            url: '/operations/parcel',
            permissionKey: 'CanCreateShipments',
          },
        ],
      },
      {
        title: 'Cashier Sessions',
        icon: 'Wallet',
        items: [
          {
            title: 'Manage Sessions',
            url: '/cashiers',
            permissionKey: 'CanReadCashierSessions',
          },
        ],
      },
    ],
  },
  {
    title: 'Configuration',
    menu: [
      {
        title: 'Branches',
        icon: 'Building2',
        items: [{ title: 'Manage Branches', url: '/branches', permissionKey: 'CanReadBranches' }],
      },
      {
        title: 'Locations',
        icon: 'MapPin',
        items: [{ title: 'Manage Locations', url: '/locations', permissionKey: 'CanReadLocations' }],
      },
      {
        title: 'Statuses',
        icon: 'Settings',
        items: [{ title: 'Manage Statuses', url: '/statuses', permissionKey: 'CanReadStatuses' }],
      },
    ],
  },
  {
    title: 'Administration',
    menu: [
      {
        title: 'Users',
        icon: 'Users',
        items: [{ title: 'Manage Users', url: '/users', permissionKey: 'CanReadUsers' }],
      },
      {
        title: 'Roles',
        icon: 'Shield',
        items: [{ title: 'Manage Roles', url: '/roles', permissionKey: 'CanReadRoles' }],
      },
      {
        title: 'Permissions',
        icon: 'Lock',
        items: [{ title: 'Permissions Catalog', url: '/permissions', permissionKey: 'CanReadPermissions' }],
      },
    ],
  },
];
