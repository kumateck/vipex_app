import { describe, test, expect } from 'bun:test';
// import { http } from "./utils/request";
// import { HttpStatus } from "../src/server/utils/http-status";
import { http } from 'tests/utils/request';
import { HttpStatus } from '../utils/http-status';

// Create a focused “route registration smoke test” you can add temporarily.
// File: tests/routes.smoke.spec.ts

describe('route registration smoke', () => {
  test('inventory routes are mounted', async () => {
    // health should always exist
    const health = await http('GET', '/health');
    expect(health.status).toBe(HttpStatus.OK);

    // this should NOT be 404 if inventory routes are mounted
    const res = await http('GET', '/v1/inventory/products');
    expect(res.status).not.toBe(HttpStatus.NOT_FOUND);
  });
});
