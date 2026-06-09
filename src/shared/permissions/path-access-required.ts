import { PermissionKeys, RoutePermissionOverrides, type PermissionKey } from './constants';
import { inferReadPermissionByPath } from './path-access-read';

export function inferRequiredPermissionByPath(pathname?: string): PermissionKey | undefined {
  if (!pathname) return undefined;
  const exactRoutePermission = RoutePermissionOverrides[pathname];
  if (exactRoutePermission) return exactRoutePermission;

  if (pathname === '/branches/new') return PermissionKeys.CanCreateBranches;
  if (pathname.startsWith('/branches/edit/')) return PermissionKeys.CanUpdateBranches;
  if (pathname === '/locations/new') return PermissionKeys.CanCreateLocations;
  if (pathname.startsWith('/locations/edit/')) return PermissionKeys.CanUpdateLocations;
  if (pathname === '/users/new') return PermissionKeys.CanCreateUsers;
  if (pathname.startsWith('/users/edit/')) return PermissionKeys.CanUpdateUsers;
  if (pathname === '/customers/new' || pathname === '/customers/create')
    return PermissionKeys.CanCreateCustomers;
  if (pathname.startsWith('/customers/edit/')) return PermissionKeys.CanUpdateCustomers;
  if (pathname === '/cashier/sessions/open') return PermissionKeys.CanOpenCashierSessions;
  if (pathname === '/cashier/sessions/close') return PermissionKeys.CanCloseCashierSessions;
  if (pathname === '/settings/modules') return PermissionKeys.CanManageCompanyModules;
  if (pathname === '/settings/change-password') return PermissionKeys.CanChangePassword;
  if (pathname === '/accounting/setup') return undefined;
  if (pathname.startsWith('/it-support/tickets')) return PermissionKeys.CanReadItSupportTickets;
  if (pathname.startsWith('/notification-hub/providers/edit/'))
    return PermissionKeys.CanManageNotificationProviders;
  if (pathname.startsWith('/notification-hub/templates/edit/'))
    return PermissionKeys.CanManageNotificationTemplates;

  if (pathname === '/inventory/categories/new') return PermissionKeys.CanCreateProductCategory;
  if (pathname.startsWith('/inventory/categories/edit/'))
    return PermissionKeys.CanUpdateProductCategory;
  if (pathname === '/inventory/locations/new') return PermissionKeys.CanCreateInventoryLocation;
  if (pathname.startsWith('/inventory/locations/edit/'))
    return PermissionKeys.CanUpdateInventoryLocation;
  if (pathname === '/inventory/products/new') return PermissionKeys.CanCreateProduct;
  if (pathname.startsWith('/inventory/products/edit/')) return PermissionKeys.CanUpdateProduct;
  if (pathname === '/inventory/stock-movements/new') return PermissionKeys.CanCreateStockMovement;
  if (pathname === '/inventory/stock-consumption') return PermissionKeys.CanReadStockMovements;
  if (pathname.startsWith('/inventory/stock-movements/edit/'))
    return PermissionKeys.CanCreateStockMovement;
  if (pathname === '/inventory/stock-lots/new') return PermissionKeys.CanCreateStockMovement;
  if (pathname.startsWith('/inventory/stock-lots/view/')) return PermissionKeys.CanGetStockLevel;
  if (pathname.startsWith('/inventory/stock-lots/traceability/'))
    return PermissionKeys.CanReadStockLevels;
  if (pathname === '/inventory/stock-lots/analytics') return PermissionKeys.CanReadStockLevels;
  if (pathname === '/inventory/stock-lots/expiry-alerts') return PermissionKeys.CanReadStockLevels;
  if (pathname === '/inventory/stock-adjustments/new')
    return PermissionKeys.CanCreateStockAdjustment;
  if (pathname.startsWith('/inventory/stock-adjustments/edit/'))
    return PermissionKeys.CanCreateStockAdjustment;
  if (pathname === '/inventory/stock-transfers/new') return PermissionKeys.CanCreateStockTransfer;
  if (pathname.startsWith('/inventory/stock-transfers/edit/'))
    return PermissionKeys.CanUpdateStockTransfer;
  if (pathname.startsWith('/inventory/stock-transfers/receive/'))
    return PermissionKeys.CanUpdateStockTransfer;
  if (pathname === '/inventory/stock-requests/issue') return PermissionKeys.CanReadStockRequests;
  if (pathname === '/inventory/stock-requests/receive') return PermissionKeys.CanReadStockRequests;
  if (pathname.startsWith('/inventory/stock-requests/receive/'))
    return PermissionKeys.CanGetStockRequest;
  if (pathname === '/inventory/stock-requests/new') return PermissionKeys.CanCreateStockRequest;
  if (pathname.startsWith('/inventory/stock-requests/view/'))
    return PermissionKeys.CanGetStockRequest;
  if (pathname.startsWith('/inventory/stock-requests/fulfill/'))
    return PermissionKeys.CanFulfillStockRequest;
  if (pathname.startsWith('/inventory/stock-requests/acknowledge/'))
    return PermissionKeys.CanFulfillStockRequest;
  if (pathname === '/inventory/stock-count-sessions/new')
    return PermissionKeys.CanCreateStockMovement;
  if (pathname.startsWith('/inventory/stock-count-sessions/view/'))
    return PermissionKeys.CanReadStockLevels;
  if (pathname.startsWith('/inventory/stock-reservations/view/'))
    return PermissionKeys.CanGetStockRequest;
  if (pathname.startsWith('/inventory/stock-reservations'))
    return PermissionKeys.CanReadStockRequests;
  if (pathname.startsWith('/inventory/stock-allocation-policy/edit'))
    return PermissionKeys.CanApproveStockRequest;
  if (pathname.startsWith('/inventory/stock-allocation-policy'))
    return PermissionKeys.CanApproveStockRequest;
  if (pathname === '/inventory/monitoring') return PermissionKeys.CanReadInventoryOverview;
  if (pathname === '/inventory/reorder-suggestions') return PermissionKeys.CanReadInventoryOverview;
  if (pathname === '/inventory/stock-maintenance/new')
    return PermissionKeys.CanCreateStockMaintenanceRecord;
  if (pathname.startsWith('/inventory/stock-maintenance/view/'))
    return PermissionKeys.CanGetStockMaintenanceRecord;
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
  if (pathname === '/fleet-transport/trips/new') return PermissionKeys.CanCreateFleetTrips;
  if (pathname.startsWith('/fleet-transport/trips/view/')) return PermissionKeys.CanReadFleetTrips;
  if (pathname.startsWith('/fleet-transport/routes/plans')) return PermissionKeys.CanReadFleetTrips;
  if (pathname.startsWith('/fleet-transport/trips/crew/')) return PermissionKeys.CanAssignFleetCrew;
  if (pathname.startsWith('/fleet-transport/trips/start/'))
    return PermissionKeys.CanStartFleetTrips;
  if (pathname.startsWith('/fleet-transport/trips/close/'))
    return PermissionKeys.CanCloseFleetTrips;
  if (pathname.startsWith('/fleet-transport/trips/')) return PermissionKeys.CanReadFleetTrips;
  if (pathname.startsWith('/fleet-transport/vehicles/edit/'))
    return PermissionKeys.CanUpdateFleetVehicles;
  if (pathname.startsWith('/fleet-transport/vehicles/view/') && pathname.includes('/documents/new'))
    return PermissionKeys.CanUpdateFleetVehicles;
  if (pathname.startsWith('/fleet-transport/vehicles/view/'))
    return PermissionKeys.CanReadFleetTransport;
  if (pathname.startsWith('/fleet-transport/fuel-analytics'))
    return PermissionKeys.CanReadFleetTransport;
  if (pathname.startsWith('/fleet-transport/fuel-logs/edit/'))
    return PermissionKeys.CanCreateFleetFuelLogs;
  if (pathname.startsWith('/fleet-transport/drivers/')) return PermissionKeys.CanReadFleetTransport;
  if (pathname.startsWith('/fleet-transport/rosters/edit/'))
    return PermissionKeys.CanAssignFleetCrew;
  if (pathname.startsWith('/fleet-transport/rosters')) return PermissionKeys.CanReadFleetTransport;
  if (pathname.startsWith('/fleet-transport/compliance'))
    return PermissionKeys.CanReadFleetTransport;
  if (pathname.startsWith('/fleet-transport/maintenance'))
    return PermissionKeys.CanReadFleetTransport;
  if (pathname.startsWith('/fleet-transport/dispatch/route-assignments'))
    return PermissionKeys.CanAssignFleetCrew;
  if (pathname.startsWith('/fleet-transport/dispatch/load-matching'))
    return PermissionKeys.CanAssignFleetCrew;
  if (pathname.startsWith('/fleet-transport/dispatch/check-in'))
    return PermissionKeys.CanStartFleetTrips;
  if (pathname.startsWith('/fleet-transport/dispatch/check-out'))
    return PermissionKeys.CanCloseFleetTrips;
  if (pathname.startsWith('/fleet-transport/dispatch')) return PermissionKeys.CanReadFleetTransport;
  if (pathname.startsWith('/fleet-transport/decision-support'))
    return PermissionKeys.CanReadFleetTransport;
  if (pathname.startsWith('/procurement/fleet-policies/edit/'))
    return PermissionKeys.CanCreateProcurementPurchaseRequests;
  if (pathname.startsWith('/procurement/fleet-policies/new'))
    return PermissionKeys.CanCreateProcurementPurchaseRequests;
  if (pathname.startsWith('/procurement/demands/approvals'))
    return PermissionKeys.CanApproveProcurementPurchaseRequests;
  if (pathname.startsWith('/procurement/demands/consolidations/new'))
    return PermissionKeys.CanCreateProcurementPurchaseRequests;
  if (pathname.startsWith('/procurement/demands/inventory-low-stock'))
    return PermissionKeys.CanCreateProcurementPurchaseRequests;
  if (pathname.startsWith('/procurement/supplier-quotes/new'))
    return PermissionKeys.CanCreateProcurementPurchaseRequests;
  if (pathname.startsWith('/procurement/purchase-orders/new'))
    return PermissionKeys.CanCreateProcurementPurchaseRequests;
  if (pathname.startsWith('/procurement/goods-receipts/new'))
    return PermissionKeys.CanCreateProcurementPurchaseRequests;
  if (pathname.startsWith('/procurement/suppliers/edit/'))
    return PermissionKeys.CanUpdateProcurementSuppliers;
  if (pathname.startsWith('/procurement/purchase-requests/edit/'))
    return PermissionKeys.CanCreateProcurementPurchaseRequests;
  if (pathname.startsWith('/reconciliation/sessions/edit/'))
    return PermissionKeys.CanCreateReconciliationSessions;
  if (pathname.startsWith('/reconciliation/bank-settlements/edit/'))
    return PermissionKeys.CanCreateReconciliationBankSettlements;
  if (pathname.startsWith('/customer-wallet-credit/payments/edit/'))
    return PermissionKeys.CanCreateCustomerWalletCreditPayments;
  if (pathname.startsWith('/notification-hub/campaigns/edit/'))
    return PermissionKeys.CanCreateNotificationCampaigns;
  if (pathname.startsWith('/parcels/edit/')) return PermissionKeys.CanCreateBookingWithParcels;

  if (pathname === '/accounting/tax') return PermissionKeys.CanReadAccounting;
  if (pathname === '/accounting/daily-cash' || pathname.startsWith('/accounting/expenses'))
    return PermissionKeys.CanReadAccounting;

  if (
    pathname.startsWith('/parcels/sender-payments') ||
    pathname.startsWith('/parcels/receiver-cashier')
  ) {
    if (pathname.startsWith('/parcels/sender-payments'))
      return PermissionKeys.CanCreateSenderPayments;
    return PermissionKeys.CanCreateReceiverPayments;
  }
  if (pathname.startsWith('/parcels/internal-transfers/acknowledge'))
    return PermissionKeys.CanAcknowledgeParcelInternalTransfers;
  if (pathname.startsWith('/parcels/internal-transfers'))
    return PermissionKeys.CanReadParcelInternalTransfers;
  if (pathname === '/parcels/create') return PermissionKeys.CanCreateBookingWithParcels;

  return inferReadPermissionByPath(pathname);
}
