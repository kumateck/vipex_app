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
  if (pathname.startsWith('/inventory/stock-lots')) return 'CanListStockLevels';
  if (pathname.startsWith('/inventory/stock-movements')) return 'CanListStockMovements';
  if (pathname.startsWith('/inventory/stock-adjustments')) return 'CanListStockAdjustments';
  if (pathname.startsWith('/inventory/stock-transfers')) return 'CanListStockTransfers';
  if (pathname.startsWith('/inventory/stock-requests')) return 'CanListStockRequests';
  if (pathname.startsWith('/inventory/reorder-suggestions')) return 'CanReadInventoryOverview';
  if (pathname.startsWith('/inventory/stock-count-sessions')) return 'CanReadStockLevels';
  if (pathname.startsWith('/inventory/stock-maintenance')) return 'CanListStockMaintenanceRecords';
  if (pathname.startsWith('/inventory/approval-policies'))
    return 'CanReadInventoryApprovalPolicies';
  if (pathname.startsWith('/inventory/approval-requests'))
    return 'CanReadInventoryApprovalRequests';
  if (pathname.startsWith('/inventory/valuation')) return 'CanReadInventoryValuation';
  if (pathname.startsWith('/inventory/replenishment-proposals'))
    return 'CanReadReplenishmentProposals';
  if (pathname.startsWith('/inventory/tasks')) return 'CanReadInventoryTasks';
  if (pathname.startsWith('/inventory/audit/journal')) return 'CanReadInventoryAuditJournal';
  if (pathname.startsWith('/inventory/audit/corrections')) return 'CanCreateInventoryCorrection';
  if (pathname.startsWith('/inventory/reports/enterprise-kpis'))
    return 'CanReadInventoryEnterpriseKpis';
  if (pathname.startsWith('/inventory')) return 'CanListProducts';
  if (pathname.startsWith('/procurement')) return 'CanReadProcurement';
  if (pathname.startsWith('/fleet-transport/trips')) return 'CanReadFleetTrips';
  if (pathname.startsWith('/fleet-transport')) return 'CanReadFleetTransport';
  if (pathname.startsWith('/customer-wallet-credit')) return 'CanReadCustomerWalletCredit';
  if (pathname.startsWith('/reconciliation')) return 'CanReadReconciliation';
  if (pathname.startsWith('/notification-hub')) return 'CanReadNotificationHub';
  if (pathname.startsWith('/it-support')) return 'CanReadItSupportTickets';

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
  if (pathname.startsWith('/it-support/tickets')) return 'CanReadItSupportTickets';
  if (pathname.startsWith('/notification-hub/providers/edit/')) {
    return 'CanManageNotificationProviders';
  }
  if (pathname.startsWith('/notification-hub/templates/edit/')) {
    return 'CanManageNotificationTemplates';
  }

  if (pathname === '/inventory/categories/new') return 'CanCreateProductCategory';
  if (pathname.startsWith('/inventory/categories/edit/')) return 'CanUpdateProductCategory';
  if (pathname === '/inventory/locations/new') return 'CanCreateInventoryLocation';
  if (pathname.startsWith('/inventory/locations/edit/')) return 'CanUpdateInventoryLocation';
  if (pathname === '/inventory/products/new') return 'CanCreateProduct';
  if (pathname.startsWith('/inventory/products/edit/')) return 'CanUpdateProduct';
  if (pathname === '/inventory/stock-movements/new') return 'CanCreateStockMovement';
  if (pathname.startsWith('/inventory/stock-movements/edit/')) return 'CanCreateStockMovement';
  if (pathname === '/inventory/stock-lots/new') return 'CanCreateStockMovement';
  if (pathname.startsWith('/inventory/stock-lots/view/')) return 'CanGetStockLevel';
  if (pathname.startsWith('/inventory/stock-lots/traceability/')) return 'CanReadStockLevels';
  if (pathname === '/inventory/stock-lots/analytics') return 'CanReadStockLevels';
  if (pathname === '/inventory/stock-lots/expiry-alerts') return 'CanReadStockLevels';
  if (pathname === '/inventory/stock-adjustments/new') return 'CanCreateStockAdjustment';
  if (pathname.startsWith('/inventory/stock-adjustments/edit/')) return 'CanCreateStockAdjustment';
  if (pathname === '/inventory/stock-transfers/new') return 'CanCreateStockTransfer';
  if (pathname.startsWith('/inventory/stock-transfers/edit/')) return 'CanUpdateStockTransfer';
  if (pathname.startsWith('/inventory/stock-transfers/receive/')) return 'CanUpdateStockTransfer';
  if (pathname === '/inventory/stock-requests/new') return 'CanCreateStockRequest';
  if (pathname.startsWith('/inventory/stock-requests/view/')) return 'CanGetStockRequest';
  if (pathname.startsWith('/inventory/stock-requests/fulfill/')) return 'CanFulfillStockRequest';
  if (pathname.startsWith('/inventory/stock-requests/acknowledge/'))
    return 'CanFulfillStockRequest';
  if (pathname === '/inventory/stock-count-sessions/new') return 'CanCreateStockMovement';
  if (pathname.startsWith('/inventory/stock-count-sessions/view/')) return 'CanReadStockLevels';
  if (pathname.startsWith('/inventory/stock-reservations/view/')) return 'CanGetStockRequest';
  if (pathname.startsWith('/inventory/stock-reservations')) return 'CanReadStockRequests';
  if (pathname.startsWith('/inventory/stock-allocation-policy/edit'))
    return 'CanApproveStockRequest';
  if (pathname.startsWith('/inventory/stock-allocation-policy')) return 'CanApproveStockRequest';
  if (pathname === '/inventory/monitoring') return 'CanReadInventoryOverview';
  if (pathname === '/inventory/reorder-suggestions') return 'CanReadInventoryOverview';
  if (pathname === '/inventory/stock-maintenance/new') return 'CanCreateStockMaintenanceRecord';
  if (pathname.startsWith('/inventory/stock-maintenance/view/'))
    return 'CanGetStockMaintenanceRecord';
  if (pathname.startsWith('/inventory/approval-policies'))
    return 'CanReadInventoryApprovalPolicies';
  if (pathname.startsWith('/inventory/approval-requests'))
    return 'CanReadInventoryApprovalRequests';
  if (pathname.startsWith('/inventory/valuation')) return 'CanReadInventoryValuation';
  if (pathname.startsWith('/inventory/replenishment-proposals'))
    return 'CanReadReplenishmentProposals';
  if (pathname.startsWith('/inventory/tasks')) return 'CanReadInventoryTasks';
  if (pathname.startsWith('/inventory/audit/journal')) return 'CanReadInventoryAuditJournal';
  if (pathname.startsWith('/inventory/audit/corrections')) return 'CanCreateInventoryCorrection';
  if (pathname.startsWith('/inventory/reports/enterprise-kpis'))
    return 'CanReadInventoryEnterpriseKpis';
  if (pathname === '/fleet-transport/trips/new') return 'CanCreateFleetTrips';
  if (pathname.startsWith('/fleet-transport/trips/view/')) return 'CanReadFleetTrips';
  if (pathname.startsWith('/fleet-transport/routes/plans')) return 'CanReadFleetTrips';
  if (pathname.startsWith('/fleet-transport/trips/crew/')) return 'CanAssignFleetCrew';
  if (pathname.startsWith('/fleet-transport/trips/start/')) return 'CanStartFleetTrips';
  if (pathname.startsWith('/fleet-transport/trips/close/')) return 'CanCloseFleetTrips';
  if (pathname.startsWith('/fleet-transport/trips/')) return 'CanReadFleetTrips';
  if (pathname.startsWith('/fleet-transport/vehicles/edit/')) return 'CanUpdateFleetVehicles';
  if (
    pathname.startsWith('/fleet-transport/vehicles/view/') &&
    pathname.includes('/documents/new')
  ) {
    return 'CanUpdateFleetVehicles';
  }
  if (pathname.startsWith('/fleet-transport/vehicles/view/')) return 'CanReadFleetTransport';
  if (pathname.startsWith('/fleet-transport/fuel-analytics')) return 'CanReadFleetTransport';
  if (pathname.startsWith('/fleet-transport/fuel-logs/edit/')) return 'CanCreateFleetFuelLogs';
  if (pathname.startsWith('/fleet-transport/drivers/')) return 'CanReadFleetTransport';
  if (pathname.startsWith('/fleet-transport/rosters/edit/')) return 'CanAssignFleetCrew';
  if (pathname.startsWith('/fleet-transport/rosters')) return 'CanReadFleetTransport';
  if (pathname.startsWith('/fleet-transport/compliance')) return 'CanReadFleetTransport';
  if (pathname.startsWith('/fleet-transport/maintenance')) return 'CanReadFleetTransport';
  if (pathname.startsWith('/fleet-transport/dispatch/route-assignments'))
    return 'CanAssignFleetCrew';
  if (pathname.startsWith('/fleet-transport/dispatch/load-matching')) return 'CanAssignFleetCrew';
  if (pathname.startsWith('/fleet-transport/dispatch/check-in')) return 'CanStartFleetTrips';
  if (pathname.startsWith('/fleet-transport/dispatch/check-out')) return 'CanCloseFleetTrips';
  if (pathname.startsWith('/fleet-transport/dispatch')) return 'CanReadFleetTransport';
  if (pathname.startsWith('/fleet-transport/decision-support')) return 'CanReadFleetTransport';
  if (pathname.startsWith('/procurement/fleet-policies/edit/'))
    return 'CanCreateProcurementPurchaseRequests';
  if (pathname.startsWith('/procurement/fleet-policies/new'))
    return 'CanCreateProcurementPurchaseRequests';
  if (pathname.startsWith('/procurement/demands/approvals'))
    return 'CanApproveProcurementPurchaseRequests';
  if (pathname.startsWith('/procurement/demands/consolidations/new'))
    return 'CanCreateProcurementPurchaseRequests';
  if (pathname.startsWith('/procurement/demands/inventory-low-stock'))
    return 'CanCreateProcurementPurchaseRequests';
  if (pathname.startsWith('/procurement/supplier-quotes/new'))
    return 'CanCreateProcurementPurchaseRequests';
  if (pathname.startsWith('/procurement/purchase-orders/new'))
    return 'CanCreateProcurementPurchaseRequests';
  if (pathname.startsWith('/procurement/goods-receipts/new'))
    return 'CanCreateProcurementPurchaseRequests';
  if (pathname.startsWith('/procurement/suppliers/edit/')) return 'CanUpdateProcurementSuppliers';
  if (pathname.startsWith('/procurement/purchase-requests/edit/')) {
    return 'CanCreateProcurementPurchaseRequests';
  }
  if (pathname.startsWith('/reconciliation/sessions/edit/'))
    return 'CanCreateReconciliationSessions';
  if (pathname.startsWith('/reconciliation/bank-settlements/edit/')) {
    return 'CanCreateReconciliationBankSettlements';
  }
  if (pathname.startsWith('/customer-wallet-credit/payments/edit/')) {
    return 'CanCreateCustomerWalletCreditPayments';
  }
  if (pathname.startsWith('/notification-hub/campaigns/edit/')) {
    return 'CanCreateNotificationCampaigns';
  }
  if (pathname.startsWith('/parcels/edit/')) return 'CanCreateBookingWithParcels';

  if (pathname === '/accounting/tax') return 'CanReadAccounting';
  if (pathname === '/accounting/daily-cash' || pathname.startsWith('/accounting/expenses')) {
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
