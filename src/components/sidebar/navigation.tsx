import { type LucideIconProps } from '@/components/ui';
import { PermissionKeys, type PermissionKey } from '@/shared/permissions/constants';

// Define the sub-item structure for nested menu items.
interface SubItem {
  id?: string;
  title: string;
  url?: string;
  icon?: LucideIconProps;
  permissionKey?: PermissionKey;
  hiddenInSidebar?: boolean;
  children?: SubItem[];
}

// Define the main menu item structure.
export interface MenuItem {
  id?: string;
  title: string;
  url?: string;
  icon: LucideIconProps;
  isActive?: boolean;
  permissionKey?: PermissionKey;
  hiddenInSidebar?: boolean;
  items?: SubItem[]; // Optional array of sub-items.
}

// Define the structure for each main route section.
export interface Route {
  title: string;
  menu: MenuItem[];
}

const IMPLEMENTED_STANDALONE_REPORT_URLS = new Set<string>([
  '/reports/financial/trial-balance',
  '/reports/financial/account-statement',
  '/reports/financial/income-statement',
  '/reports/financial/profit-loss',
  '/reports/financial/balance-sheet',
  '/reports/financial/cash-flow',
  '/reports/financial/general-ledger',
  '/reports/financial/journal-listing',
  '/reports/financial/account-activity',
  '/reports/branch/monthly-summary',
  '/reports/branch/profit-summary',
  '/reports/payroll/register-employee',
  '/reports/payroll/earnings',
  '/reports/payroll/deductions',
  '/reports/payroll/overtime',
  '/reports/payroll/journal-posting',
  '/reports/hr/master-list',
  '/reports/attendance/daily',
  '/reports/leave/requests',
  '/reports/expenses/by-category',
  '/reports/cash/daily-confirmation',
  '/reports/customers/statement',
  '/reports/customers/credit-summary',
  '/reports/customers/aging',
  '/reports/parcels/register',
  '/reports/parcels/delivered',
  '/reports/transfers/pending',
  '/reports/transfers/acknowledged',
  '/reports/cashier/shifts',
  '/reports/cashier/revenue',
  '/reports/audit/user',
  '/reports/audit/module',
  '/reports/audit/entity',
  '/reports/audit/suspicious',
  '/reports/audit/deleted',
  '/reports/audit/roles',
]);

function isImplementedReportUrl(url?: string) {
  if (!url) return true;
  if (!url.startsWith('/reports/')) return true;
  return IMPLEMENTED_STANDALONE_REPORT_URLS.has(url);
}

function filterSubItems(items?: SubItem[]): SubItem[] | undefined {
  if (!items?.length) return items;
  const filtered: SubItem[] = [];
  for (const item of items) {
    const nextChildren = filterSubItems(item.children);
    const keepByUrl = isImplementedReportUrl(item.url);
    const hasChildren = Boolean(nextChildren?.length);
    if (!keepByUrl && !hasChildren) continue;
    filtered.push({ ...item, children: nextChildren });
  }
  return filtered.length ? filtered : undefined;
}

