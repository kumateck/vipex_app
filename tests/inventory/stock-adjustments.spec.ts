import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
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
import { StockAdjustmentReason } from '../../src/db/schemas/enums';

describe('Stock Adjustments API', () => {
  let testCompany: { id: string };
  let testBranch: { id: string };
  let testProduct: { id: string };
  let testLocation: { id: string };
  let testUserId: string;

  beforeAll(async () => {
    testUserId = crypto.randomUUID();
    const company = await createTestCompany({ createdBy: testUserId });
    if (!company) throw new Error('Failed to create test company');
    testCompany = company;
    const branch = await createTestBranch({ companyId: testCompany.id, createdBy: testUserId });
    if (!branch) throw new Error('Failed to create test branch');
    testBranch = branch;
    const product = await createTestProduct({ companyId: testCompany.id, createdBy: testUserId });
    if (!product) throw new Error('Failed to create test product');
    testProduct = product;
    const location = await createTestInventoryLocation({
      branchId: testBranch.id,
      createdBy: testUserId,
    });
    if (!location) throw new Error('Failed to create test location');
    testLocation = location;
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  test('POST /v1/inventory/stock-adjustments - creates adjustment and updates stock', async () => {
    const product = await createTestProduct({
      companyId: testCompany.id,
      sku: `ADJ-${Date.now()}`,
      createdBy: testUserId,
    });

    await createTestStockLevel({
      productId: product!.id,
      locationId: testLocation.id,
      quantityAvailable: BigInt(50),
    });

    const adjustmentData = {
      productId: product!.id,
      locationId: testLocation.id,
      quantity: '100',
      reason: StockAdjustmentReason.RECOUNT,
      reasonDetails: 'Physical count showed 100 units',
      notes: 'Annual inventory count',
      createdBy: testUserId,
    };

    const res = await http('POST', '/v1/inventory/stock-adjustments', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adjustmentData),
    });

    expect(res.status).toBe(HttpStatus.CREATED);
    const body = await json<{ id: string }>(res);
    expect(body.id).toBeDefined();

    // Verify stock was adjusted
    const stockRes = await http('GET', `/v1/inventory/products/${product!.id}/stock`);
    const stockBody = await json<{ data: Array<{ quantityAvailable: string }> }>(stockRes);
    expect(stockBody.data.some((s) => s.quantityAvailable === '100')).toBe(true);
  });

  test('POST /v1/inventory/stock-adjustments - handles different reasons', async () => {
    const reasons = [
      StockAdjustmentReason.DAMAGE,
      StockAdjustmentReason.LOSS,
      StockAdjustmentReason.FOUND,
      StockAdjustmentReason.EXPIRED,
    ];

    for (const reason of reasons) {
      const product = await createTestProduct({
        companyId: testCompany.id,
        sku: `REASON-${reason}-${Date.now()}`,
        createdBy: testUserId,
      });

      const adjustmentData = {
        productId: product!.id,
        locationId: testLocation.id,
        quantity: '50',
        reason,
        reasonDetails: `Test for reason ${reason}`,
        createdBy: testUserId,
      };

      const res = await http('POST', '/v1/inventory/stock-adjustments', {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adjustmentData),
      });

      expect(res.status).toBe(HttpStatus.CREATED);
    }
  });

  test('POST /v1/inventory/stock-adjustments - fails with invalid reason', async () => {
    const adjustmentData = {
      productId: testProduct.id,
      locationId: testLocation.id,
      quantity: '50',
      reason: 999, // Invalid reason
      createdBy: testUserId,
    };

    const res = await http('POST', '/v1/inventory/stock-adjustments', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adjustmentData),
    });

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });

  test('POST /v1/inventory/stock-adjustments - creates stock level if not exists', async () => {
    const product = await createTestProduct({
      companyId: testCompany.id,
      sku: `NEW-ADJ-${Date.now()}`,
      createdBy: testUserId,
    });
    const location = await createTestInventoryLocation({
      branchId: testBranch.id,
      name: `New-Adj-${Date.now()}`,
      createdBy: testUserId,
    });

    const adjustmentData = {
      productId: product!.id,
      locationId: location!.id,
      quantity: '75',
      reason: StockAdjustmentReason.FOUND,
      reasonDetails: 'Found stock in storage',
      createdBy: testUserId,
    };

    const res = await http('POST', '/v1/inventory/stock-adjustments', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adjustmentData),
    });

    expect(res.status).toBe(HttpStatus.CREATED);

    // Verify stock level was created
    const stockRes = await http('GET', `/v1/inventory/products/${product!.id}/stock`);
    const stockBody = await json<{ data: Array<{ quantityAvailable: string }> }>(stockRes);
    expect(stockBody.data.some((s) => s.quantityAvailable === '75')).toBe(true);
  });

  test('POST /v1/inventory/stock-adjustments - updates lastCountDate', async () => {
    const product = await createTestProduct({
      companyId: testCompany.id,
      sku: `COUNT-${Date.now()}`,
      createdBy: testUserId,
    });
    const location = await createTestInventoryLocation({
      branchId: testBranch.id,
      name: `Count-${Date.now()}`,
      createdBy: testUserId,
    });

    await http('POST', '/v1/inventory/stock-adjustments', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product!.id,
        locationId: location!.id,
        quantity: '50',
        reason: StockAdjustmentReason.RECOUNT,
        createdBy: testUserId,
      }),
    });

    const stockRes = await http('GET', `/v1/inventory/products/${product!.id}/stock`);
    const stockBody = await json<{ data: Array<{ lastCountDate: string | null }> }>(stockRes);
    expect(stockBody.data.length).toBeGreaterThan(0);
    expect(stockBody.data[0]?.lastCountDate).not.toBeNull();
  });
});
