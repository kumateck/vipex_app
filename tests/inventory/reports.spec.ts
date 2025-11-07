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

describe('Inventory Reports API', () => {
  let testCompany: { id: string };
  let testBranch: { id: string };
  let testUserId: string;

  beforeAll(async () => {
    testUserId = crypto.randomUUID();
    testCompany = await createTestCompany({ createdBy: testUserId });
    testBranch = await createTestBranch({ companyId: testCompany.id, createdBy: testUserId });
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  test('GET /v1/inventory/reports/low-stock - returns products below minimum stock', async () => {
    const location = await createTestInventoryLocation({
      companyId: testCompany.id,
      branchId: testBranch.id,
      name: `Low Stock ${Date.now()}`,
      createdBy: testUserId,
    });

    // Create product with low stock
    const lowStockProduct = await createTestProduct({
      companyId: testCompany.id,
      sku: `LOW-${Date.now()}`,
      name: 'Low Stock Product',
      minStockLevel: BigInt(50),
      createdBy: testUserId,
    });

    await createTestStockLevel({
      productId: lowStockProduct.id,
      locationId: location.id,
      quantityAvailable: BigInt(30), // Below minStockLevel of 50
    });

    // Create product with adequate stock
    const adequateProduct = await createTestProduct({
      companyId: testCompany.id,
      sku: `ADEQUATE-${Date.now()}`,
      name: 'Adequate Stock Product',
      minStockLevel: BigInt(50),
      createdBy: testUserId,
    });

    await createTestStockLevel({
      productId: adequateProduct.id,
      locationId: location.id,
      quantityAvailable: BigInt(100), // Above minStockLevel
    });

    const res = await http('GET', `/v1/inventory/reports/low-stock?companyId=${testCompany.id}`);

    expect(res.status).toBe(HttpStatus.OK);
    const body = await json<{
      data: Array<{ productId: string; productName: string; deficit: string }>;
    }>(res);

    // Low stock product should be in results
    const lowStockItem = body.data.find((item) => item.productId === lowStockProduct.id);
    expect(lowStockItem).toBeDefined();
    expect(lowStockItem?.deficit).toBe('20'); // 50 - 30

    // Adequate stock product should NOT be in results
    const adequateItem = body.data.find((item) => item.productId === adequateProduct.id);
    expect(adequateItem).toBeUndefined();
  });

  test('GET /v1/inventory/reports/low-stock - filters by branch', async () => {
    const branch2 = await createTestBranch({
      companyId: testCompany.id,
      name: `Branch 2 ${Date.now()}`,
      createdBy: testUserId,
    });
    const location2 = await createTestInventoryLocation({
      companyId: testCompany.id,
      branchId: branch2.id,
      name: `Location B2 ${Date.now()}`,
      createdBy: testUserId,
    });

    const product = await createTestProduct({
      companyId: testCompany.id,
      sku: `BRANCH-FILTER-${Date.now()}`,
      minStockLevel: BigInt(100),
      createdBy: testUserId,
    });

    await createTestStockLevel({
      productId: product.id,
      locationId: location2.id,
      quantityAvailable: BigInt(50), // Low stock
    });

    const res = await http('GET', `/v1/inventory/reports/low-stock?branchId=${branch2.id}`);

    expect(res.status).toBe(HttpStatus.OK);
    const body = await json<{ data: Array<{ productId: string; locationId: string }> }>(res);

    const found = body.data.find((item) => item.productId === product.id);
    expect(found).toBeDefined();
    expect(found?.locationId).toBe(location2.id);
  });

  test('GET /v1/inventory/reports/low-stock - shows deficit correctly', async () => {
    const location = await createTestInventoryLocation({
      companyId: testCompany.id,
      branchId: testBranch.id,
      name: `Deficit ${Date.now()}`,
      createdBy: testUserId,
    });

    const product = await createTestProduct({
      companyId: testCompany.id,
      sku: `DEFICIT-${Date.now()}`,
      minStockLevel: BigInt(200),
      createdBy: testUserId,
    });

    await createTestStockLevel({
      productId: product.id,
      locationId: location.id,
      quantityAvailable: BigInt(75),
    });

    const res = await http('GET', `/v1/inventory/reports/low-stock?companyId=${testCompany.id}`);

    expect(res.status).toBe(HttpStatus.OK);
    const body = await json<{
      data: Array<{
        productId: string;
        quantityAvailable: string;
        minStockLevel: string;
        deficit: string;
      }>;
    }>(res);

    const item = body.data.find((i) => i.productId === product.id);
    expect(item).toBeDefined();
    expect(item?.quantityAvailable).toBe('75');
    expect(item?.minStockLevel).toBe('200');
    expect(item?.deficit).toBe('125'); // 200 - 75
  });

  test('GET /v1/inventory/reports/low-stock - excludes deleted products', async () => {
    const location = await createTestInventoryLocation({
      companyId: testCompany.id,
      branchId: testBranch.id,
      name: `Deleted ${Date.now()}`,
      createdBy: testUserId,
    });

    const product = await createTestProduct({
      companyId: testCompany.id,
      sku: `DELETED-${Date.now()}`,
      minStockLevel: BigInt(100),
      createdBy: testUserId,
    });

    await createTestStockLevel({
      productId: product.id,
      locationId: location.id,
      quantityAvailable: BigInt(50),
    });

    // Delete the product
    await http('DELETE', `/v1/inventory/products/${product.id}`);

    const res = await http('GET', `/v1/inventory/reports/low-stock?companyId=${testCompany.id}`);

    expect(res.status).toBe(HttpStatus.OK);
    const body = await json<{ data: Array<{ productId: string }> }>(res);

    // Deleted product should not appear
    const found = body.data.find((item) => item.productId === product.id);
    expect(found).toBeUndefined();
  });

  test('GET /v1/inventory/reports/low-stock - returns empty array when no low stock', async () => {
    const company2 = await createTestCompany({
      name: `Company ${Date.now()}`,
      createdBy: testUserId,
    });

    const res = await http('GET', `/v1/inventory/reports/low-stock?companyId=${company2.id}`);

    expect(res.status).toBe(HttpStatus.OK);
    const body = await json<{ data: unknown[] }>(res);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /v1/inventory/reports/low-stock - handles multiple locations for same product', async () => {
    const location1 = await createTestInventoryLocation({
      companyId: testCompany.id,
      branchId: testBranch.id,
      name: `Multi-Loc-1-${Date.now()}`,
      createdBy: testUserId,
    });
    const location2 = await createTestInventoryLocation({
      companyId: testCompany.id,
      branchId: testBranch.id,
      name: `Multi-Loc-2-${Date.now()}`,
      createdBy: testUserId,
    });

    const product = await createTestProduct({
      companyId: testCompany.id,
      sku: `MULTI-LOC-${Date.now()}`,
      minStockLevel: BigInt(100),
      createdBy: testUserId,
    });

    // Low stock in location1
    await createTestStockLevel({
      productId: product.id,
      locationId: location1.id,
      quantityAvailable: BigInt(30),
    });

    // Adequate stock in location2
    await createTestStockLevel({
      productId: product.id,
      locationId: location2.id,
      quantityAvailable: BigInt(150),
    });

    const res = await http('GET', `/v1/inventory/reports/low-stock?companyId=${testCompany.id}`);

    expect(res.status).toBe(HttpStatus.OK);
    const body = await json<{ data: Array<{ productId: string; locationId: string }> }>(res);

    // Should show location1 in low stock report
    const loc1Item = body.data.find(
      (item) => item.productId === product.id && item.locationId === location1.id,
    );
    expect(loc1Item).toBeDefined();

    // Location2 should not be in low stock report
    const loc2Item = body.data.find(
      (item) => item.productId === product.id && item.locationId === location2.id,
    );
    expect(loc2Item).toBeUndefined();
  });

  test('GET /v1/inventory/reports/low-stock - includes product and location names', async () => {
    const location = await createTestInventoryLocation({
      companyId: testCompany.id,
      branchId: testBranch.id,
      name: `Named Location ${Date.now()}`,
      createdBy: testUserId,
    });

    const product = await createTestProduct({
      companyId: testCompany.id,
      sku: `NAMED-${Date.now()}`,
      name: 'Named Product for Report',
      minStockLevel: BigInt(50),
      createdBy: testUserId,
    });

    await createTestStockLevel({
      productId: product.id,
      locationId: location.id,
      quantityAvailable: BigInt(20),
    });

    const res = await http('GET', `/v1/inventory/reports/low-stock?companyId=${testCompany.id}`);

    expect(res.status).toBe(HttpStatus.OK);
    const body = await json<{
      data: Array<{ productName: string; productSku: string; locationName: string }>;
    }>(res);

    const item = body.data.find((i) => i.productSku === product.sku);
    expect(item).toBeDefined();
    expect(item?.productName).toBe('Named Product for Report');
    expect(item?.locationName).toBe(location.name);
  });
});
