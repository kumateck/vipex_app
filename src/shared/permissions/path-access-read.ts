import { PermissionKeys, RoutePermissionOverrides, type PermissionKey } from './constants';

export function inferReadPermissionByPath(pathname?: string): PermissionKey | undefined {
  if (!pathname) return undefined;
  const exactRoutePermission = RoutePermissionOverrides[pathname];
  if (exactRoutePermission) return exactRoutePermission;

  if (pathname.startsWith('/parcels/in-transit/outgoing'))
    return PermissionKeys.CanReadParcelOutgoing;
  if (pathname.startsWith('/parcels/in-transit/incoming'))
    return PermissionKeys.CanReadParcelIncoming;
  if (pathname.startsWith('/parcels/receive')) return PermissionKeys.CanReadParcelScan;
  if (pathname.startsWith('/parcels/consignments/') && pathname.endsWith('/receive'))
    return PermissionKeys.CanReadParcelScan;
  if (pathname === '/parcels' || pathname.startsWith('/parcels/'))
    return PermissionKeys.CanReadParcels;
  if (pathname === '/customers' || pathname.startsWith('/customers/'))
    return PermissionKeys.CanReadCustomers;
  if (pathname === '/accounting' || pathname.startsWith('/accounting/'))
    return PermissionKeys.CanReadAccounting;
  if (pathname.startsWith('/payroll/compensation')) return PermissionKeys.CanReadCompensation;
  if (pathname.startsWith('/payroll/groups')) return PermissionKeys.CanReadPayrollGroups;
  if (pathname.startsWith('/payroll/cycles')) return PermissionKeys.CanListPayrollCycles;
  if (pathname.startsWith('/payroll/inputs')) return PermissionKeys.CanReadPayrollInputs;
  if (pathname.startsWith('/cashier/sessions/')) return PermissionKeys.CanReadCashierSessions;
  if (pathname.startsWith('/hr/employees')) return PermissionKeys.CanListEmployees;
  if (pathname.startsWith('/hr/departments')) return PermissionKeys.CanReadDepartments;
  if (pathname.startsWith('/hr/job-titles')) return PermissionKeys.CanReadJobTitles;
  if (pathname.startsWith('/hr/attendance')) return PermissionKeys.CanListAttendance;
  if (pathname.startsWith('/hr/leave')) return PermissionKeys.CanListLeaveRequests;
  if (pathname.startsWith('/users')) return PermissionKeys.CanReadUsers;
  if (pathname.startsWith('/roles')) return PermissionKeys.CanReadRoles;
  if (pathname.startsWith('/permissions')) return PermissionKeys.CanReadPermissions;
  if (pathname.startsWith('/branches')) return PermissionKeys.CanReadBranches;
  if (pathname.startsWith('/locations')) return PermissionKeys.CanReadLocations;
  if (pathname.startsWith('/warehouses')) return PermissionKeys.CanReadWarehouses;
  if (pathname.startsWith('/settings/cards')) return PermissionKeys.CanReadCards;
  if (pathname.startsWith('/inventory/categories')) return PermissionKeys.CanListProductCategories;
  if (pathname.startsWith('/inventory/locations')) return PermissionKeys.CanListInventoryLocations;
  if (pathname.startsWith('/inventory/stock-levels')) return PermissionKeys.CanListStockLevels;
  if (pathname.startsWith('/inventory/stock-lots')) return PermissionKeys.CanListStockLevels;
  if (pathname.startsWith('/inventory/stock-movements'))
    return PermissionKeys.CanListStockMovements;
  if (pathname.startsWith('/inventory/stock-consumption'))
    return PermissionKeys.CanListStockMovements;
  if (pathname.startsWith('/inventory/stock-adjustments'))
    return PermissionKeys.CanListStockAdjustments;
  if (pathname.startsWith('/inventory/stock-transfers'))
    return PermissionKeys.CanListStockTransfers;
  if (pathname.startsWith('/inventory/stock-requests')) return PermissionKeys.CanListStockRequests;
  if (pathname.startsWith('/inventory/reorder-suggestions'))
    return PermissionKeys.CanReadInventoryOverview;
  if (pathname.startsWith('/inventory/stock-count-sessions'))
    return PermissionKeys.CanReadStockLevels;
  if (pathname.startsWith('/inventory/stock-maintenance'))
    return PermissionKeys.CanListStockMaintenanceRecords;
  if (pathname.startsWith('/inventory/approval-policies'))
    return PermissionKeys.CanReadInventoryApprovalPolicies;
  if (pathname.startsWith('/inventory/approval-requests'))
    return PermissionKeys.CanReadInventoryApprovalRequests;
  if (pathname.startsWith('/inventory/valuation')) return PermissionKeys.CanReadInventoryValuation;
  if (pathname.startsWith('/inventory/replenishment-proposals'))
    return PermissionKeys.CanReadReplenishmentProposals;
  if (pathname.startsWith('/inventory/tasks')) return PermissionKeys.CanReadInventoryTasks;
  if (pathname.startsWith('/inventory/audit/journal'))
    return PermissionKeys.CanReadInventoryAuditJournal;
  if (pathname.startsWith('/inventory/audit/corrections'))
    return PermissionKeys.CanCreateInventoryCorrection;
  if (pathname.startsWith('/inventory/reports/enterprise-kpis'))
    return PermissionKeys.CanReadInventoryEnterpriseKpis;
  if (pathname.startsWith('/inventory')) return PermissionKeys.CanListProducts;
  if (pathname.startsWith('/procurement')) return PermissionKeys.CanReadProcurement;
  if (pathname.startsWith('/fleet-transport/trips')) return PermissionKeys.CanReadFleetTripsPage;
  if (pathname.startsWith('/fleet-transport/vehicles')) return PermissionKeys.CanReadFleetVehicles;
  if (pathname.startsWith('/fleet-transport/fuel-analytics/fraud-signals'))
    return PermissionKeys.CanReadFleetFuelFraudSignals;
  if (pathname.startsWith('/fleet-transport/fuel-analytics'))
    return PermissionKeys.CanReadFleetFuelAnalytics;
  if (pathname.startsWith('/fleet-transport/fuel-logs/approvals'))
    return PermissionKeys.CanReadFleetFuelApprovals;
  if (pathname.startsWith('/fleet-transport/fuel-logs')) return PermissionKeys.CanReadFleetFuelLogs;
  if (pathname.startsWith('/fleet-transport/rosters')) return PermissionKeys.CanReadFleetRosters;
  if (pathname.startsWith('/fleet-transport/compliance/kpis'))
    return PermissionKeys.CanReadFleetComplianceKpis;
  if (pathname.startsWith('/fleet-transport/compliance/ops'))
    return PermissionKeys.CanReadFleetOpsQueue;
  if (pathname.startsWith('/fleet-transport/compliance'))
    return PermissionKeys.CanReadFleetComplianceDashboard;
  if (pathname.startsWith('/fleet-transport/maintenance'))
    return PermissionKeys.CanReadFleetMaintenanceDashboard;
  if (pathname.startsWith('/fleet-transport/dispatch'))
    return PermissionKeys.CanReadFleetDispatchBoard;
  if (pathname.startsWith('/fleet-transport/decision-support'))
    return PermissionKeys.CanReadFleetDecisionSupport;
  if (pathname.startsWith('/fleet-transport')) return PermissionKeys.CanReadFleetTransport;
  if (pathname.startsWith('/customer-wallet-credit'))
    return PermissionKeys.CanReadCustomerWalletCredit;
  if (pathname.startsWith('/reconciliation')) return PermissionKeys.CanReadReconciliation;
  if (pathname.startsWith('/notification-hub')) return PermissionKeys.CanReadNotificationHub;
  if (pathname.startsWith('/it-support')) return PermissionKeys.CanReadItSupportTickets;

  if (pathname.startsWith('/reports/financial/')) return PermissionKeys.CanReadAccounting;
  if (pathname.startsWith('/reports/branch/'))
    return PermissionKeys.CanViewReportBranchProfitSummary;
  if (pathname.startsWith('/reports/payroll/')) return PermissionKeys.CanReadPayrollRun;
  if (pathname.startsWith('/reports/hr/')) return PermissionKeys.CanListEmployees;
  if (pathname.startsWith('/reports/attendance/')) return PermissionKeys.CanListAttendance;
  if (pathname.startsWith('/reports/leave/')) return PermissionKeys.CanListLeaveRequests;
  if (pathname.startsWith('/reports/expenses/')) return PermissionKeys.CanReadAccounting;
  if (pathname.startsWith('/reports/cash/')) return PermissionKeys.CanReadAccounting;
  if (pathname.startsWith('/reports/customers/')) return PermissionKeys.CanReadCustomers;
  if (pathname.startsWith('/reports/parcels/'))
    return PermissionKeys.CanViewReportParcelsStatusSummary;
  if (pathname.startsWith('/reports/consignments/')) return PermissionKeys.CanReadConsignments;
  if (pathname.startsWith('/reports/transfers/'))
    return PermissionKeys.CanReadParcelInternalTransfers;
  if (pathname.startsWith('/reports/cashier/')) return PermissionKeys.CanViewReportCashierRevenue;
  if (pathname.startsWith('/reports/inventory/'))
    return PermissionKeys.CanViewReportInventoryLowStock;
  if (pathname.startsWith('/reports/audit/')) return PermissionKeys.CanListAuditLogs;

  return undefined;
}
