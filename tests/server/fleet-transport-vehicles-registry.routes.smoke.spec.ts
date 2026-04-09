import { describe, expect, test } from 'bun:test';
import { HttpStatus } from '@/server/utils/http-status';
import { http } from '../utils/request';

describe('Fleet vehicle registry route smoke', () => {
  test('GET /v1/fleet-transport/vehicles/compliance-alerts is mounted', async () => {
    const res = await http('GET', '/v1/fleet-transport/vehicles/compliance-alerts');
    expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN]).toContain(res.status);
  });

  test('GET /v1/fleet-transport/drivers/compliance-alerts is mounted', async () => {
    const res = await http('GET', '/v1/fleet-transport/drivers/compliance-alerts');
    expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN]).toContain(res.status);
  });

  test('GET /v1/fleet-transport/drivers/options is mounted', async () => {
    const res = await http('GET', '/v1/fleet-transport/drivers/options');
    expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN]).toContain(res.status);
  });

  test('GET /v1/fleet-transport/fuel-analytics is mounted', async () => {
    const res = await http('GET', '/v1/fleet-transport/fuel-analytics');
    expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN]).toContain(res.status);
  });

  test('fleet compliance dashboard routes are mounted', async () => {
    const listRes = await http('GET', '/v1/fleet-transport/compliance-dashboard');
    const kpiTrendsRes = await http('GET', '/v1/fleet-transport/compliance/kpis/trends');
    const opsQueueRes = await http('GET', '/v1/fleet-transport/ops-queue');
    const runJobRes = await http(
      'POST',
      '/v1/fleet-transport/compliance-dashboard/alerts/run-daily',
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      },
    );
    const runEscalationRes = await http(
      'POST',
      '/v1/fleet-transport/compliance/escalations/run-daily',
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      },
    );
    const runSnapshotRes = await http('POST', '/v1/fleet-transport/analytics/snapshots/run-daily', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    for (const status of [
      listRes.status,
      kpiTrendsRes.status,
      opsQueueRes.status,
      runJobRes.status,
      runEscalationRes.status,
      runSnapshotRes.status,
    ]) {
      expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.BAD_REQUEST]).toContain(
        status,
      );
    }
  });

  test('fleet compliance incident + policy ack routes are mounted', async () => {
    const listIncidents = await http('GET', '/v1/fleet-transport/compliance/incidents');
    const createIncident = await http('POST', '/v1/fleet-transport/compliance/incidents', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        incidentType: 0,
        severity: 1,
        occurredAt: new Date().toISOString(),
        description: 'Speeding violation',
      }),
    });
    const patchIncident = await http(
      'PATCH',
      '/v1/fleet-transport/compliance/incidents/ck_incident_placeholder',
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          resolvedAt: new Date().toISOString(),
        }),
      },
    );
    const transitionIncident = await http(
      'POST',
      '/v1/fleet-transport/compliance/incidents/ck_incident_placeholder/transition',
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve',
          actionTaken: 'Resolved by ops',
        }),
      },
    );
    const listAcks = await http('GET', '/v1/fleet-transport/compliance/policy-acknowledgments');
    const createAck = await http('POST', '/v1/fleet-transport/compliance/policy-acknowledgments', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        userId: 'ck_user_placeholder',
        policyCode: 'fleet.safety',
        policyVersion: 'v1',
      }),
    });
    const runReack = await http(
      'POST',
      '/v1/fleet-transport/compliance/policy-acknowledgments/run-daily-reminders',
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      },
    );

    for (const status of [
      listIncidents.status,
      createIncident.status,
      patchIncident.status,
      transitionIncident.status,
      listAcks.status,
      createAck.status,
      runReack.status,
    ]) {
      expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.BAD_REQUEST]).toContain(
        status,
      );
    }
  });

  test('driver compliance record routes are mounted', async () => {
    const employeeId = 'ck_employee_placeholder';
    const listRes = await http(
      'GET',
      `/v1/fleet-transport/drivers/${employeeId}/compliance-records`,
    );
    const createRes = await http(
      'POST',
      `/v1/fleet-transport/drivers/${employeeId}/compliance-records`,
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ complianceType: 0 }),
      },
    );
    for (const status of [listRes.status, createRes.status]) {
      expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.BAD_REQUEST]).toContain(
        status,
      );
    }
  });

  test('fleet shift roster routes are mounted', async () => {
    const listRes = await http('GET', '/v1/fleet-transport/rosters');
    const createRes = await http('POST', '/v1/fleet-transport/rosters', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        employeeId: 'ck_employee_placeholder',
        roleType: 0,
        shiftStartAt: new Date().toISOString(),
        shiftEndAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      }),
    });
    const updateRes = await http('PATCH', '/v1/fleet-transport/rosters/ck_roster_placeholder', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 1 }),
    });

    for (const status of [listRes.status, createRes.status, updateRes.status]) {
      expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.BAD_REQUEST]).toContain(
        status,
      );
    }
  });

  test('GET /v1/fleet-transport/vehicles/:id is mounted', async () => {
    const res = await http('GET', '/v1/fleet-transport/vehicles/ck_vehicle_placeholder');
    expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.BAD_REQUEST]).toContain(
      res.status,
    );
  });

  test('GET /v1/fleet-transport/vehicles/:id/documents is mounted', async () => {
    const res = await http('GET', '/v1/fleet-transport/vehicles/ck_vehicle_placeholder/documents');
    expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.BAD_REQUEST]).toContain(
      res.status,
    );
  });

  test('POST /v1/fleet-transport/vehicles/:id/documents is mounted', async () => {
    const res = await http(
      'POST',
      '/v1/fleet-transport/vehicles/ck_vehicle_placeholder/documents',
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          documentType: 'Insurance',
        }),
      },
    );
    expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.BAD_REQUEST]).toContain(
      res.status,
    );
  });

  test('vehicle lifecycle transition + maintenance parts + analytics routes are mounted', async () => {
    const lifecycleRes = await http(
      'PATCH',
      '/v1/fleet-transport/vehicles/ck_vehicle_placeholder/lifecycle',
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lifecycleStatus: 1 }),
      },
    );
    const listParts = await http('GET', '/v1/fleet-transport/maintenance/parts');
    const createPart = await http('POST', '/v1/fleet-transport/maintenance/parts', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sku: 'FLT-001', name: 'Brake pad' }),
    });
    const stockMove = await http(
      'POST',
      '/v1/fleet-transport/maintenance/parts/ck_part_placeholder/stock-movements',
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ movementType: 0, quantity: 1 }),
      },
    );
    const listStockMoves = await http(
      'GET',
      '/v1/fleet-transport/maintenance/parts/ck_part_placeholder/stock-movements',
    );
    const procurementCandidates = await http(
      'GET',
      '/v1/fleet-transport/maintenance/parts/procurement/candidates',
    );
    const lifecycleAutomation = await http(
      'POST',
      '/v1/fleet-transport/vehicles/lifecycle/run-daily-automation',
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      },
    );
    const maintenanceAutomation = await http(
      'POST',
      '/v1/fleet-transport/maintenance/automation/run-daily',
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      },
    );
    const orchestrationAutomation = await http('POST', '/v1/fleet-transport/automation/run-daily', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    const dispatchBoard = await http('GET', '/v1/fleet-transport/dispatch/board');
    const dispatchOpsPerformance = await http(
      'GET',
      '/v1/fleet-transport/dispatch/ops-performance',
    );
    const dispatchExceptionQueue = await http(
      'GET',
      '/v1/fleet-transport/dispatch/exception-queue',
    );
    const dispatchRouteQueue = await http(
      'GET',
      '/v1/fleet-transport/dispatch/route-assignment-queue',
    );
    const dispatchLoadCandidates = await http(
      'GET',
      '/v1/fleet-transport/dispatch/load-candidates?tripId=ck_trip_placeholder',
    );
    const decisionOverview = await http('GET', '/v1/fleet-transport/decision-support/overview');
    const executiveScorecard = await http(
      'GET',
      '/v1/fleet-transport/decision-support/executive-scorecard',
    );
    const decisionUnitEconomics = await http(
      'GET',
      '/v1/fleet-transport/decision-support/unit-economics',
    );
    const compliancePolicyGet = await http(
      'GET',
      '/v1/fleet-transport/compliance/escalation-policy',
    );
    const compliancePolicyPut = await http(
      'PUT',
      '/v1/fleet-transport/compliance/escalation-policy',
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ incidentEscalateAfterDays: 3 }),
      },
    );
    const fuelFraudSignals = await http('GET', '/v1/fleet-transport/fuel-analytics/fraud-signals');

    for (const status of [
      lifecycleRes.status,
      listParts.status,
      createPart.status,
      stockMove.status,
      listStockMoves.status,
      procurementCandidates.status,
      lifecycleAutomation.status,
      maintenanceAutomation.status,
      orchestrationAutomation.status,
      dispatchBoard.status,
      dispatchOpsPerformance.status,
      dispatchExceptionQueue.status,
      dispatchRouteQueue.status,
      dispatchLoadCandidates.status,
      decisionOverview.status,
      executiveScorecard.status,
      decisionUnitEconomics.status,
      compliancePolicyGet.status,
      compliancePolicyPut.status,
      fuelFraudSignals.status,
    ]) {
      expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.BAD_REQUEST]).toContain(
        status,
      );
    }
  });
});
