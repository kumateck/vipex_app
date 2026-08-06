import { describe, expect, test } from 'bun:test';
import { HttpStatus } from '@/server/utils/http-status';
import { http } from '../utils/request';

describe('Fleet maintenance routes smoke', () => {
  test('maintenance dashboard and reliability routes are mounted', async () => {
    const dashboardRes = await http('GET', '/v1/fleet-transport/maintenance/dashboard');
    const reliabilityRes = await http('GET', '/v1/fleet-transport/maintenance/reliability');
    const opsQueueRes = await http('GET', '/v1/fleet-transport/ops-queue');
    const escalationJobRes = await http(
      'POST',
      '/v1/fleet-transport/compliance/escalations/run-daily',
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      },
    );
    const orchestratorRes = await http('POST', '/v1/fleet-transport/automation/run-daily', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    const reliabilityTrendsRes = await http(
      'GET',
      '/v1/fleet-transport/maintenance/reliability/trends',
    );
    const kpiRes = await http('GET', '/v1/fleet-transport/maintenance/kpis');

    for (const status of [
      dashboardRes.status,
      reliabilityRes.status,
      reliabilityTrendsRes.status,
      kpiRes.status,
      opsQueueRes.status,
      escalationJobRes.status,
      orchestratorRes.status,
    ]) {
      expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.BAD_REQUEST]).toContain(
        status,
      );
    }
  });

  test('maintenance plans routes are mounted', async () => {
    const listRes = await http('GET', '/v1/fleet-transport/maintenance/plans');
    const createRes = await http('POST', '/v1/fleet-transport/maintenance/plans', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        vehicleId: 'ck_vehicle_placeholder',
        title: 'Oil Service',
        intervalUnit: 1,
        intervalValue: 30,
      }),
    });
    const updateRes = await http(
      'PATCH',
      '/v1/fleet-transport/maintenance/plans/ck_plan_placeholder',
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      },
    );

    for (const status of [listRes.status, createRes.status, updateRes.status]) {
      expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.BAD_REQUEST]).toContain(
        status,
      );
    }
  });

  test('maintenance work orders routes are mounted', async () => {
    const listRes = await http('GET', '/v1/fleet-transport/maintenance/work-orders');
    const createRes = await http('POST', '/v1/fleet-transport/maintenance/work-orders', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        vehicleId: 'ck_vehicle_placeholder',
        title: 'Brake inspection',
      }),
    });
    const updateRes = await http(
      'PATCH',
      '/v1/fleet-transport/maintenance/work-orders/ck_work_order_placeholder',
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 1 }),
      },
    );

    for (const status of [listRes.status, createRes.status, updateRes.status]) {
      expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.BAD_REQUEST]).toContain(
        status,
      );
    }
  });

  test('maintenance downtime routes are mounted', async () => {
    const listRes = await http('GET', '/v1/fleet-transport/maintenance/downtime');
    const createRes = await http('POST', '/v1/fleet-transport/maintenance/downtime', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        vehicleId: 'ck_vehicle_placeholder',
        reason: 'Engine issue',
      }),
    });
    const closeRes = await http(
      'POST',
      '/v1/fleet-transport/maintenance/downtime/ck_downtime_placeholder/close',
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      },
    );
    const reopenRes = await http(
      'POST',
      '/v1/fleet-transport/maintenance/downtime/ck_downtime_placeholder/reopen',
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      },
    );
    const workflowListRes = await http('GET', '/v1/fleet-transport/maintenance/downtime/workflows');
    const workflowPatchRes = await http(
      'PATCH',
      '/v1/fleet-transport/maintenance/downtime/ck_downtime_placeholder/workflow',
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lifecycleStatus: 2 }),
      },
    );

    for (const status of [
      listRes.status,
      createRes.status,
      closeRes.status,
      reopenRes.status,
      workflowListRes.status,
      workflowPatchRes.status,
    ]) {
      expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.BAD_REQUEST]).toContain(
        status,
      );
    }
  });

  test('maintenance parts inventory routes are mounted', async () => {
    const listRes = await http('GET', '/v1/fleet-transport/maintenance/parts');
    const createRes = await http('POST', '/v1/fleet-transport/maintenance/parts', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sku: 'PART-001',
        name: 'Oil filter',
      }),
    });
    const movementRes = await http(
      'POST',
      '/v1/fleet-transport/maintenance/parts/ck_part_placeholder/stock-movements',
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          movementType: 0,
          quantity: 1,
        }),
      },
    );
    const movementListRes = await http(
      'GET',
      '/v1/fleet-transport/maintenance/parts/ck_part_placeholder/stock-movements',
    );
    const lowStockHookRes = await http(
      'POST',
      '/v1/fleet-transport/maintenance/parts/alerts/run-daily',
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      },
    );
    const procurementCandidatesRes = await http(
      'GET',
      '/v1/fleet-transport/maintenance/parts/procurement/candidates',
    );
    const maintenanceAutomationRes = await http(
      'POST',
      '/v1/fleet-transport/maintenance/automation/run-daily',
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      },
    );
    const workOrderMovementRes = await http(
      'GET',
      '/v1/fleet-transport/maintenance/work-orders/ck_work_order_placeholder/part-movements',
    );
    const procurementTraceabilityRes = await http(
      'GET',
      '/v1/fleet-transport/maintenance/procurement/traceability',
    );
    const reorderRunRes = await http(
      'POST',
      '/v1/fleet-transport/maintenance/procurement/reorder/run',
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      },
    );

    for (const status of [
      listRes.status,
      createRes.status,
      movementRes.status,
      movementListRes.status,
      lowStockHookRes.status,
      procurementCandidatesRes.status,
      maintenanceAutomationRes.status,
      workOrderMovementRes.status,
      procurementTraceabilityRes.status,
      reorderRunRes.status,
    ]) {
      expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.BAD_REQUEST]).toContain(
        status,
      );
    }
  });
});
