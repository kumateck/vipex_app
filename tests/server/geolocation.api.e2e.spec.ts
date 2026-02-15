import { describe, expect, test } from 'bun:test';
import { http, json } from '../utils/request';
import { HttpStatus } from '../../src/server/utils/http-status';

describe('Geolocation API e2e', () => {
  test('GET /v1/geolocation/distance returns contract-safe response', async () => {
    const res = await http(
      'GET',
      '/v1/geolocation/distance?fromLat=5.6037&fromLng=-0.187&toLat=6.6885&toLng=-1.6244',
      {
        headers: {
          'x-forwarded-for': '10.30.0.1',
        },
      },
    );

    expect(res.status).toBe(HttpStatus.OK);
    const body = await json<{ meters: number; kilometers: number }>(res);
    expect(body.meters).toBeGreaterThan(180000);
    expect(body.kilometers).toBeGreaterThan(180);
  });

  test('GET /v1/geolocation/distance validates coordinate ranges', async () => {
    const res = await http(
      'GET',
      '/v1/geolocation/distance?fromLat=500&fromLng=-0.187&toLat=6.6885&toLng=-1.6244',
      {
        headers: {
          'x-forwarded-for': '10.30.0.2',
        },
      },
    );

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
    const body = await json<{ error: { code: string; message: string; status: number } }>(res);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.status).toBe(HttpStatus.BAD_REQUEST);
  });
});