const BASE_ROUTES: Route[] = [
  {
    title: 'Workspace',
    menu: [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: 'LayoutDashboard',
      },
      {
        title: 'Super Search',
        url: '/parcels',
        icon: 'Package',
        permissionKey: PermissionKeys.CanReadParcels,
      },
      {
        title: 'AI Insights Chat',
        url: '/ai-chat',
        icon: 'Sparkles',
        permissionKey: PermissionKeys.CanUseAIChat,
      },
      {
        title: 'Internal Communication',
        icon: 'MessageSquare',
        items: [
          {
            title: 'Team Chat',
            url: '/communication/chat',
          },
          {
            title: 'Calls',
            url: '/communication/calls',
          },
          {
            title: 'Events',
            url: '/communication/events',
          },
        ],
      },
      {
        title: 'Appearance',
        url: '/settings/appearance',
        icon: 'Palette',
      },
      {
        title: 'Help Center',
        url: '/help',
        icon: 'CircleQuestionMark',
      },
    ],
  },
  {
    title: 'Operations',
    menu: [
      {
        title: 'Booking & Shipping',
        icon: 'PackagePlus',
        permissionKey: PermissionKeys.CanReadParcelSendingModule,
        items: [
          {
            title: 'Create Parcel',
            url: '/parcels/create',
            permissionKey: PermissionKeys.CanCreateBookingWithParcels,
          },
          {
            title: 'Sender Payments',
            url: '/parcels/sender-payments',
            permissionKey: PermissionKeys.CanCreateSenderPayments,
          },
          {
            title: 'Self-Service Bookings',
            url: '/parcels/self-service',
            permissionKey: PermissionKeys.CanReadSelfServiceBookings,
          },
          {
            title: 'Reconciliation Cases',
            url: '/parcels/reconciliation-cases',
            permissionKey: PermissionKeys.CanReadParcelReconciliation,
          },
          {
            title: 'Consignments',
            url: '/parcels/processed',
            permissionKey: PermissionKeys.CanReadConsignments,
          },
          {
            title: 'Previous Consignments',
            url: '/parcels/consignments/history',
            permissionKey: PermissionKeys.CanReadConsignmentsHistory,
          },
          {
            title: 'In Transit (Outgoing)',
            url: '/parcels/in-transit/outgoing',
            permissionKey: PermissionKeys.CanReadParcelOutgoing,
          },
        ],
      },
      {
        title: 'Parcel Receiving',
        icon: 'PackageCheck',
        permissionKey: PermissionKeys.CanReadParcelReceivingModule,
        items: [
          {
            title: 'In Transit (Incoming)',
            url: '/parcels/in-transit/incoming',
            permissionKey: PermissionKeys.CanReadParcelIncoming,
          },
          {
            title: 'Discrepancies',
            url: '/parcels/discrepancies',
            permissionKey: PermissionKeys.CanReadParcelIncoming,
          },
          {
            title: 'Scan to Receive',
            url: '/parcels/receive',
            permissionKey: PermissionKeys.CanReadParcelScan,
          },
        ],
      },
      {
        title: 'Call Center',
        icon: 'Search',
        items: [
          {
            title: 'Call Outcomes',
            url: '/parcels/status',
            permissionKey: PermissionKeys.CanReadCallCenterParcelStatus,
          },
          {
            title: 'Address Collection',
            url: '/parcels/home-delivery/address',
            permissionKey: PermissionKeys.CanMarkDoorstepCalled,
          },
        ],
      },
      {
        title: 'Internal Transfers',
        icon: 'ArrowRightLeft',
        permissionKey: PermissionKeys.CanReadParcelInternalTransfers,
        items: [
          {
            title: 'Internal Transfer Create',
            url: '/parcels/internal-transfers',
            permissionKey: PermissionKeys.CanReadParcelInternalTransfers,
          },
          {
            title: 'Transfer Ack',
            url: '/parcels/internal-transfers/acknowledge',
            permissionKey: PermissionKeys.CanReadParcelInternalTransfers,
          },
          {
            title: 'Internal Transfer History',
            url: '/parcels/internal-transfers/history',
            permissionKey: PermissionKeys.CanReadParcelInternalTransfers,
          },
        ],
      },
      {
        title: 'Pickup & Collection',
        icon: 'ListChecks',
        permissionKey: PermissionKeys.CanCreatePickupQueue,
        items: [
          {
            title: 'Pickup Queue',
            url: '/parcels/pickup-queue',
            permissionKey: PermissionKeys.CanCreatePickupQueue,
          },
          {
            title: 'Queue Board (Sender)',
            url: '/parcels/pickup-queue/sender',
            permissionKey: PermissionKeys.CanReadSenderPickupQueue,
          },
          {
            title: 'Waiting for Pickup',
            url: '/parcels/waiting-pickup',
            permissionKey: PermissionKeys.CanCompleteOfficePickup,
          },
          {
            title: 'Queue Board (Receiver)',
            url: '/parcels/pickup-queue/receiver',
            permissionKey: PermissionKeys.CanReadReceiverPickupQueue,
          },
          {
            title: 'Receiver Cashier',
            url: '/parcels/receiver-cashier',
            permissionKey: PermissionKeys.CanCreateReceiverPayments,
          },
          {
            title: 'Aged & Uncollected',
            url: '/parcels/uncollected',
            permissionKey: PermissionKeys.CanViewReportParcelsUncollected,
          },
        ],
      },
      {
        title: 'Last Mile Delivery',
        icon: 'Truck',
        items: [
          {
            title: 'Dispatch Parcels',
            url: '/parcels/home-delivery/dispatch',
            permissionKey: PermissionKeys.CanDispatchForDelivery,
          },
          {
            title: 'Rider Assigned',
            url: '/parcels/home-delivery/rider-assigned',
            permissionKey: PermissionKeys.CanDispatchForDelivery,
          },
          {
            title: 'Delivery Cashier',
            url: '/parcels/delivery-cashier',
            permissionKey: PermissionKeys.CanCompleteDoorstepDelivery,
          },
        ],
      },
      {
        title: 'Rider Workforce',
        icon: 'Bike',
        items: [
          {
            title: 'Current Deliveries',
            url: '/parcels/rider/current',
            permissionKey: PermissionKeys.CanReadRiderCurrentParcels,
          },
          {
            title: 'History',
            url: '/parcels/rider/history',
            permissionKey: PermissionKeys.CanReadRiderHistory,
          },
        ],
      },
      {
        title: 'Dispatch Optimization',
        url: '/dispatch-optimization',
        icon: 'Route',
      },
    ],
  },
  {
    title: 'Fleet Transport',
    menu: [
      {
        title: 'Fleet Transport',
        url: '/fleet-transport',
        icon: 'Truck',
        permissionKey: PermissionKeys.CanReadFleetTransport,
        items: [
          {
            title: 'Vehicles',
            url: '/fleet-transport/vehicles',
            permissionKey: PermissionKeys.CanReadFleetVehicles,
          },
          {
            title: 'Trips',
            url: '/fleet-transport/trips',
            permissionKey: PermissionKeys.CanReadFleetTripsPage,
          },
          {
            title: 'Route Plans',
            url: '/fleet-transport/routes/plans',
            permissionKey: PermissionKeys.CanReadFleetRoutePlans,
          },
          {
            title: 'Fuel Logs',
            url: '/fleet-transport/fuel-logs',
            permissionKey: PermissionKeys.CanReadFleetFuelLogs,
          },
          {
            title: 'Fuel Analytics',
            url: '/fleet-transport/fuel-analytics',
            permissionKey: PermissionKeys.CanReadFleetFuelAnalytics,
          },
          {
            title: 'Fuel Fraud Signals',
            url: '/fleet-transport/fuel-analytics/fraud-signals',
            permissionKey: PermissionKeys.CanReadFleetFuelFraudSignals,
          },
          {
            title: 'Fuel Approvals',
            url: '/fleet-transport/fuel-logs/approvals',
            permissionKey: PermissionKeys.CanReadFleetFuelApprovals,
          },
          {
            title: 'Driver Compliance',
            url: '/fleet-transport/drivers/compliance',
            permissionKey: PermissionKeys.CanReadFleetDriverComplianceRecords,
          },
          {
            title: 'Shift Rosters',
            url: '/fleet-transport/rosters',
            permissionKey: PermissionKeys.CanReadFleetRosters,
          },
          {
            title: 'Compliance Dashboard',
            url: '/fleet-transport/compliance',
            permissionKey: PermissionKeys.CanReadFleetComplianceDashboard,
          },
          {
            title: 'Compliance KPIs',
            url: '/fleet-transport/compliance/kpis',
            permissionKey: PermissionKeys.CanReadFleetComplianceKpis,
          },
          {
            title: 'Compliance Ops',
            url: '/fleet-transport/compliance/ops',
            permissionKey: PermissionKeys.CanReadFleetOpsQueue,
          },
          {
            title: 'Escalation Policy',
            url: '/fleet-transport/compliance/escalation-policy',
            permissionKey: PermissionKeys.CanReadFleetEscalationPolicy,
          },
          {
            title: 'Record Incident',
            url: '/fleet-transport/compliance/ops/incidents/new',
            permissionKey: PermissionKeys.CanCreateFleetComplianceIncident,
          },
          {
            title: 'Policy Ack',
            url: '/fleet-transport/compliance/ops/policy-acks/new',
            permissionKey: PermissionKeys.CanCreateFleetPolicyAcknowledgment,
          },
          {
            title: 'Maintenance',
            url: '/fleet-transport/maintenance',
            permissionKey: PermissionKeys.CanReadFleetMaintenanceDashboard,
          },
          {
            title: 'Downtime RCA Workflows',
            url: '/fleet-transport/maintenance/downtime/workflows',
            permissionKey: PermissionKeys.CanReadFleetDowntimeWorkflows,
          },
          {
            title: 'Work Order Part Movements',
            url: '/fleet-transport/maintenance/work-orders/part-movements',
            permissionKey: PermissionKeys.CanReadFleetWorkOrderPartMovements,
          },
          {
            title: 'Reliability Trends',
            url: '/fleet-transport/maintenance/reliability/trends',
            permissionKey: PermissionKeys.CanReadFleetReliabilityTrends,
          },
          {
            title: 'Maintenance KPIs',
            url: '/fleet-transport/maintenance/kpis',
            permissionKey: PermissionKeys.CanReadFleetMaintenanceKpis,
          },
          {
            title: 'Maintenance Traceability',
            url: '/fleet-transport/maintenance/procurement/traceability',
            permissionKey: PermissionKeys.CanReadFleetProcurementTraceability,
          },
          {
            title: 'Run Reorder Job',
            url: '/fleet-transport/maintenance/procurement/reorder',
            permissionKey: PermissionKeys.CanRunFleetProcurementReorder,
          },
          {
            title: 'Dispatch Board',
            url: '/fleet-transport/dispatch/board',
            permissionKey: PermissionKeys.CanReadFleetDispatchBoard,
          },
          {
            title: 'Route Assignment',
            url: '/fleet-transport/dispatch/route-assignments',
            permissionKey: PermissionKeys.CanReadFleetDispatchRouteQueue,
          },
          {
            title: 'Load Matching',
            url: '/fleet-transport/dispatch/load-matching',
            permissionKey: PermissionKeys.CanReadFleetDispatchLoadCandidates,
          },
          {
            title: 'Load Audit Trail',
            url: '/fleet-transport/dispatch/load-matching/audit',
            permissionKey: PermissionKeys.CanReadFleetTripLoads,
          },
          {
            title: 'Check-In Operator',
            url: '/fleet-transport/dispatch/check-in',
            permissionKey: PermissionKeys.CanCheckInFleetTrip,
          },
          {
            title: 'Check-Out Operator',
            url: '/fleet-transport/dispatch/check-out',
            permissionKey: PermissionKeys.CanCheckOutFleetTrip,
          },
          {
            title: 'Live Status',
            url: '/fleet-transport/dispatch/live-status',
            permissionKey: PermissionKeys.CanReadFleetDispatchBoard,
          },
          {
            title: 'Ops Performance',
            url: '/fleet-transport/dispatch/ops-performance',
            permissionKey: PermissionKeys.CanReadFleetDispatchPerformance,
          },
          {
            title: 'Exception Queue',
            url: '/fleet-transport/dispatch/exception-queue',
            permissionKey: PermissionKeys.CanReadFleetDispatchExceptions,
          },
          {
            title: 'Decision Support',
            url: '/fleet-transport/decision-support',
            permissionKey: PermissionKeys.CanReadFleetDecisionSupport,
          },
          {
            title: 'Executive Scorecard',
            url: '/fleet-transport/decision-support/executive-scorecard',
            permissionKey: PermissionKeys.CanReadFleetExecutiveScorecard,
          },
          {
            title: 'Unit Economics',
            url: '/fleet-transport/decision-support/unit-economics',
            permissionKey: PermissionKeys.CanReadFleetUnitEconomics,
          },
        ],
      },
    ],
  },
  {
    title: 'Commercial',
    menu: [
      {
        title: 'Customer Master ',
        icon: 'Users',
        items: [
          {
            title: 'All Customers',
            url: '/customers',
            permissionKey: PermissionKeys.CanReadCustomers,
          },
          // {
          //   title: 'Add Customer',
          //   url: '/customers/create',
          //   permissionKey: PermissionKeys.CanCreateCustomers,
          // },
        ],
      },
    ],
  },
  {
    title: 'Finance',
    menu: [
      {
        title: 'GL & Controls',
        icon: 'BookOpen',
        items: [
          {
            title: 'Daily Cash',
            url: '/accounting/daily-cash',
            permissionKey: PermissionKeys.CanCreateDailyCashConfirmation,
          },
          {
            title: 'Daily Cash Drafts',
            url: '/accounting/daily-cash/drafts',
            permissionKey: PermissionKeys.CanConfirmDailyCashConfirmation,
          },
          {
            title: 'Daily Cash Approvals',
            url: '/accounting/daily-cash/approvals',
            permissionKey: PermissionKeys.CanConfirmDailyCashConfirmation,
          },
          {
            title: 'Daily Cash Recorded',
            url: '/accounting/daily-cash/recorded',
            permissionKey: PermissionKeys.CanPostDailyCashConfirmation,
          },
          {
            title: 'Expenses',
            url: '/accounting/expenses',
            permissionKey: PermissionKeys.CanCreateExpenseRequest,
          },
          {
            title: 'Expense Drafts',
            url: '/accounting/expenses/drafts',
            permissionKey: PermissionKeys.CanSubmitExpenseRequest,
          },
          {
            title: 'Expense Approvals',
            url: '/accounting/expenses/approvals',
            permissionKey: PermissionKeys.CanApproveExpenseRequest,
          },
          {
            title: 'Expense Payments',
            url: '/accounting/expenses/payments',
            permissionKey: PermissionKeys.CanPayExpenseRequest,
          },
          {
            title: 'Expense Posting',
            url: '/accounting/expenses/posting',
            permissionKey: PermissionKeys.CanPostExpenseRequest,
          },
          {
            title: 'Expense History',
            url: '/accounting/expenses/history',
            permissionKey: PermissionKeys.CanReadAccounting,
          },
          {
            title: 'Insights',
            url: '/accounting/reports',
            permissionKey: PermissionKeys.CanReadAccounting,
          },
          {
            title: 'Accounting Setup',
            url: '/accounting/setup',
            permissionKey: PermissionKeys.CanReadAccountingSetup,
          },
          {
            title: 'Journal Entries',
            url: '/accounting/journal-entries',
            permissionKey: PermissionKeys.CanReadAccountingManualEntries,
          },
          {
            title: 'Journal Approvals',
            url: '/accounting/journal-approvals',
            permissionKey: PermissionKeys.CanApproveAccountingManualEntries,
          },
        ],
      },
      {
        title: 'Tax Computation & Filing',
        icon: 'Receipt',
        items: [
          {
            title: 'Tax Filing',
            url: '/accounting/tax',
            permissionKey: PermissionKeys.CanCreateTaxFilingPeriod,
          },
        ],
      },
      {
        title: 'Cashier Session Mgt',
        icon: 'Wallet',
        items: [
          {
            title: 'Active Sessions',
            url: '/cashier/sessions/active',
            permissionKey: PermissionKeys.CanReadActiveCashierSessions,
          },
          {
            title: 'Session History',
            url: '/cashier/sessions/history',
            permissionKey: PermissionKeys.CanReadCashierSessionsHistory,
          },
          {
            title: 'Open Session',
            url: '/cashier/sessions/open',
            permissionKey: PermissionKeys.CanReadOpenCashierSessions,
          },
          {
            title: 'Close Session',
            url: '/cashier/sessions/close',
            permissionKey: PermissionKeys.CanReadCloseCashierSessions,
          },
        ],
      },
    ],
  },
  {
    title: 'Human Capital',
    menu: [
      {
        title: 'Payroll Operations',
        icon: 'BadgeDollarSign',
        items: [
          {
            title: 'Compensation Setup',
            url: '/payroll/compensation',
            permissionKey: PermissionKeys.CanReadCompensation,
          },
          {
            title: 'Payroll Groups',
            url: '/payroll/groups',
            permissionKey: PermissionKeys.CanReadPayrollGroups,
          },
          {
            title: 'Payroll Cycles',
            url: '/payroll/cycles',
            permissionKey: PermissionKeys.CanListPayrollCycles,
          },
          {
            title: 'Payroll Inputs',
            url: '/payroll/inputs',
            permissionKey: PermissionKeys.CanReadPayrollInputs,
          },
        ],
      },
      {
        title: 'Employee Administration',
        url: '/hr/employees',
        icon: 'Briefcase',
        permissionKey: PermissionKeys.CanListEmployees,
      },
      {
        title: 'Department Administration',
        url: '/hr/departments',
        icon: 'Network',
        permissionKey: PermissionKeys.CanReadDepartments,
      },
      {
        title: 'Job Title Administration',
        url: '/hr/job-titles',
        icon: 'UserCog',
        permissionKey: PermissionKeys.CanReadJobTitles,
      },
      {
        title: 'Attendance Management',
        url: '/hr/attendance',
        icon: 'Clock3',
        permissionKey: PermissionKeys.CanReadAttendance,
      },
      {
        title: 'Leave Management',
        icon: 'CalendarDays',
        items: [
          {
            title: 'Leave Requests',
            url: '/hr/leave/requests',
            permissionKey: PermissionKeys.CanReadLeaveRequests,
          },
          {
            title: 'Leave Types',
            url: '/hr/leave/types',
            permissionKey: PermissionKeys.CanReadLeaveTypes,
          },
          {
            title: 'Leave History',
            url: '/hr/leave/history',
            permissionKey: PermissionKeys.CanReadLeaveRequests,
          },
        ],
      },
    ],
  },
  {
    title: 'Supply Chain',
    menu: [
      {
        title: 'Sourcing & Purchasing',
        icon: 'BookOpen',
        items: [
          {
            title: 'Suppliers List',
            url: '/procurement/suppliers',
            permissionKey: PermissionKeys.CanReadProcurement,
          },
          // {
          //   title: 'Create Supplier',
          //   url: '/procurement/suppliers/new',
          //   permissionKey: PermissionKeys.CanCreateProcurementSuppliers,
          // },
          {
            title: 'Request List',
            url: '/procurement/purchase-requests',
            permissionKey: PermissionKeys.CanReadProcurement,
          },
          {
            title: 'Demands List',
            url: '/procurement/demands',
            permissionKey: PermissionKeys.CanReadProcurement,
          },
          // {
          //   title: 'Create Demand',
          //   url: '/procurement/demands/new',
          //   permissionKey: PermissionKeys.CanCreateProcurementPurchaseRequests,
          // },
          {
            title: 'Fleet Intake',
            url: '/procurement/demands/fleet-low-stock',
            permissionKey: PermissionKeys.CanCreateProcurementPurchaseRequests,
          },
          {
            title: 'Inventory Intake',
            url: '/procurement/demands/inventory-low-stock',
            permissionKey: PermissionKeys.CanCreateProcurementPurchaseRequests,
          },
          {
            title: 'Demand Consolidations',
            url: '/procurement/demands/consolidations',
            permissionKey: PermissionKeys.CanReadProcurement,
          },
          // {
          //   title: 'Create Consolidation',
          //   url: '/procurement/demands/consolidations/new',
          //   permissionKey: PermissionKeys.CanCreateProcurementPurchaseRequests,
          // },
          {
            title: 'Demand Approvals',
            url: '/procurement/demands/approvals',
            permissionKey: PermissionKeys.CanApproveProcurementPurchaseRequests,
          },
          {
            title: 'Supplier Quotes',
            url: '/procurement/supplier-quotes',
            permissionKey: PermissionKeys.CanReadProcurement,
          },
          // {
          //   title: 'Create Quote',
          //   url: '/procurement/supplier-quotes/new',
          //   permissionKey: PermissionKeys.CanCreateProcurementPurchaseRequests,
          // },
          {
            title: 'Purchase Orders',
            url: '/procurement/purchase-orders',
            permissionKey: PermissionKeys.CanReadProcurement,
          },
          // {
          //   title: 'Create PO',
          //   url: '/procurement/purchase-orders/new',
          //   permissionKey: PermissionKeys.CanCreateProcurementPurchaseRequests,
          // },
          {
            title: 'Goods Receipts',
            url: '/procurement/goods-receipts',
            permissionKey: PermissionKeys.CanReadProcurement,
          },
          // {
          //   title: 'Create Receipt',
          //   url: '/procurement/goods-receipts/new',
          //   permissionKey: PermissionKeys.CanCreateProcurementPurchaseRequests,
          // },
          // {
          //   title: 'Create Request',
          //   url: '/procurement/purchase-requests/new',
          //   permissionKey: PermissionKeys.CanCreateProcurementPurchaseRequests,
          // },
          {
            title: 'Approvals',
            url: '/procurement/purchase-requests/approvals',
            permissionKey: PermissionKeys.CanApproveProcurementPurchaseRequests,
          },
        ],
      },
    ],
  },

  {
    title: 'Finance',
    menu: [
      {
        title: 'Customer Wallet & Credit Control',
        icon: 'Wallet',
        items: [
          {
            title: 'Accounts List',
            url: '/customer-wallet-credit/accounts',
            permissionKey: PermissionKeys.CanReadCustomerWalletCredit,
          },
          {
            title: 'Create Payment',
            url: '/customer-wallet-credit/payments/new',
            permissionKey: PermissionKeys.CanCreateCustomerWalletCreditPayments,
          },
          {
            title: 'Approvals',
            url: '/customer-wallet-credit/approvals',
            permissionKey: PermissionKeys.CanApproveCustomerWalletCreditControls,
          },
        ],
      },
      {
        title: 'Operational Reconciliation',
        icon: 'Receipt',
        items: [
          {
            title: 'Session List',
            url: '/reconciliation/sessions',
            permissionKey: PermissionKeys.CanReadReconciliation,
          },
          {
            title: 'Create Session',
            url: '/reconciliation/sessions/new',
            permissionKey: PermissionKeys.CanCreateReconciliationSessions,
          },
          {
            title: 'Session Approvals',
            url: '/reconciliation/sessions/approvals',
            permissionKey: PermissionKeys.CanApproveReconciliationSessions,
          },
          {
            title: 'Settlement List',
            url: '/reconciliation/bank-settlements',
            permissionKey: PermissionKeys.CanReadReconciliation,
          },
          {
            title: 'Create Settlement',
            url: '/reconciliation/bank-settlements/new',
            permissionKey: PermissionKeys.CanCreateReconciliationBankSettlements,
          },
          {
            title: 'Settlement Approvals',
            url: '/reconciliation/bank-settlements/approvals',
            permissionKey: PermissionKeys.CanApproveReconciliationBankSettlements,
          },
        ],
      },
    ],
  },
  {
    title: 'Governance',
    menu: [
      {
        title: 'SLA & Claims Governance',
        url: '/sla-claims',
        icon: 'Shield',
      },
      {
        title: 'Document Compliance',
        url: '/document-compliance',
        icon: 'FileText',
      },
    ],
  },
  {
    title: 'Commercial',
    menu: [
      {
        title: 'Notification Orchestration',
        icon: 'BellRing',
        items: [
          {
            title: 'Providers List',
            url: '/notification-hub/providers',
            permissionKey: PermissionKeys.CanReadNotificationHub,
          },
          {
            title: 'Add Provider',
            url: '/notification-hub/providers/new',
            permissionKey: PermissionKeys.CanManageNotificationProviders,
          },
          {
            title: 'Templates List',
            url: '/notification-hub/templates',
            permissionKey: PermissionKeys.CanReadNotificationHub,
          },
          {
            title: 'Add Template',
            url: '/notification-hub/templates/new',
            permissionKey: PermissionKeys.CanManageNotificationTemplates,
          },
          {
            title: 'Campaigns List',
            url: '/notification-hub/campaigns',
            permissionKey: PermissionKeys.CanReadNotificationHub,
          },
          {
            title: 'Create Campaign',
            url: '/notification-hub/campaigns/new',
            permissionKey: PermissionKeys.CanCreateNotificationCampaigns,
          },
          {
            title: 'Approvals',
            url: '/notification-hub/campaigns/approvals',
            permissionKey: PermissionKeys.CanApproveNotificationCampaigns,
          },
          {
            title: 'Delivery Logs',
            url: '/notification-hub/dispatches',
            permissionKey: PermissionKeys.CanReadNotificationHub,
          },
        ],
      },
      {
        title: 'Partner Portal',
        url: '/partner-agent-portal',
        icon: 'Users',
      },
    ],
  },
  {
    title: 'Insights',
    menu: [
      {
        title: 'Business Analytics',
        url: '/bi-executive-dashboard',
        icon: 'ChartBar',
      },
    ],
  },
  {
    title: 'Technology',
    menu: [
      {
        title: 'User Administration',
        icon: 'UserCog',
        items: [
          {
            title: 'All Users',
            url: '/users',
            permissionKey: PermissionKeys.CanReadUsers,
          },
          {
            title: 'Add User',
            url: '/users/create',
            permissionKey: PermissionKeys.CanCreateUsers,
          },
          {
            title: 'Active Users',
            url: '/users/active',
            permissionKey: PermissionKeys.CanReadActiveUsers,
          },
          {
            title: 'Inactive Users',
            url: '/users/inactive',
            permissionKey: PermissionKeys.CanReadInactiveUsers,
          },
          {
            title: 'User Invites',
            url: '/users/invites',
            permissionKey: PermissionKeys.CanResendSetupInvite,
          },
          {
            title: 'Set User Password',
            url: '/users/password-management',
            permissionKey: PermissionKeys.CanSetUserPassword,
          },
        ],
      },
      {
        title: 'Role & Permission Governance',
        icon: 'Shield',
        items: [
          {
            title: 'Manage Roles',
            url: '/roles',
            permissionKey: PermissionKeys.CanReadRoles,
          },
          {
            title: 'Permissions',
            url: '/permissions',
            permissionKey: PermissionKeys.CanReadPermissions,
          },
        ],
      },
      {
        title: 'IT Support Desk',
        icon: 'Wrench',
        items: [
          {
            title: 'Tickets',
            url: '/it-support/tickets',
            permissionKey: PermissionKeys.CanReadItSupportTickets,
          },
          {
            title: 'Create Ticket',
            url: '/it-support/tickets/new',
            permissionKey: PermissionKeys.CanCreateItSupportTickets,
          },
        ],
      },
    ],
  },

  {
    title: 'Technology',
    menu: [
      {
        title: 'Platform Configuration',
        icon: 'Building',
        items: [
          {
            title: 'Company Profile',
            url: '/settings/company',
            permissionKey: PermissionKeys.CanReadCompanyProfile,
          },
          {
            title: 'SMS Configuration',
            url: '/settings/sms',
            permissionKey: PermissionKeys.CanReadCompanyProfile,
          },
          {
            title: 'Module Management',
            url: '/settings/modules',
            permissionKey: PermissionKeys.CanManageCompanyModules,
          },
          {
            title: 'Parcel Ageing',
            url: '/settings/parcel-ageing',
            permissionKey: PermissionKeys.CanManageParcelAgeingPolicy,
          },
          {
            title: 'Printer Routing',
            url: '/settings/printer-routing',
            permissionKey: PermissionKeys.CanManagePrinterRouting,
          },
          {
            title: 'Branch Management',
            url: '/branches',
            permissionKey: PermissionKeys.CanReadBranches,
          },
          {
            title: 'Location Management',
            url: '/locations',
            permissionKey: PermissionKeys.CanReadLocations,
          },
          {
            title: 'Warehouse Management',
            url: '/warehouses',
            permissionKey: PermissionKeys.CanReadWarehouses,
          },
          {
            title: 'Card Management',
            url: '/settings/cards',
            permissionKey: PermissionKeys.CanReadCards,
          },

          {
            title: 'App Updates',
            url: '/settings/app-updates',
          },
        ],
      },
    ],
  },
  {
    title: 'Supply Chain',
    menu: [
      {
        title: 'Inventory Control',
        icon: 'Package2',
        items: [
          {
            title: 'All Inventory',
            url: '/inventory',
            permissionKey: PermissionKeys.CanReadInventoryOverview,
          },
          {
            title: 'Products',
            url: '/inventory/products',
            permissionKey: PermissionKeys.CanReadProducts,
          },
          {
            title: 'Categories',
            url: '/inventory/categories',
            permissionKey: PermissionKeys.CanReadProductCategories,
          },
          {
            title: 'Locations',
            url: '/inventory/locations',
            permissionKey: PermissionKeys.CanReadInventoryLocations,
          },
          {
            title: 'Stock Levels',
            url: '/inventory/stock-levels',
            permissionKey: PermissionKeys.CanReadStockLevels,
          },
          {
            title: 'Stock Lots',
            url: '/inventory/stock-lots',
            permissionKey: PermissionKeys.CanReadStockLevels,
          },
          {
            title: 'Lot Expiry Alerts',
            url: '/inventory/stock-lots/expiry-alerts',
            permissionKey: PermissionKeys.CanReadStockLevels,
          },
          {
            title: 'Lot Analytics',
            url: '/inventory/stock-lots/analytics',
            permissionKey: PermissionKeys.CanReadStockLevels,
          },
          {
            title: 'Operate Daily Inventory',
            children: [
              {
                title: 'Stock Movements',
                url: '/inventory/stock-movements',
                permissionKey: PermissionKeys.CanReadStockMovements,
              },
              {
                title: 'Stock Adjustments',
                url: '/inventory/stock-adjustments',
                permissionKey: PermissionKeys.CanReadStockAdjustments,
              },
              {
                title: 'Consumption',
                url: '/inventory/stock-consumption',
                permissionKey: PermissionKeys.CanReadStockMovements,
              },
              {
                title: 'Stock Count Sessions',
                url: '/inventory/stock-count-sessions',
                permissionKey: PermissionKeys.CanReadStockLevels,
              },
              {
                title: 'Transfer Shipments',
                url: '/inventory/stock-transfers',
                permissionKey: PermissionKeys.CanReadStockTransfers,
              },
              {
                title: 'Inventory Monitoring',
                url: '/inventory/monitoring',
                permissionKey: PermissionKeys.CanReadInventoryOverview,
              },
              {
                title: 'Reorder Suggestions',
                url: '/inventory/reorder-suggestions',
                permissionKey: PermissionKeys.CanReadInventoryOverview,
              },
            ],
          },
          {
            title: 'Stock Requests (Primary)',
            children: [
              {
                title: 'My Requests',
                url: '/inventory/stock-requests',
                permissionKey: PermissionKeys.CanReadStockRequests,
              },
              {
                title: 'Issue Queue',
                url: '/inventory/stock-requests/issue',
                permissionKey: PermissionKeys.CanReadStockRequests,
              },
              {
                title: 'Acknowledge Queue',
                url: '/inventory/stock-requests/receive',
                permissionKey: PermissionKeys.CanReadStockRequests,
              },
            ],
          },
          {
            title: 'Stock Reservations',
            url: '/inventory/stock-reservations',
            permissionKey: PermissionKeys.CanReadStockRequests,
          },
          {
            title: 'Reservation Exceptions',
            url: '/inventory/stock-reservations/exceptions',
            permissionKey: PermissionKeys.CanReadStockRequests,
          },
          {
            title: 'Allocation Policy',
            url: '/inventory/stock-allocation-policy',
            permissionKey: PermissionKeys.CanApproveStockRequest,
          },
          {
            title: 'Stock Maintenance',
            url: '/inventory/stock-maintenance',
            permissionKey: PermissionKeys.CanReadStockMaintenanceRecords,
          },
          {
            title: 'Approval Policies',
            url: '/inventory/approval-policies',
            permissionKey: PermissionKeys.CanReadInventoryApprovalPolicies,
          },
          {
            title: 'Approval Requests',
            url: '/inventory/approval-requests',
            permissionKey: PermissionKeys.CanReadInventoryApprovalRequests,
          },
          {
            title: 'Valuation',
            url: '/inventory/valuation',
            permissionKey: PermissionKeys.CanReadInventoryValuation,
          },
          {
            title: 'Replenishment Proposals',
            url: '/inventory/replenishment-proposals',
            permissionKey: PermissionKeys.CanReadReplenishmentProposals,
          },
          {
            title: 'Inventory Tasks',
            url: '/inventory/tasks',
            permissionKey: PermissionKeys.CanReadInventoryTasks,
          },
          {
            title: 'Audit Journal',
            url: '/inventory/audit/journal',
            permissionKey: PermissionKeys.CanReadInventoryAuditJournal,
          },
          {
            title: 'Enterprise KPIs',
            url: '/inventory/reports/enterprise-kpis',
            permissionKey: PermissionKeys.CanReadInventoryEnterpriseKpis,
          },
        ],
      },
    ],
  },
  {
    title: 'Insights',
    menu: [
      {
        title: 'Financial Statements & Ledger Reports',
        icon: 'ChartBar',
        items: [
          {
            title: 'Trial Balance',
            url: '/reports/financial/trial-balance',
            permissionKey: PermissionKeys.CanViewReportFinancialTrialBalance,
          },
          {
            title: 'Account Statement',
            url: '/reports/financial/account-statement',
            permissionKey: PermissionKeys.CanViewReportFinancialAccountStatement,
          },
          {
            title: 'Income Statement',
            url: '/reports/financial/income-statement',
            permissionKey: PermissionKeys.CanViewReportFinancialIncomeStatement,
          },
          {
            title: 'Profit & Loss',
            url: '/reports/financial/profit-loss',
            permissionKey: PermissionKeys.CanViewReportFinancialProfitLoss,
          },
          {
            title: 'Balance Sheet',
            url: '/reports/financial/balance-sheet',
            permissionKey: PermissionKeys.CanViewReportFinancialBalanceSheet,
          },
          {
            title: 'Cash Flow',
            url: '/reports/financial/cash-flow',
            permissionKey: PermissionKeys.CanViewReportFinancialCashFlow,
          },
          {
            title: 'General Ledger',
            url: '/reports/financial/general-ledger',
            permissionKey: PermissionKeys.CanViewReportFinancialGeneralLedger,
          },
          {
            title: 'Journal Listing',
            url: '/reports/financial/journal-listing',
            permissionKey: PermissionKeys.CanViewReportFinancialJournalListing,
          },
          {
            title: 'Account Activity',
            url: '/reports/financial/account-activity',
            permissionKey: PermissionKeys.CanViewReportFinancialAccountActivity,
          },
        ],
      },

      {
        title: 'Branch & Performance',
        icon: 'Building2',
        items: [
          {
            title: 'Monthly Branch Summary',
            url: '/reports/branch/monthly-summary',
            permissionKey: PermissionKeys.CanViewReportBranchMonthlySummary,
          },
          {
            title: 'Branch Revenue',
            url: '/reports/branch/revenue',
            permissionKey: PermissionKeys.CanViewReportBranchRevenue,
          },
          {
            title: 'Branch Expense',
            url: '/reports/branch/expense',
            permissionKey: PermissionKeys.CanViewReportBranchExpense,
          },
          {
            title: 'Branch Profit Summary',
            url: '/reports/branch/profit-summary',
            permissionKey: PermissionKeys.CanViewReportBranchProfitSummary,
          },
          {
            title: 'Payroll Cost by Branch',
            url: '/reports/branch/payroll-cost',
            permissionKey: PermissionKeys.CanViewReportBranchPayrollCost,
          },
        ],
      },

      {
        title: 'Payroll & Payslips',
        icon: 'Wallet',
        items: [
          {
            title: 'Payslip',
            url: '/reports/payroll/payslip',
            permissionKey: PermissionKeys.CanViewReportPayrollPayslip,
          },
          {
            title: 'Payroll Cycle Summary',
            url: '/reports/payroll/cycle-summary',
            permissionKey: PermissionKeys.CanViewReportPayrollCycleSummary,
          },
          {
            title: 'Gross to Net',
            url: '/reports/payroll/gross-to-net',
            permissionKey: PermissionKeys.CanViewReportPayrollGrossToNet,
          },
          {
            title: 'Payroll Register (Employee)',
            url: '/reports/payroll/register-employee',
            permissionKey: PermissionKeys.CanViewReportPayrollRegisterEmployee,
          },
          {
            title: 'Payroll Register (Branch)',
            url: '/reports/payroll/register-branch',
            permissionKey: PermissionKeys.CanViewReportPayrollRegisterBranch,
          },
          {
            title: 'Payroll Register (Department)',
            url: '/reports/payroll/register-department',
            permissionKey: PermissionKeys.CanViewReportPayrollRegisterDepartment,
          },
          {
            title: 'Earnings Report',
            url: '/reports/payroll/earnings',
            permissionKey: PermissionKeys.CanViewReportPayrollEarnings,
          },
          {
            title: 'Deductions Report',
            url: '/reports/payroll/deductions',
            permissionKey: PermissionKeys.CanViewReportPayrollDeductions,
          },
          {
            title: 'Overtime Report',
            url: '/reports/payroll/overtime',
            permissionKey: PermissionKeys.CanViewReportPayrollOvertime,
          },
          {
            title: 'Payroll Comparison',
            url: '/reports/payroll/comparison',
            permissionKey: PermissionKeys.CanViewReportPayrollComparison,
          },
          {
            title: 'Bank Payment Schedule',
            url: '/reports/payroll/bank-schedule',
            permissionKey: PermissionKeys.CanViewReportPayrollBankSchedule,
          },
          {
            title: 'Mobile Money Schedule',
            url: '/reports/payroll/momo-schedule',
            permissionKey: PermissionKeys.CanViewReportPayrollMomoSchedule,
          },
          {
            title: 'Cash Payment Schedule',
            url: '/reports/payroll/cash-schedule',
            permissionKey: PermissionKeys.CanViewReportPayrollCashSchedule,
          },
          {
            title: 'Payroll Journal Posting',
            url: '/reports/payroll/journal-posting',
            permissionKey: PermissionKeys.CanViewReportPayrollJournalPosting,
          },
        ],
      },

      {
        title: 'Workforce Administration Reports',
        icon: 'Users',
        items: [
          {
            title: 'Employee Master List',
            url: '/reports/hr/master-list',
            permissionKey: PermissionKeys.CanViewReportHrMasterList,
          },
          {
            title: 'Employee Profile Sheet',
            url: '/reports/hr/profile-sheet',
            permissionKey: PermissionKeys.CanViewReportHrProfileSheet,
          },
          {
            title: 'Employee Contact List',
            url: '/reports/hr/contact-list',
            permissionKey: PermissionKeys.CanViewReportHrContactList,
          },
          {
            title: 'Employee by Department',
            url: '/reports/hr/by-department',
            permissionKey: PermissionKeys.CanViewReportHrByDepartment,
          },
          {
            title: 'Employee by Job Title',
            url: '/reports/hr/by-job-title',
            permissionKey: PermissionKeys.CanViewReportHrByJobTitle,
          },
          {
            title: 'Employee by Status',
            url: '/reports/hr/by-status',
            permissionKey: PermissionKeys.CanViewReportHrByStatus,
          },
          {
            title: 'New Hires',
            url: '/reports/hr/new-hires',
            permissionKey: PermissionKeys.CanViewReportHrNewHires,
          },
          {
            title: 'Confirmed Employees',
            url: '/reports/hr/confirmed',
            permissionKey: PermissionKeys.CanViewReportHrConfirmed,
          },
          {
            title: 'Terminated/Resigned',
            url: '/reports/hr/terminated',
            permissionKey: PermissionKeys.CanViewReportHrTerminated,
          },
          {
            title: 'Manager-Subordinate',
            url: '/reports/hr/hierarchy',
            permissionKey: PermissionKeys.CanViewReportHrHierarchy,
          },
        ],
      },

      {
        title: 'Attendance & Leave',
        icon: 'CalendarCheck',
        items: [
          {
            title: 'Daily Attendance',
            url: '/reports/attendance/daily',
            permissionKey: PermissionKeys.CanViewReportAttendanceDaily,
          },
          {
            title: 'Monthly Attendance',
            url: '/reports/attendance/monthly',
            permissionKey: PermissionKeys.CanViewReportAttendanceMonthly,
          },
          {
            title: 'Late Arrivals',
            url: '/reports/attendance/late',
            permissionKey: PermissionKeys.CanViewReportAttendanceLate,
          },
          {
            title: 'Absence Report',
            url: '/reports/attendance/absence',
            permissionKey: PermissionKeys.CanViewReportAttendanceAbsence,
          },
          {
            title: 'Worked Hours',
            url: '/reports/attendance/worked-hours',
            permissionKey: PermissionKeys.CanViewReportAttendanceWorkedHours,
          },
          {
            title: 'Check-in/Out Details',
            url: '/reports/attendance/checkin-checkout',
            permissionKey: PermissionKeys.CanViewReportAttendanceCheckinCheckout,
          },
          {
            title: 'Leave Requests',
            url: '/reports/leave/requests',
            permissionKey: PermissionKeys.CanViewReportLeaveRequests,
          },
          {
            title: 'Leave Approval Status',
            url: '/reports/leave/status',
            permissionKey: PermissionKeys.CanViewReportLeaveStatus,
          },
          {
            title: 'Leave by Employee',
            url: '/reports/leave/by-employee',
            permissionKey: PermissionKeys.CanViewReportLeaveByEmployee,
          },
          {
            title: 'Leave Calendar',
            url: '/reports/leave/calendar',
            permissionKey: PermissionKeys.CanViewReportLeaveCalendar,
          },
        ],
      },

      {
        title: 'Expenses & Cash',
        icon: 'Receipt',
        items: [
          {
            title: 'Expense Requests',
            url: '/reports/expenses/requests',
            permissionKey: PermissionKeys.CanViewReportExpensesRequests,
          },
          {
            title: 'Approved Expenses',
            url: '/reports/expenses/approved',
            permissionKey: PermissionKeys.CanViewReportExpensesApproved,
          },
          {
            title: 'Paid Expenses',
            url: '/reports/expenses/paid',
            permissionKey: PermissionKeys.CanViewReportExpensesPaid,
          },
          {
            title: 'Unpaid Expenses',
            url: '/reports/expenses/unpaid',
            permissionKey: PermissionKeys.CanViewReportExpensesUnpaid,
          },
          {
            title: 'Expense by Category',
            url: '/reports/expenses/by-category',
            permissionKey: PermissionKeys.CanViewReportExpensesByCategory,
          },
          {
            title: 'Cash Confirmation',
            url: '/reports/cash/daily-confirmation',
            permissionKey: PermissionKeys.CanViewReportCashDailyConfirmation,
          },
          {
            title: 'Cash Variance',
            url: '/reports/cash/variance',
            permissionKey: PermissionKeys.CanViewReportCashVariance,
          },
          {
            title: 'Cash Overage',
            url: '/reports/cash/overage',
            permissionKey: PermissionKeys.CanViewReportCashOverage,
          },
          {
            title: 'Cash Shortage',
            url: '/reports/cash/shortage',
            permissionKey: PermissionKeys.CanViewReportCashShortage,
          },
        ],
      },

      {
        title: 'Customer Insights',
        icon: 'UserRound',
        items: [
          {
            title: 'Customer Master List',
            url: '/reports/customers/master-list',
            permissionKey: PermissionKeys.CanViewReportCustomersMasterList,
          },
          {
            title: 'Customer Statement',
            url: '/reports/customers/statement',
            permissionKey: PermissionKeys.CanViewReportCustomersStatement,
          },
          {
            title: 'Customer Transactions',
            url: '/reports/customers/transactions',
            permissionKey: PermissionKeys.CanViewReportCustomersTransactions,
          },
          {
            title: 'Customer Payments',
            url: '/reports/customers/payments',
            permissionKey: PermissionKeys.CanViewReportCustomersPayments,
          },
          {
            title: 'Customer Credit Summary',
            url: '/reports/customers/credit-summary',
            permissionKey: PermissionKeys.CanViewReportCustomersCreditSummary,
          },
          {
            title: 'Customer Aging',
            url: '/reports/customers/aging',
            permissionKey: PermissionKeys.CanViewReportCustomersAging,
          },
          {
            title: 'Top Customers',
            url: '/reports/customers/top',
            permissionKey: PermissionKeys.CanViewReportCustomersTop,
          },
          {
            title: 'Inactive Customers',
            url: '/reports/customers/inactive',
            permissionKey: PermissionKeys.CanViewReportCustomersInactive,
          },
        ],
      },

      {
        title: 'Parcels & Logistics',
        icon: 'Truck',
        items: [
          {
            title: 'Booking Register',
            url: '/reports/parcels/bookings',
            permissionKey: PermissionKeys.CanViewReportParcelsBookings,
          },
          {
            title: 'Parcel Register',
            url: '/reports/parcels/register',
            permissionKey: PermissionKeys.CanViewReportParcelsRegister,
          },
          {
            title: 'Parcel Tracking',
            url: '/reports/parcels/tracking',
            permissionKey: PermissionKeys.CanViewReportParcelsTracking,
          },
          {
            title: 'In-Transit Outgoing',
            url: '/reports/parcels/in-transit-out',
            permissionKey: PermissionKeys.CanViewReportParcelsInTransitOutgoing,
          },
          {
            title: 'In-Transit Incoming',
            url: '/reports/parcels/in-transit-in',
            permissionKey: PermissionKeys.CanViewReportParcelsInTransitIncoming,
          },
          {
            title: 'Delivered Parcels',
            url: '/reports/parcels/delivered',
            permissionKey: PermissionKeys.CanViewReportParcelsDelivered,
          },
          {
            title: 'Undelivered Parcels',
            url: '/reports/parcels/failed',
            permissionKey: PermissionKeys.CanViewReportParcelsFailed,
          },
          {
            title: 'Parcel Aging',
            url: '/reports/parcels/aging',
            permissionKey: PermissionKeys.CanViewReportParcelsAging,
          },
          {
            title: 'Uncollected Parcels',
            url: '/reports/parcels/uncollected',
            permissionKey: PermissionKeys.CanViewReportParcelsUncollected,
          },
        ],
      },

      {
        title: 'Consignments & Transfers',
        icon: 'Repeat',
        items: [
          {
            title: 'Consignment Manifest',
            url: '/reports/consignments/manifest',
            permissionKey: PermissionKeys.CanViewReportConsignmentsManifest,
          },
          {
            title: 'Consignment Summary',
            url: '/reports/consignments/summary',
            permissionKey: PermissionKeys.CanViewReportConsignmentsSummary,
          },
          {
            title: 'Branch Dispatch Manifest',
            url: '/reports/consignments/dispatch',
            permissionKey: PermissionKeys.CanViewReportConsignmentsDispatch,
          },
          {
            title: 'Branch Receiving Manifest',
            url: '/reports/consignments/receiving',
            permissionKey: PermissionKeys.CanViewReportConsignmentsReceiving,
          },
          {
            title: 'Internal Transfers',
            url: '/reports/transfers/internal',
            permissionKey: PermissionKeys.CanViewReportTransfersInternal,
          },
          {
            title: 'Pending Transfers',
            url: '/reports/transfers/pending',
            permissionKey: PermissionKeys.CanViewReportTransfersPending,
          },
          {
            title: 'Acknowledged Transfers',
            url: '/reports/transfers/acknowledged',
            permissionKey: PermissionKeys.CanViewReportTransfersAcknowledged,
          },
        ],
      },

      {
        title: 'Cashier & Shift',
        icon: 'Clock',
        items: [
          {
            title: 'Shift Sessions',
            url: '/reports/cashier/shifts',
            permissionKey: PermissionKeys.CanViewReportCashierShifts,
          },
          {
            title: 'Open Shifts',
            url: '/reports/cashier/open-shifts',
            permissionKey: PermissionKeys.CanViewReportCashierOpenShifts,
          },
          {
            title: 'Closed Shifts',
            url: '/reports/cashier/closed-shifts',
            permissionKey: PermissionKeys.CanViewReportCashierClosedShifts,
          },
          {
            title: 'Shift Revenue',
            url: '/reports/cashier/revenue',
            permissionKey: PermissionKeys.CanViewReportCashierRevenue,
          },
          {
            title: 'Cashier Summary',
            url: '/reports/cashier/summary',
            permissionKey: PermissionKeys.CanViewReportCashierSummary,
          },
          {
            title: 'Cashier Variance',
            url: '/reports/cashier/variance',
            permissionKey: PermissionKeys.CanViewReportCashierVariance,
          },
          {
            title: 'Payment Method Mix',
            url: '/reports/cashier/payment-mix',
            permissionKey: PermissionKeys.CanViewReportCashierPaymentMix,
          },
        ],
      },

      {
        title: 'Inventory',
        icon: 'Package',
        items: [
          {
            title: 'Stock Levels',
            url: '/reports/inventory/stock-levels',
            permissionKey: PermissionKeys.CanViewReportInventoryStockLevels,
          },
          {
            title: 'Low Stock',
            url: '/reports/inventory/low-stock',
            permissionKey: PermissionKeys.CanViewReportInventoryLowStock,
          },
          {
            title: 'Stock Movement',
            url: '/reports/inventory/movement',
            permissionKey: PermissionKeys.CanViewReportInventoryMovement,
          },
          {
            title: 'Stock Adjustments',
            url: '/reports/inventory/adjustments',
            permissionKey: PermissionKeys.CanViewReportInventoryAdjustments,
          },
          {
            title: 'Stock Transfers',
            url: '/reports/inventory/transfers',
            permissionKey: PermissionKeys.CanViewReportInventoryTransfers,
          },
          {
            title: 'Inventory by Location',
            url: '/reports/inventory/by-location',
            permissionKey: PermissionKeys.CanViewReportInventoryByLocation,
          },
          {
            title: 'Product Master List',
            url: '/reports/inventory/products',
            permissionKey: PermissionKeys.CanViewReportInventoryProducts,
          },
        ],
      },

      {
        title: 'Audit & Compliance Reports',
        icon: 'ShieldCheck',
        items: [
          {
            title: 'Audit Trail by User',
            url: '/reports/audit/user',
            permissionKey: PermissionKeys.CanViewReportAuditUser,
          },
          {
            title: 'Audit Trail by Module',
            url: '/reports/audit/module',
            permissionKey: PermissionKeys.CanViewReportAuditModule,
          },
          {
            title: 'Audit Trail by Entity',
            url: '/reports/audit/entity',
            permissionKey: PermissionKeys.CanViewReportAuditEntity,
          },
          {
            title: 'Suspicious Changes',
            url: '/reports/audit/suspicious',
            permissionKey: PermissionKeys.CanViewReportAuditSuspicious,
          },
          {
            title: 'Deleted Records',
            url: '/reports/audit/deleted',
            permissionKey: PermissionKeys.CanViewReportAuditDeleted,
          },
          {
            title: 'User Role Permissions',
            url: '/reports/audit/roles',
            permissionKey: PermissionKeys.CanViewReportAuditRoles,
          },
        ],
      },
    ],
  },
];

const FILTERED_BASE_ROUTES: Route[] = BASE_ROUTES.map((route) => {
  const filteredMenu: MenuItem[] = [];
  for (const menuItem of route.menu) {
    const nextItems = filterSubItems(menuItem.items);
    const keepByUrl = isImplementedReportUrl(menuItem.url);
    const hasItems = Boolean(nextItems?.length);
    if (!keepByUrl && !hasItems) continue;
    filteredMenu.push({ ...menuItem, items: nextItems });
  }
  return { ...route, menu: filteredMenu };
}).filter((route) => route.menu.length > 0);

export const ROUTES: Route[] = (() => {
  const order: string[] = [];
  const byDomain = new Map<string, MenuItem[]>();
  for (const route of FILTERED_BASE_ROUTES) {
    if (!byDomain.has(route.title)) order.push(route.title);
    const list = byDomain.get(route.title) ?? [];
    list.push(...route.menu);
    byDomain.set(route.title, list);
  }
  return order
    .map((title) => ({ title, menu: byDomain.get(title) ?? [] }))
    .filter((route) => route.menu.length > 0);
})();
