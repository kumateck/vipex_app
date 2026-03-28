import { RoutePermissionOverrides, type PermissionKey } from './constants';

export function inferReadPermissionByPath(pathname?: string): PermissionKey | undefined {
  if (!pathname) return undefined;
  const exactRoutePermission = RoutePermissionOverrides[pathname];
  if (exactRoutePermission) return exactRoutePermission;

  if (pathname.startsWith('/parcels/in-transit/outgoing')) return 'CanReadParcelOutgoing';
  if (pathname.startsWith('/parcels/in-transit/incoming')) return 'CanReadParcelIncoming';
  if (pathname.startsWith('/parcels/receive')) return 'CanReadParcelScan';
  if (pathname === '/parcels' || pathname.startsWith('/parcels/')) return 'CanReadParcels';
  if (pathname === '/customers' || pathname.startsWith('/customers/')) return 'CanReadCustomers';
  if (pathname === '/accounting' || pathname.startsWith('/accounting/')) return 'CanReadAccounting';
  if (pathname.startsWith('/payroll/compensation')) return 'CanReadCompensation';
  if (pathname.startsWith('/payroll/groups')) return 'CanReadPayrollGroups';
  if (pathname.startsWith('/payroll/cycles')) return 'CanListPayrollCycles';
  if (pathname.startsWith('/payroll/inputs')) return 'CanReadPayrollInputs';
  if (pathname.startsWith('/cashier/sessions/')) return 'CanReadCashierSessions';
  if (pathname.startsWith('/hr/employees')) return 'CanListEmployees';
  if (pathname.startsWith('/hr/departments')) return 'CanReadDepartments';
  if (pathname.startsWith('/hr/job-titles')) return 'CanReadJobTitles';
  if (pathname.startsWith('/hr/attendance')) return 'CanListAttendance';
  if (pathname.startsWith('/hr/leave')) return 'CanListLeaveRequests';
  if (pathname.startsWith('/users')) return 'CanReadUsers';
  if (pathname.startsWith('/roles')) return 'CanReadRoles';
  if (pathname.startsWith('/permissions')) return 'CanReadPermissions';
  if (pathname.startsWith('/branches')) return 'CanReadBranches';
  if (pathname.startsWith('/locations')) return 'CanReadLocations';
  if (pathname.startsWith('/warehouses')) return 'CanReadWarehouses';
  if (pathname.startsWith('/settings/cards')) return 'CanReadCards';
  if (pathname.startsWith('/inventory/categories')) return 'CanListProductCategories';
  if (pathname.startsWith('/inventory/locations')) return 'CanListInventoryLocations';
  if (pathname.startsWith('/inventory/stock-levels')) return 'CanListStockLevels';
  if (pathname.startsWith('/inventory/stock-movements')) return 'CanListStockMovements';
  if (pathname.startsWith('/inventory/stock-adjustments')) return 'CanListStockAdjustments';
  if (pathname.startsWith('/inventory/stock-transfers')) return 'CanListStockTransfers';
  if (pathname.startsWith('/inventory')) return 'CanListProducts';

  if (pathname.startsWith('/reports/financial/')) return 'CanReadAccounting';
  if (pathname.startsWith('/reports/branch/')) return 'CanGetBranchProfitabilityReport';
  if (pathname.startsWith('/reports/payroll/')) return 'CanReadPayrollRun';
  if (pathname.startsWith('/reports/hr/')) return 'CanListEmployees';
  if (pathname.startsWith('/reports/attendance/')) return 'CanListAttendance';
  if (pathname.startsWith('/reports/leave/')) return 'CanListLeaveRequests';
  if (pathname.startsWith('/reports/expenses/')) return 'CanReadAccounting';
  if (pathname.startsWith('/reports/cash/')) return 'CanReadAccounting';
  if (pathname.startsWith('/reports/customers/')) return 'CanReadCustomers';
  if (pathname.startsWith('/reports/parcels/')) return 'CanGetParcelStatusSummaryReport';
  if (pathname.startsWith('/reports/consignments/')) return 'CanReadConsignments';
  if (pathname.startsWith('/reports/transfers/')) return 'CanReadParcelInternalTransfers';
  if (pathname.startsWith('/reports/cashier/')) return 'CanGetShiftRevenueReport';
  if (pathname.startsWith('/reports/inventory/')) return 'CanGetLowStockReport';
  if (pathname.startsWith('/reports/audit/')) return 'CanListAuditLogs';

  return undefined;
}

export function inferRequiredPermissionByPath(pathname?: string): PermissionKey | undefined {
  if (!pathname) return undefined;
  const exactRoutePermission = RoutePermissionOverrides[pathname];
  if (exactRoutePermission) return exactRoutePermission;

  if (pathname === '/branches/new') return 'CanCreateBranches';
  if (pathname.startsWith('/branches/edit/')) return 'CanUpdateBranches';
  if (pathname === '/locations/new') return 'CanCreateLocations';
  if (pathname.startsWith('/locations/edit/')) return 'CanUpdateLocations';
  if (pathname === '/users/new') return 'CanCreateUsers';
  if (pathname.startsWith('/users/edit/')) return 'CanUpdateUsers';
  if (pathname === '/customers/new' || pathname === '/customers/create')
    return 'CanCreateCustomers';
  if (pathname.startsWith('/customers/edit/')) return 'CanUpdateCustomers';
  if (pathname === '/cashier/sessions/open') return 'CanOpenCashierSessions';
  if (pathname === '/cashier/sessions/close') return 'CanCloseCashierSessions';
  if (pathname === '/settings/modules') return 'CanManageCompanyModules';
  if (pathname === '/settings/change-password') return 'CanChangePassword';
  if (pathname === '/accounting/setup') return undefined;

  if (pathname === '/inventory/categories/new') return 'CanCreateProductCategory';
  if (pathname.startsWith('/inventory/categories/edit/')) return 'CanUpdateProductCategory';
  if (pathname === '/inventory/locations/new') return 'CanCreateInventoryLocation';
  if (pathname.startsWith('/inventory/locations/edit/')) return 'CanUpdateInventoryLocation';
  if (pathname === '/inventory/products/new') return 'CanCreateProduct';
  if (pathname.startsWith('/inventory/products/edit/')) return 'CanUpdateProduct';
  if (pathname === '/inventory/stock-movements/new') return 'CanCreateStockMovement';
  if (pathname === '/inventory/stock-adjustments/new') return 'CanCreateStockAdjustment';
  if (pathname === '/inventory/stock-transfers/new') return 'CanCreateStockTransfer';
  if (pathname.startsWith('/inventory/stock-transfers/edit/')) return 'CanUpdateStockTransfer';

  if (pathname === '/accounting/tax') return 'CanReadAccounting';
  if (pathname === '/accounting/daily-cash' || pathname === '/accounting/expenses') {
    return 'CanReadAccounting';
  }

  if (
    pathname.startsWith('/parcels/sender-payments') ||
    pathname.startsWith('/parcels/receiver-cashier')
  ) {
    if (pathname.startsWith('/parcels/sender-payments')) return 'CanCreateSenderPayments';
    return 'CanCreateReceiverPayments';
  }
  if (pathname.startsWith('/parcels/internal-transfers/acknowledge')) {
    return 'CanAcknowledgeParcelInternalTransfers';
  }
  if (pathname.startsWith('/parcels/internal-transfers')) return 'CanReadParcelInternalTransfers';
  if (pathname === '/parcels/create') return 'CanCreateBookingWithParcels';

  return inferReadPermissionByPath(pathname);
}
