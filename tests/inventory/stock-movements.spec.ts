import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { createId } from '@paralleldrive/cuid2';
import { http, json } from '../utils/request';
import { HttpStatus } from '../../src/server/utils/http-status';
import {
  createTestCompany,
  createTestBranch,
  createTestProduct,
  createTestInventoryLocation,
  createTestStockLevel,
  cleanupTestData,
} from '../utils/inventory-helpers';
import { StockMovementType } from '../../src/db/schemas/enums';

describe('Stock Movements API', () => {
  let testCompany: { id: string };
  let testBranch: { id: string };
  let testProduct: { id: string };
  let testLocation: { id: string };
  let testUserId: string;

  beforeAll(async () => {
    testUserId = createId();
    testCompany = (await createTestCompany({ createdBy: testUserId }))!;
    testBranch = (await createTestBranch({ companyId: testCompany.id, createdBy: testUserId }))!;
    testProduct = (await createTestProduct({ companyId: testCompany.id, createdBy: testUserId }))!;
    testLocation = (await createTestInventoryLocation({
      branchId: testBranch.id,
      createdBy: testUserId,
      companyId: testCompany.id,
    }))!;
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  test('POST /v1/inventory/stock-movements - records a receipt movement', async () => {
    const movementData = {
      productId: testProduct!.id,
      locationId: testLocation!.id,
      movementType: StockMovementType.RECEIPT,
      quantity: '50',
      notes: 'Test receipt',
      createdBy: testUserId,
    };

    const res = await http('POST', '/v1/inventory/stock-movements', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movementData),
    });

    expect(res.status).toBe(HttpStatus.CREATED);
    const body = await json<{ id: string }>(res);
    expect(body.id).toBeDefined();
  });

  test('POST /v1/inventory/stock-movements - records an issue movement', async () => {
    const product = await createTestProduct({
      companyId: testCompany.id,
      sku: `ISSUE-${Date.now()}`,
      createdBy: testUserId,
    });

    // Set initial stock
    await createTestStockLevel({
      companyId: testCompany.id,
      productId: product!.id,
      locationId: testLocation.id,
      quantity: BigInt(100),
    });

    const movementData = {
      productId: product!.id,
      locationId: testLocation!.id,
      movementType: StockMovementType.ISSUE,
      quantity: '30',
      notes: 'Test issue',
      createdBy: testUserId,
    };

    const res = await http('POST', '/v1/inventory/stock-movements', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movementData),
    });

    expect(res.status).toBe(HttpStatus.CREATED);
  });

  test('POST /v1/inventory/stock-movements - automatically updates stock level', async () => {
    const product = await createTestProduct({
      companyId: testCompany.id,
      sku: `AUTO-UPDATE-${Date.now()}`,
      createdBy: testUserId,
    });
    const location = await createTestInventoryLocation({
      companyId: testCompany.id,
      branchId: testBranch.id,
      name: `Auto-Update-${Date.now()}`,
      createdBy: testUserId,
    });

    // Initial receipt
    await http('POST', '/v1/inventory/stock-movements', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product!.id,
        locationId: location!.id,
        movementType: StockMovementType.RECEIPT,
        quantity: '100',
        createdBy: testUserId,
      }),
    });

    // Check stock level
    const stockRes = await http('GET', `/v1/inventory/products/${product!.id}/stock`);
    const stockBody = await json<{ data: Array<{ quantityAvailable: string }> }>(stockRes);
    expect(stockBody.data.some((s) => s.quantityAvailable === '100')).toBe(true);

    // Issue some stock
    await http('POST', '/v1/inventory/stock-movements', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product!.id,
        locationId: location!.id,
        movementType: StockMovementType.ISSUE,
        quantity: '40',
        createdBy: testUserId,
      }),
    });

    // Check updated stock level
    const stockRes2 = await http('GET', `/v1/inventory/products/${product!.id}/stock`);
    const stockBody2 = await json<{ data: Array<{ quantityAvailable: string }> }>(stockRes2);
    expect(stockBody2.data.some((s) => s.quantityAvailable === '60')).toBe(true);
  });

  test('POST /v1/inventory/stock-movements - fails on invalid movement type', async () => {
    const movementData = {
      productId: testProduct!.id,
      locationId: testLocation!.id,
      movementType: 999, // Invalid type
      quantity: '10',
      createdBy: testUserId,
    };

    const res = await http('POST', '/v1/inventory/stock-movements', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movementData),
    });

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });

  test('POST /v1/inventory/stock-movements - includes reference information', async () => {
    const referenceId = createId();
    const movementData = {
      productId: testProduct!.id,
      locationId: testLocation!.id,
      movementType: StockMovementType.RECEIPT,
      quantity: '25',
      referenceType: 'PURCHASE_ORDER',
      referenceId: referenceId,
      notes: 'From PO #12345',
      createdBy: testUserId,
    };

    const res = await http('POST', '/v1/inventory/stock-movements', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movementData),
    });

    expect(res.status).toBe(HttpStatus.CREATED);
  });

  test('GET /v1/inventory/stock-movements - lists movements', async () => {
    const product = await createTestProduct({
      companyId: testCompany.id,
      sku: `LIST-${Date.now()}`,
      createdBy: testUserId,
    });

    // Create some movements
    for (let i = 0; i < 3; i++) {
      await http('POST', '/v1/inventory/stock-movements', {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product!.id,
          locationId: testLocation!.id,
          movementType: StockMovementType.RECEIPT,
          quantity: '10',
          createdBy: testUserId,
        }),
      });
    }

    const res = await http('GET', `/v1/inventory/stock-movements?productId=${product!.id}`);

    expect(res.status).toBe(HttpStatus.OK);
    const body = await json<{ data: Array<{ productId: string }> }>(res);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.every((m) => m.productId === product!.id)).toBe(true);
  });

  test('GET /v1/inventory/stock-movements - filters by location', async () => {
    const location = await createTestInventoryLocation({
      companyId: testCompany.id,
      branchId: testBranch.id,
      name: `Filter-${Date.now()}`,
      createdBy: testUserId,
    });

    await http('POST', '/v1/inventory/stock-movements', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: testProduct!.id,
        locationId: location!.id,
        movementType: StockMovementType.RECEIPT,
        quantity: '15',
        createdBy: testUserId,
      }),
    });

    const res = await http('GET', `/v1/inventory/stock-movements?locationId=${location!.id}`);

    expect(res.status).toBe(HttpStatus.OK);
    const body = await json<{ data: Array<{ locationId: string }> }>(res);
    expect(body.data.every((m) => m.locationId === location!.id)).toBe(true);
  });

  test('GET /v1/inventory/stock-movements - filters by movement type', async () => {
    const product = await createTestProduct({
      companyId: testCompany.id,
      sku: `TYPE-FILTER-${Date.now()}`,
      createdBy: testUserId,
    });

    await createTestStockLevel({
      companyId: testCompany.id,
      productId: product!.id,
      locationId: testLocation.id,
      quantity: BigInt(100),
    });

    // Create receipt
    await http('POST', '/v1/inventory/stock-movements', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product!.id,
        locationId: testLocation!.id,
        movementType: StockMovementType.RECEIPT,
        quantity: '20',
        createdBy: testUserId,
      }),
    });

    // Create issue
    await http('POST', '/v1/inventory/stock-movements', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product!.id,
        locationId: testLocation!.id,
        movementType: StockMovementType.ISSUE,
        quantity: '10',
        createdBy: testUserId,
      }),
    });

    // Filter by RECEIPT type
    const res = await http(
      'GET',
      `/v1/inventory/stock-movements?productId=${product!.id}&movementType=${StockMovementType.RECEIPT}`,
    );

    expect(res.status).toBe(HttpStatus.OK);
    const body = await json<{ data: Array<{ movementType: number }> }>(res);
    expect(body.data.every((m) => m.movementType === StockMovementType.RECEIPT)).toBe(true);
  });

  test('GET /v1/inventory/stock-movements - filters by date range', async () => {
    const product = await createTestProduct({
      companyId: testCompany.id,
      sku: `DATE-FILTER-${Date.now()}`,
      createdBy: testUserId,
    });

    await http('POST', '/v1/inventory/stock-movements', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product!.id,
        locationId: testLocation!.id,
        movementType: StockMovementType.RECEIPT,
        quantity: '5',
        createdBy: testUserId,
      }),
    });

    const now = new Date();
    const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
    const endDate = new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // 1 hour from now

    const res = await http(
      'GET',
      `/v1/inventory/stock-movements?productId=${product!.id}&startDate=${startDate}&endDate=${endDate}`,
    );

    expect(res.status).toBe(HttpStatus.OK);
    const body = await json<{ data: Array<{ productId: string }> }>(res);
    expect(body.data.some((m) => m.productId === product!.id)).toBe(true);
  });

  test('POST /v1/inventory/stock-movements - fails when issuing from non-existent stock', async () => {
    const product = await createTestProduct({
      companyId: testCompany.id,
      sku: `NO-STOCK-${Date.now()}`,
      createdBy: testUserId,
    });
    const location = await createTestInventoryLocation({
      companyId: testCompany.id,
      branchId: testBranch.id,
      name: `No-Stock-${Date.now()}`,
      createdBy: testUserId,
    });

    // Try to issue without any stock
    const movementData = {
      productId: product!.id,
      locationId: location!.id,
      movementType: StockMovementType.ISSUE,
      quantity: '10',
      createdBy: testUserId,
    };

    const res = await http('POST', '/v1/inventory/stock-movements', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movementData),
    });

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });

  test('GET /v1/inventory/stock-movements - supports pagination', async () => {
    const product = await createTestProduct({
      companyId: testCompany.id,
      sku: `PAGE-${Date.now()}`,
      createdBy: testUserId,
    });

    // Create multiple movements
    for (let i = 0; i < 5; i++) {
      await http('POST', '/v1/inventory/stock-movements', {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product!.id,
          locationId: testLocation!.id,
          movementType: StockMovementType.RECEIPT,
          quantity: '1',
          createdBy: testUserId,
        }),
      });
    }

    const res = await http('GET', `/v1/inventory/stock-movements?productId=${product!.id}&limit=3`);
    expect(res.status).toBe(HttpStatus.OK);
    const body = await json<{ data: unknown[]; nextCursor: string | null }>(res);
    expect(body.data.length).toBeLessThanOrEqual(3);
  });
});
