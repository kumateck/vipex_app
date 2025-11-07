import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { http, json } from '../utils/request';
import { HttpStatus } from '../../src/server/utils/http-status';
import {
  createTestCompany,
  createTestBranch,
  createTestProduct,
  createTestInventoryLocation,
  createTestStockLevel,
  createTestStockMovement,
  cleanupTestData,
} from '../utils/inventory-helpers';
import { StockMovementType } from '../../src/db/schemas/enums';

describe('Stock Levels API', () => {
  let testCompany: { id: string };
  let testBranch: { id: string };
  let testProduct: { id: string };
  let testLocation: { id: string };
  let testUserId: string;

  beforeAll(async () => {
    testUserId = crypto.randomUUID();
    testCompany = await createTestCompany({ createdBy: testUserId });
    testBranch = await createTestBranch({ companyId: testCompany.id, createdBy: testUserId });
    testProduct = await createTestProduct({ companyId: testCompany.id, createdBy: testUserId });
    testLocation = await createTestInventoryLocation({
      branchId: testBranch.id,
      createdBy: testUserId,
    });
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  test('GET /v1/inventory/stock-levels - lists stock levels', async () => {
    // Create stock level
    await createTestStockLevel({
      productId: testProduct.id,
      locationId: testLocation.id,
      quantityAvailable: BigInt(100),
    });

    const res = await http('GET', `/v1/inventory/stock-levels?locationId=${testLocation.id}`);

    expect(res.status).toBe(HttpStatus.OK);
    const body = await json<{ data: Array<{ productId: string; locationId: string }> }>(res);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.some((s) => s.productId === testProduct.id)).toBe(true);
  });

  test('GET /v1/inventory/stock-levels - filters by product', async () => {
    const product2 = await createTestProduct({
      companyId: testCompany.id,
      sku: `FILTER-${Date.now()}`,
      createdBy: testUserId,
    });
    const location2 = await createTestInventoryLocation({
      branchId: testBranch.id,
      name: `Location ${Date.now()}`,
      createdBy: testUserId,
    });

    await createTestStockLevel({
      productId: product2.id,
      locationId: location2.id,
      quantityAvailable: BigInt(50),
    });

    const res = await http('GET', `/v1/inventory/stock-levels?productId=${product2.id}`);

    expect(res.status).toBe(HttpStatus.OK);
    const body = await json<{ data: Array<{ productId: string }> }>(res);
    expect(body.data.every((s) => s.productId === product2.id)).toBe(true);
  });

  test('GET /v1/inventory/products/:id/stock - gets stock levels for a product', async () => {
    const product = await createTestProduct({
      companyId: testCompany.id,
      sku: `STOCK-${Date.now()}`,
      createdBy: testUserId,
    });

    const location1 = await createTestInventoryLocation({
      branchId: testBranch.id,
      name: `Loc1-${Date.now()}`,
      createdBy: testUserId,
    });
    const location2 = await createTestInventoryLocation({
      branchId: testBranch.id,
      name: `Loc2-${Date.now()}`,
      createdBy: testUserId,
    });

    await createTestStockLevel({
      productId: product.id,
      locationId: location1.id,
      quantityAvailable: BigInt(100),
    });
    await createTestStockLevel({
      productId: product.id,
      locationId: location2.id,
      quantityAvailable: BigInt(50),
    });

    const res = await http('GET', `/v1/inventory/products/${product.id}/stock`);

    expect(res.status).toBe(HttpStatus.OK);
    const body = await json<{ data: Array<{ locationId: string; quantityAvailable: string }> }>(
      res,
    );
    expect(body.data.length).toBe(2);
    expect(body.data.some((s) => s.locationId === location1.id)).toBe(true);
    expect(body.data.some((s) => s.locationId === location2.id)).toBe(true);
  });

  test('Stock level is created automatically on first movement', async () => {
    const product = await createTestProduct({
      companyId: testCompany.id,
      sku: `AUTO-${Date.now()}`,
      createdBy: testUserId,
    });
    const location = await createTestInventoryLocation({
      branchId: testBranch.id,
      name: `Auto-${Date.now()}`,
      createdBy: testUserId,
    });

    // Record a receipt movement
    const movementData = {
      productId: product.id,
      locationId: location.id,
      movementType: StockMovementType.RECEIPT,
      quantity: '50',
      createdBy: testUserId,
    };

    const res = await http('POST', '/v1/inventory/stock-movements', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movementData),
    });

    expect(res.status).toBe(HttpStatus.CREATED);

    // Verify stock level was created
    const stockRes = await http('GET', `/v1/inventory/products/${product.id}/stock`);
    const stockBody = await json<{ data: Array<{ quantityAvailable: string }> }>(stockRes);
    expect(stockBody.data.length).toBe(1);
    expect(stockBody.data[0].quantityAvailable).toBe('50');
  });

  test('Stock level is updated correctly on movements', async () => {
    const product = await createTestProduct({
      companyId: testCompany.id,
      sku: `UPDATE-${Date.now()}`,
      createdBy: testUserId,
    });
    const location = await createTestInventoryLocation({
      branchId: testBranch.id,
      name: `Update-${Date.now()}`,
      createdBy: testUserId,
    });

    // Initial receipt
    await http('POST', '/v1/inventory/stock-movements', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.id,
        locationId: location.id,
        movementType: StockMovementType.RECEIPT,
        quantity: '100',
        createdBy: testUserId,
      }),
    });

    // Issue some stock
    await http('POST', '/v1/inventory/stock-movements', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.id,
        locationId: location.id,
        movementType: StockMovementType.ISSUE,
        quantity: '30',
        createdBy: testUserId,
      }),
    });

    // Verify final stock level
    const stockRes = await http('GET', `/v1/inventory/products/${product.id}/stock`);
    const stockBody = await json<{ data: Array<{ quantityAvailable: string }> }>(stockRes);
    expect(stockBody.data[0].quantityAvailable).toBe('70'); // 100 - 30
  });

  test('Cannot issue more stock than available', async () => {
    const product = await createTestProduct({
      companyId: testCompany.id,
      sku: `INSUFFICIENT-${Date.now()}`,
      createdBy: testUserId,
    });
    const location = await createTestInventoryLocation({
      branchId: testBranch.id,
      name: `Insufficient-${Date.now()}`,
      createdBy: testUserId,
    });

    // Set initial stock
    await createTestStockLevel({
      productId: product.id,
      locationId: location.id,
      quantityAvailable: BigInt(50),
    });

    // Try to issue more than available
    const movementData = {
      productId: product.id,
      locationId: location.id,
      movementType: StockMovementType.ISSUE,
      quantity: '100',
      createdBy: testUserId,
    };

    const res = await http('POST', '/v1/inventory/stock-movements', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movementData),
    });

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });

  test('Reserved quantity is tracked separately', async () => {
    const product = await createTestProduct({
      companyId: testCompany.id,
      sku: `RESERVED-${Date.now()}`,
      createdBy: testUserId,
    });
    const location = await createTestInventoryLocation({
      branchId: testBranch.id,
      name: `Reserved-${Date.now()}`,
      createdBy: testUserId,
    });

    await createTestStockLevel({
      productId: product.id,
      locationId: location.id,
      quantityAvailable: BigInt(100),
      quantityReserved: BigInt(20),
    });

    const res = await http('GET', `/v1/inventory/products/${product.id}/stock`);
    const body = await json<{
      data: Array<{ quantityAvailable: string; quantityReserved: string }>;
    }>(res);

    expect(body.data[0].quantityAvailable).toBe('100');
    expect(body.data[0].quantityReserved).toBe('20');
  });

  test('GET /v1/inventory/stock-levels - supports pagination', async () => {
    const product = await createTestProduct({
      companyId: testCompany.id,
      sku: `PAGE-${Date.now()}`,
      createdBy: testUserId,
    });

    // Create multiple stock levels
    for (let i = 0; i < 5; i++) {
      const location = await createTestInventoryLocation({
        branchId: testBranch.id,
        name: `Page-Loc-${i}-${Date.now()}`,
        createdBy: testUserId,
      });
      await createTestStockLevel({
        productId: product.id,
        locationId: location.id,
        quantityAvailable: BigInt(10 * (i + 1)),
      });
    }

    const res = await http('GET', `/v1/inventory/stock-levels?productId=${product.id}&limit=3`);
    expect(res.status).toBe(HttpStatus.OK);
    const body = await json<{ data: unknown[]; nextCursor: string | null }>(res);
    expect(body.data.length).toBeLessThanOrEqual(3);
  });
});
