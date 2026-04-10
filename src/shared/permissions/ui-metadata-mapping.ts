import type { PermissionKey } from './constants';
import type { GroupDefault } from './ui-metadata-types';

export const GROUP_DEFAULTS: Record<string, GroupDefault> = {
  Users: { domain: 'Technology', subdomain: 'Identity & Access', module: 'User Administration' },
  RBAC: {
    domain: 'Governance',
    subdomain: 'Access Governance',
    module: 'Role & Permission Governance',
  },
  Branches: {
    domain: 'Operations',
    subdomain: 'Order Fulfillment',
    module: 'Branch Network Management',
  },
  Locations: {
    domain: 'Operations',
    subdomain: 'Order Fulfillment',
    module: 'Location Master Management',
  },
  Warehouses: {
    domain: 'Supply Chain',
    subdomain: 'Network & Facilities',
    module: 'Warehouse Management',
  },
  Customers: {
    domain: 'Commercial',
    subdomain: 'Customer Lifecycle',
    module: 'Customer Master Management',
  },
  Cards: {
    domain: 'Commercial',
    subdomain: 'Customer Lifecycle',
    module: 'Customer Identification',
  },
  Shipments: { domain: 'Operations', subdomain: 'Parcel Lifecycle', module: 'Booking & Shipping' },
  Cashiers: {
    domain: 'Finance',
    subdomain: 'Cash Operations',
    module: 'Cashier Session Management',
  },
  Shifts: { domain: 'Finance', subdomain: 'Cash Operations', module: 'Shift Session Management' },
  Deliveries: {
    domain: 'Operations',
    subdomain: 'Delivery Execution',
    module: 'Last Mile Delivery',
  },
  Payments: {
    domain: 'Finance',
    subdomain: 'Receivables & Collections',
    module: 'Payment Collection',
  },
  Accounting: {
    domain: 'Finance',
    subdomain: 'Financial Accounting',
    module: 'General Ledger & Controls',
  },
  Inventory: {
    domain: 'Supply Chain',
    subdomain: 'Inventory Management',
    module: 'Inventory Control',
  },
  Procurement: {
    domain: 'Supply Chain',
    subdomain: 'Procurement',
    module: 'Sourcing & Purchasing',
  },
  'Fleet & Transport': {
    domain: 'Operations',
    subdomain: 'Routing & Dispatch',
    module: 'Fleet Transport Operations',
  },
  'Customer Wallet': {
    domain: 'Finance',
    subdomain: 'Credit & Wallet Management',
    module: 'Customer Wallet & Credit Control',
  },
  Reconciliation: {
    domain: 'Finance',
    subdomain: 'Reconciliation',
    module: 'Operational Reconciliation',
  },
  'Notification Hub': {
    domain: 'Commercial',
    subdomain: 'Customer Engagement',
    module: 'Notification Orchestration',
  },
  Reports: { domain: 'Insights', subdomain: 'Enterprise Reporting', module: 'Enterprise Reports' },
  Analytics: {
    domain: 'Insights',
    subdomain: 'Performance Analytics',
    module: 'Business Analytics',
  },
  Audit: { domain: 'Governance', subdomain: 'Audit & Compliance', module: 'Audit Trail' },
  Platform: {
    domain: 'Technology',
    subdomain: 'Platform Administration',
    module: 'Platform Configuration',
  },
  HR: {
    domain: 'Human Capital',
    subdomain: 'Workforce Administration',
    module: 'Employee Administration',
  },
  Payroll: {
    domain: 'Human Capital',
    subdomain: 'Compensation & Payroll',
    module: 'Payroll Operations',
  },
  'IT Support': {
    domain: 'Technology',
    subdomain: 'Service Operations',
    module: 'IT Support Desk',
  },
  Geolocation: {
    domain: 'Operations',
    subdomain: 'Call Center Operations',
    module: 'Geolocation Services',
  },
  Auth: {
    domain: 'Technology',
    subdomain: 'Identity & Access',
    module: 'Authentication & Credential Security',
  },
};

