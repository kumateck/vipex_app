import type { PermissionKey } from './constants';

type PermissionLookup = { group: string; key: PermissionKey };

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
  )
    return 'Parcel Receiving';
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
  )
    return 'Operational Insights';
  if (permissionKey.includes('Audit')) return 'Governance Insights';
  return 'Enterprise Reporting';
}

export function resolveSubdomain(permission: PermissionLookup, fallback: string) {
  if (permission.group === 'Reports') return resolveReportSubdomain(permission.key);
  return fallback;
}

export function resolveModule(permission: PermissionLookup, fallback: string) {
  if (permission.group === 'Reports') return resolveReportModule(permission.key);
  if (permission.group === 'Inventory') return resolveInventoryModule(permission.key);
  if (permission.group === 'Deliveries') return resolveDeliveryModule(permission.key);
  if (permission.group === 'Shipments') return resolveShipmentsModule(permission.key);
  if (permission.group === 'Cashiers' && permission.key.includes('SessionType'))
    return 'Cashier Session Type Administration';
  if (
    permission.group === 'Cashiers' &&
    (permission.key.includes('ReadActive') || permission.key.includes('History'))
  )
    return 'Cashier Session Monitoring';
  if (permission.group === 'Cashiers' && permission.key.includes('Open'))
    return 'Cashier Session Opening';
  if (permission.group === 'Cashiers' && permission.key.includes('Close'))
    return 'Cashier Session Closing';
  if (permission.group === 'Cashiers') return 'Cashier Session Management';
  if (
    permission.group === 'Users' &&
    (permission.key.includes('Inactive') || permission.key.includes('Active'))
  )
    return 'User Lifecycle Monitoring';
  if (permission.group === 'Users') return 'User Administration';
  return fallback;
}
