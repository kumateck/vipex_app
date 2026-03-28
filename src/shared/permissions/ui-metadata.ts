import { PermissionCatalogUi, type PermissionKey } from './constants';

export type MainPermissionTab =
  | 'Main'
  | 'Operations'
  | 'CRM'
  | 'Finance'
  | 'HR'
  | 'IT'
  | 'Setup'
  | 'Reports';

export const MAIN_PERMISSION_TABS: MainPermissionTab[] = [
  'Main',
  'Operations',
  'CRM',
  'Finance',
  'HR',
  'IT',
  'Setup',
  'Reports',
];

type GroupDefault = {
  mainTab: MainPermissionTab;
  module: string;
};

const GROUP_DEFAULTS: Record<string, GroupDefault> = {
  Users: { mainTab: 'IT', module: 'User Management' },
  RBAC: { mainTab: 'IT', module: 'Access Management' },
  Branches: { mainTab: 'Setup', module: 'Network Setup' },
  Locations: { mainTab: 'Setup', module: 'Network Setup' },
  Warehouses: { mainTab: 'Setup', module: 'Network Setup' },
  Customers: { mainTab: 'CRM', module: 'Customer Management' },
  Cards: { mainTab: 'CRM', module: 'Customer Identification' },
  Shipments: { mainTab: 'Operations', module: 'Sending' },
  Cashiers: { mainTab: 'Finance', module: 'Cash Operations' },
  Shifts: { mainTab: 'Finance', module: 'Cash Operations' },
  Deliveries: { mainTab: 'Operations', module: 'Deliveries' },
  Payments: { mainTab: 'Finance', module: 'Payments' },
  Accounting: { mainTab: 'Finance', module: 'Accounting' },
  Inventory: { mainTab: 'Setup', module: 'Inventory Setup' },
  Reports: { mainTab: 'Reports', module: 'Reports' },
  Audit: { mainTab: 'IT', module: 'Audit Trail' },
  Platform: { mainTab: 'IT', module: 'Platform Control' },
  HR: { mainTab: 'HR', module: 'Human Resource' },
  Payroll: { mainTab: 'HR', module: 'Payroll' },
  Geolocation: { mainTab: 'Operations', module: 'Call Center' },
  Auth: { mainTab: 'IT', module: 'Authentication' },
};

const KEY_OVERRIDES: Partial<Record<PermissionKey, Partial<GroupDefault> & { module?: string }>> = {
  CanReadConsignments: { mainTab: 'Operations', module: 'Receiving' },
  CanCreateConsignments: { mainTab: 'Operations', module: 'Receiving' },
  CanUpdateConsignments: { mainTab: 'Operations', module: 'Receiving' },
  CanDeleteConsignments: { mainTab: 'Operations', module: 'Receiving' },
  CanAutoGroupConsignments: { mainTab: 'Operations', module: 'Receiving' },
  CanCompleteOfficePickup: { mainTab: 'Operations', module: 'Call Center' },
  CanReadParcels: { mainTab: 'Operations', module: 'Sending' },
  CanReadParcelSendingModule: { mainTab: 'Operations', module: 'Sending' },
  CanReadParcelOutgoing: { mainTab: 'Operations', module: 'Sending' },
  CanReadParcelReceivingModule: { mainTab: 'Operations', module: 'Receiving' },
  CanReadParcelIncoming: { mainTab: 'Operations', module: 'Receiving' },
  CanReadParcelScan: { mainTab: 'Operations', module: 'Receiving' },
  CanCreateParcels: { mainTab: 'Operations', module: 'Sending' },
  CanUpdateParcels: { mainTab: 'Operations', module: 'Sending' },
  CanDeleteParcels: { mainTab: 'Operations', module: 'Sending' },
  CanSoftDeleteParcelsAndPayments: { mainTab: 'Operations', module: 'Sending' },
  CanCreateBookingWithParcels: { mainTab: 'Operations', module: 'Sending' },
  CanCreatePayments: { mainTab: 'Finance', module: 'Payments' },
  CanCreateSenderPayments: { mainTab: 'Operations', module: 'Sending' },
  CanCreateReceiverPayments: { mainTab: 'Operations', module: 'Receiving' },
  CanReadPayments: { mainTab: 'Finance', module: 'Payments' },
  CanComputeTaxes: { mainTab: 'Finance', module: 'Tax' },
  CanCreateTaxFilingPeriod: { mainTab: 'Finance', module: 'Tax' },
  CanMarkTaxFilingPeriodUnderReview: { mainTab: 'Finance', module: 'Tax' },
  CanSubmitTaxFilingPeriod: { mainTab: 'Finance', module: 'Tax' },
  CanCloseTaxFilingPeriod: { mainTab: 'Finance', module: 'Tax' },
  CanMarkTaxItemReadyForFiling: { mainTab: 'Finance', module: 'Tax' },
  CanMarkTaxItemFiled: { mainTab: 'Finance', module: 'Tax' },
  CanExcludeTaxItemFromFiling: { mainTab: 'Finance', module: 'Tax' },
  CanGetCashierPerformanceReport: { mainTab: 'Reports', module: 'Reports' },
  CanGetShiftRevenueReport: { mainTab: 'Reports', module: 'Reports' },
  CanGetBranchProfitabilityReport: { mainTab: 'Reports', module: 'Reports' },
  CanGetCreditExposureReport: { mainTab: 'Reports', module: 'Reports' },
  CanGetOutstandingToBePaidReport: { mainTab: 'Reports', module: 'Reports' },
  CanGetParcelStatusSummaryReport: { mainTab: 'Reports', module: 'Reports' },
};

export type PermissionUiCatalogItem = {
  key: PermissionKey;
  group: string;
  mainTab: MainPermissionTab;
  module: string;
  title: string;
  description: string;
  sortOrder: number;
};

function splitWords(value: string) {
  return value
    .replace(/^Can/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .trim();
}

const unknownGroups = [...new Set(PermissionCatalogUi.map((p) => p.group))].filter(
  (group) => !GROUP_DEFAULTS[group],
);

if (unknownGroups.length > 0) {
  throw new Error(`Permission UI metadata missing group mappings for: ${unknownGroups.join(', ')}`);
}

export const PermissionUiCatalog: PermissionUiCatalogItem[] = PermissionCatalogUi.map(
  (permission, index) => {
    const groupDefault = GROUP_DEFAULTS[permission.group]!;
    const override = KEY_OVERRIDES[permission.key];

    const mainTab = override?.mainTab ?? groupDefault.mainTab;
    const module = override?.module ?? groupDefault.module;

    return {
      key: permission.key,
      group: permission.group,
      mainTab,
      module,
      title: splitWords(permission.key),
      description: permission.description,
      sortOrder: index,
    };
  },
);