export const KEY_OVERRIDES: Partial<Record<PermissionKey, Partial<GroupDefault>>> = {
  CanReadConsignments: { module: 'Consignment Processing' },
  CanCreateConsignments: { module: 'Consignment Processing' },
  CanUpdateConsignments: { module: 'Consignment Processing' },
  CanDeleteConsignments: { module: 'Consignment Processing' },
  CanAutoGroupConsignments: { module: 'Consignment Processing' },
  CanReadParcelReceivingModule: { module: 'Parcel Receiving' },
  CanReadParcelIncoming: { module: 'Parcel Receiving' },
  CanReadParcelScan: { module: 'Parcel Receiving' },
  CanCreateReceiverPayments: {
    domain: 'Operations',
    subdomain: 'Parcel Lifecycle',
    module: 'Parcel Receiving',
  },
  CanCreateSenderPayments: {
    domain: 'Operations',
    subdomain: 'Parcel Lifecycle',
    module: 'Booking & Shipping',
  },
  CanReadParcelReconciliation: { module: 'Parcel Reconciliation' },
  CanRequestParcelReconciliation: { module: 'Parcel Reconciliation' },
  CanApproveParcelReconciliation: { module: 'Parcel Reconciliation' },
  CanExecuteParcelReconciliation: { module: 'Parcel Reconciliation' },
  CanOverrideParcelReconciliationWindow: { module: 'Parcel Reconciliation' },
  CanReadAccountingAccounts: { module: 'Chart of Accounts' },
  CanCreateAccountingAccounts: { module: 'Chart of Accounts' },
  CanUpdateAccountingAccounts: { module: 'Chart of Accounts' },
  CanDeleteAccountingAccounts: { module: 'Chart of Accounts' },
  CanReadAccountingExpenseCategories: { module: 'Expense Category Management' },
  CanCreateAccountingExpenseCategories: { module: 'Expense Category Management' },
  CanUpdateAccountingExpenseCategories: { module: 'Expense Category Management' },
  CanDeleteAccountingExpenseCategories: { module: 'Expense Category Management' },
  CanReadAccountingApprovalPolicies: { module: 'Accounting Approval Policies' },
  CanCreateAccountingApprovalPolicies: { module: 'Accounting Approval Policies' },
  CanUpdateAccountingApprovalPolicies: { module: 'Accounting Approval Policies' },
  CanDeleteAccountingApprovalPolicies: { module: 'Accounting Approval Policies' },
  CanReadAccountingBankAccounts: { module: 'Bank Account Management' },
  CanCreateAccountingBankAccounts: { module: 'Bank Account Management' },
  CanUpdateAccountingBankAccounts: { module: 'Bank Account Management' },
  CanDeleteAccountingBankAccounts: { module: 'Bank Account Management' },
  CanReadAccountingTaxProfiles: { module: 'Tax Profile Management' },
  CanCreateAccountingTaxProfiles: { module: 'Tax Profile Management' },
  CanUpdateAccountingTaxProfiles: { module: 'Tax Profile Management' },
  CanDeleteAccountingTaxProfiles: { module: 'Tax Profile Management' },
  CanReadAccountingTaxComponents: { module: 'Tax Component Management' },
  CanCreateAccountingTaxComponents: { module: 'Tax Component Management' },
  CanUpdateAccountingTaxComponents: { module: 'Tax Component Management' },
  CanDeleteAccountingTaxComponents: { module: 'Tax Component Management' },
  CanComputeTaxes: { subdomain: 'Taxation', module: 'Tax Computation & Filing' },
  CanCreateTaxFilingPeriod: { subdomain: 'Taxation', module: 'Tax Computation & Filing' },
  CanMarkTaxFilingPeriodUnderReview: { subdomain: 'Taxation', module: 'Tax Computation & Filing' },
  CanSubmitTaxFilingPeriod: { subdomain: 'Taxation', module: 'Tax Computation & Filing' },
  CanCloseTaxFilingPeriod: { subdomain: 'Taxation', module: 'Tax Computation & Filing' },
  CanMarkTaxItemReadyForFiling: { subdomain: 'Taxation', module: 'Tax Computation & Filing' },
  CanMarkTaxItemFiled: { subdomain: 'Taxation', module: 'Tax Computation & Filing' },
  CanExcludeTaxItemFromFiling: { subdomain: 'Taxation', module: 'Tax Computation & Filing' },
};

function resolveReportModule(permissionKey: PermissionKey) {
  if (permissionKey.includes('Financial')) return 'Financial Statements & Ledger Reports';
  if (permissionKey.includes('Payroll')) return 'Payroll Reports';
  if (permissionKey.includes('Hr')) return 'Workforce Reports';
  if (permissionKey.includes('Attendance')) return 'Attendance Reports';
  if (permissionKey.includes('Leave')) return 'Leave Management Reports';
  if (permissionKey.includes('Expenses')) return 'Expense Reports';
  if (permissionKey.includes('Cashier') || permissionKey.includes('Shift'))
    return 'Cash Operations Reports';
  if (permissionKey.includes('Customers')) return 'Customer Reports';
  if (permissionKey.includes('Parcels')) return 'Parcel Operations Reports';
  if (permissionKey.includes('Consignments')) return 'Consignment Reports';
  if (permissionKey.includes('Transfers')) return 'Internal Transfer Reports';
  if (permissionKey.includes('Inventory')) return 'Inventory Reports';
  if (permissionKey.includes('Audit')) return 'Audit & Compliance Reports';
  return 'Enterprise Reports';
}

