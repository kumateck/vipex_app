import { describe, expect, test } from 'bun:test';
import { http } from '../utils/request';
import { HttpStatus } from '../../src/server/utils/http-status';

describe('Fleet Trips route smoke', () => {
  test('GET /v1/fleet-transport/trips is mounted', async () => {
    const res = await http('GET', '/v1/fleet-transport/trips');
    expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN]).toContain(res.status);
  });

  test('POST /v1/fleet-transport/trips is mounted', async () => {
    const res = await http('POST', '/v1/fleet-transport/trips', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        vehicleId: 'ck_vehicle_placeholder',
        driverEmployeeId: 'ck_employee_placeholder',
      }),
    });
    expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.BAD_REQUEST]).toContain(
      res.status,
    );
  });

  test('trip lifecycle process routes are mounted', async () => {
    const id = 'ck_trip_placeholder';

    const crewRes = await http('PUT', `/v1/fleet-transport/trips/${id}/crew`, {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ crewEmployeeIds: [] }),
    });

    const startRes = await http('POST', `/v1/fleet-transport/trips/${id}/start`, {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ startOdometerKm: 10 }),
    });

    const closeRes = await http('POST', `/v1/fleet-transport/trips/${id}/close`, {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ endOdometerKm: 20 }),
    });

    const assignRouteRes = await http('PUT', `/v1/fleet-transport/trips/${id}/route-assignment`, {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ routePlanId: null }),
    });

    const eventsRes = await http('GET', `/v1/fleet-transport/trips/${id}/events`);
    const loadsRes = await http('GET', `/v1/fleet-transport/trips/${id}/loads`);
    const loadAuditRes = await http('GET', `/v1/fleet-transport/trips/${id}/loads/audit`);
    const addLoadRes = await http('POST', `/v1/fleet-transport/trips/${id}/loads`, {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ parcelId: 'ck_parcel_placeholder' }),
    });
    const updateLoadStatusRes = await http(
      'PATCH',
      `/v1/fleet-transport/trips/load-matches/ck_load_match_placeholder/status`,
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 1 }),
      },
    );
    const telemetryRes = await http('GET', `/v1/fleet-transport/trips/${id}/telemetry`);
    const recordTelemetryRes = await http('POST', `/v1/fleet-transport/trips/${id}/telemetry`, {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ latitude: 5.556, longitude: -0.196 }),
    });
    const statusUpdatesRes = await http('GET', `/v1/fleet-transport/trips/${id}/status-updates`);
    const recordStatusRes = await http('POST', `/v1/fleet-transport/trips/${id}/status-updates`, {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ statusType: 0 }),
    });
    const timelineRes = await http('GET', `/v1/fleet-transport/trips/${id}/timeline`);

    const checkInRes = await http('POST', `/v1/fleet-transport/trips/${id}/check-in`, {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ odometerKm: 11 }),
    });

    const checkOutRes = await http('POST', `/v1/fleet-transport/trips/${id}/check-out`, {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ odometerKm: 12 }),
    });

    for (const status of [
      crewRes.status,
      startRes.status,
      closeRes.status,
      assignRouteRes.status,
      eventsRes.status,
      loadsRes.status,
      loadAuditRes.status,
      addLoadRes.status,
      updateLoadStatusRes.status,
      telemetryRes.status,
      recordTelemetryRes.status,
      statusUpdatesRes.status,
      recordStatusRes.status,
      timelineRes.status,
      checkInRes.status,
      checkOutRes.status,
    ]) {
      expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.BAD_REQUEST]).toContain(
        status,
      );
    }
  });

  test('shift roster routes are mounted', async () => {
    const listRes = await http('GET', '/v1/fleet-transport/rosters');
    const getRes = await http('GET', '/v1/fleet-transport/rosters/ck_roster_placeholder');
    const createRes = await http('POST', '/v1/fleet-transport/rosters', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        employeeId: 'ck_employee_placeholder',
        roleType: 0,
        shiftStartAt: new Date().toISOString(),
        shiftEndAt: new Date(Date.now() + 3600_000).toISOString(),
      }),
    });
    const updateRes = await http('PATCH', '/v1/fleet-transport/rosters/ck_roster_placeholder', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 2 }),
    });

    for (const status of [listRes.status, getRes.status, createRes.status, updateRes.status]) {
      expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.BAD_REQUEST]).toContain(
        status,
      );
    }
  });

  test('route planning routes are mounted', async () => {
    const listRes = await http('GET', '/v1/fleet-transport/routes/plans');
    const createRes = await http('POST', '/v1/fleet-transport/routes/plans', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Test Route' }),
    });
    const getRes = await http('GET', '/v1/fleet-transport/routes/plans/ck_route_plan_placeholder');

    for (const status of [listRes.status, createRes.status, getRes.status]) {
      expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.BAD_REQUEST]).toContain(
        status,
      );
    }
  });
});
