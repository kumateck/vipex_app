import { describe, expect, test } from 'bun:test';
import {
  FleetComplianceDashboardPage,
  FleetComplianceEscalationPolicyPage,
  FleetComplianceKpiPage,
  FleetComplianceOpsPage,
  FleetDecisionSupportPage,
  FleetDispatchBoardPage,
  FleetDispatchExceptionQueuePage,
  FleetDispatchLoadMatchingPage,
  FleetDispatchRouteAssignmentPage,
  FleetDispatchLoadAuditPage,
  FleetDispatchLiveStatusPage,
  FleetDispatchOpsPerformancePage,
  FleetMaintenanceDowntimePage,
  FleetMaintenanceDowntimeWorkflowsPage,
  FleetMaintenanceKpiDashboardPage,
  FleetMaintenancePage,
  FleetMaintenanceProcurementReorderRunPage,
  FleetMaintenanceProcurementTraceabilityPage,
  FleetMaintenanceReliabilityTrendsPage,
  FleetMaintenanceWorkOrderPartMovementsPage,
  FleetMaintenanceWorkOrdersPage,
  FleetFuelFraudSignalsPage,
  FleetExecutiveScorecardPage,
  FleetShiftRostersPage,
  FleetUnitEconomicsPage,
  FleetVehicleDetailPage,
} from '@/features/fleet-transport';

describe('Fleet transport UI smoke', () => {
  test('major fleet pages are importable', () => {
    expect(typeof FleetComplianceDashboardPage).toBe('function');
    expect(typeof FleetComplianceEscalationPolicyPage).toBe('function');
    expect(typeof FleetComplianceKpiPage).toBe('function');
    expect(typeof FleetComplianceOpsPage).toBe('function');
    expect(typeof FleetMaintenancePage).toBe('function');
    expect(typeof FleetMaintenanceWorkOrdersPage).toBe('function');
    expect(typeof FleetMaintenanceDowntimePage).toBe('function');
    expect(typeof FleetMaintenanceDowntimeWorkflowsPage).toBe('function');
    expect(typeof FleetMaintenanceWorkOrderPartMovementsPage).toBe('function');
    expect(typeof FleetMaintenanceReliabilityTrendsPage).toBe('function');
    expect(typeof FleetMaintenanceKpiDashboardPage).toBe('function');
    expect(typeof FleetMaintenanceProcurementTraceabilityPage).toBe('function');
    expect(typeof FleetMaintenanceProcurementReorderRunPage).toBe('function');
    expect(typeof FleetShiftRostersPage).toBe('function');
    expect(typeof FleetDispatchBoardPage).toBe('function');
    expect(typeof FleetDispatchRouteAssignmentPage).toBe('function');
    expect(typeof FleetDispatchLoadMatchingPage).toBe('function');
    expect(typeof FleetDispatchLoadAuditPage).toBe('function');
    expect(typeof FleetDispatchLiveStatusPage).toBe('function');
    expect(typeof FleetDispatchExceptionQueuePage).toBe('function');
    expect(typeof FleetDispatchOpsPerformancePage).toBe('function');
    expect(typeof FleetDecisionSupportPage).toBe('function');
    expect(typeof FleetExecutiveScorecardPage).toBe('function');
    expect(typeof FleetUnitEconomicsPage).toBe('function');
    expect(typeof FleetFuelFraudSignalsPage).toBe('function');
    expect(typeof FleetVehicleDetailPage).toBe('function');
  });
});