function resolveInventoryModule(permissionKey: PermissionKey) {
  if (permissionKey.includes('ProductCategory')) return 'Product Category Management';
  if (permissionKey.includes('Product')) return 'Product Master Management';
  if (permissionKey.includes('InventoryLocation')) return 'Inventory Location Management';
  if (permissionKey.includes('StockLevel')) return 'Stock Visibility';
  if (permissionKey.includes('StockMovement')) return 'Stock Movement Control';
  if (permissionKey.includes('StockAdjustment')) return 'Stock Adjustment Control';
  if (permissionKey.includes('StockTransfer')) return 'Stock Transfer Control';
  if (permissionKey.includes('StockRequest')) return 'Stock Request Workflow';
  if (permissionKey.includes('StockMaintenance')) return 'Stock Maintenance Management';
  if (permissionKey.includes('ApprovalPolicy')) return 'Inventory Approval Policies';
  if (permissionKey.includes('ApprovalRequest')) return 'Inventory Approval Requests';
  if (permissionKey.includes('Valuation')) return 'Inventory Valuation';
  if (permissionKey.includes('Replenishment')) return 'Replenishment Planning';
  if (permissionKey.includes('Audit') || permissionKey.includes('Correction'))
    return 'Inventory Audit & Corrections';
  if (permissionKey.includes('EnterpriseKpis') || permissionKey.includes('DashboardSummary'))
    return 'Inventory Performance Monitoring';
  if (permissionKey.includes('LowStock') || permissionKey.includes('MovementHistory'))
    return 'Inventory Operational Reporting';
  return 'Inventory Control';
}

function resolveDeliveryModule(permissionKey: PermissionKey) {
  if (permissionKey.includes('PickupQueue') || permissionKey.includes('CallCenter'))
    return 'Call Center & Pickup Coordination';
  if (permissionKey.includes('Doorstep') || permissionKey.includes('Rider'))
    return 'Last Mile Delivery Execution';
  if (permissionKey.includes('InternalTransfers')) return 'Internal Transfer Operations';
  if (permissionKey.includes('Dispatch') || permissionKey.includes('DeliveryOrder'))
    return 'Dispatch Planning';
  return 'Last Mile Delivery';
}

function resolveShipmentsModule(permissionKey: PermissionKey) {
  if (permissionKey.includes('Consignment')) return 'Consignment Processing';
  if (permissionKey.includes('Reconciliation')) return 'Parcel Reconciliation';
  if (
    permissionKey.includes('Receiving') ||
    permissionKey.includes('Incoming') ||
    permissionKey.includes('ParcelScan')
  ) {
    return 'Parcel Receiving';
  }
  return 'Booking & Shipping';
}

function resolveReportSubdomain(permissionKey: PermissionKey) {
  if (permissionKey.includes('Financial') || permissionKey.includes('Tax'))
    return 'Financial Insights';
  if (
    permissionKey.includes('Payroll') ||
    permissionKey.includes('Hr') ||
    permissionKey.includes('Attendance') ||
    permissionKey.includes('Leave')
  )
    return 'Workforce Insights';
  if (permissionKey.includes('Customers')) return 'Commercial Insights';
  if (
    permissionKey.includes('Parcels') ||
    permissionKey.includes('Consignments') ||
    permissionKey.includes('Transfers') ||
    permissionKey.includes('Inventory') ||
    permissionKey.includes('Cashier') ||
    permissionKey.includes('Shift')
  ) {
    return 'Operational Insights';
  }
  if (permissionKey.includes('Audit')) return 'Governance Insights';
  return 'Enterprise Reporting';
}

export function resolveSubdomain(
  permission: { group: string; key: PermissionKey },
  fallback: string,
) {
  if (permission.group === 'Reports') return resolveReportSubdomain(permission.key);
  return fallback;
}

export function resolveModule(permission: { group: string; key: PermissionKey }, fallback: string) {
  if (permission.group === 'Reports') return resolveReportModule(permission.key);
  if (permission.group === 'Inventory') return resolveInventoryModule(permission.key);
  if (permission.group === 'Deliveries') return resolveDeliveryModule(permission.key);
  if (permission.group === 'Shipments') return resolveShipmentsModule(permission.key);
  if (permission.group === 'Cashiers' && permission.key.includes('SessionType'))
    return 'Cashier Session Type Administration';
  if (permission.group === 'Cashiers' && permission.key.includes('ReadActive'))
    return 'Cashier Session Monitoring';
  if (permission.group === 'Cashiers' && permission.key.includes('History'))
    return 'Cashier Session Monitoring';
  if (permission.group === 'Cashiers' && permission.key.includes('Open'))
    return 'Cashier Session Opening';
  if (permission.group === 'Cashiers' && permission.key.includes('Close'))
    return 'Cashier Session Closing';
  if (permission.group === 'Cashiers') return 'Cashier Session Management';
  if (permission.group === 'Users' && permission.key.includes('Inactive'))
    return 'User Lifecycle Monitoring';
  if (permission.group === 'Users' && permission.key.includes('Active'))
    return 'User Lifecycle Monitoring';
  if (permission.group === 'Users') return 'User Administration';
  return fallback;
}
