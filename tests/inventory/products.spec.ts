import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { http, json } from '../utils/request';
import { HttpStatus } from '../../src/server/utils/http-status';
import {
  createTestCompany,
  createTestProductCategory,
  createTestProduct,
  cleanupTestData,
} from '../utils/inventory-helpers';
import { UnitOfMeasure } from '../../src/db/schemas/enums';

describe('Product API', () => {
  let testCompany: { id: string };
  let testCategory: { id: string } | undefined;
  let testUserId: string;

  beforeAll(async () => {
    testUserId = crypto.randomUUID();
    const company = await createTestCompany({ createdBy: testUserId });
    if (!company) throw new Error('Failed to create test company');
    testCompany = company;
    testCategory = await createTestProductCategory({
      companyId: testCompany.id,
      name: 'Test Category',
      createdBy: testUserId,
    });
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  test('POST /v1/inventory/products - creates a new product', async () => {
    const productData = {
      companyId: testCompany.id,
      categoryId: testCategory?.id,
      sku: `SKU-${Date.now()}`,
      name: 'Test Product',
      description: 'A test product',
      unitOfMeasure: UnitOfMeasure.PIECE,
      minStockLevel: '10',
      createdBy: testUserId,
    };

    const res = await http('POST', '/v1/inventory/products', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });

    expect(res.status).toBe(HttpStatus.CREATED);
    const body = await json<{ id: string }>(res);
    expect(body.id).toBeDefined();
    expect(typeof body.id).toBe('string');
  });

  test('POST /v1/inventory/products - fails with duplicate SKU', async () => {
    const sku = `SKU-DUP-${Date.now()}`;

    // Create first product
    await createTestProduct({
      companyId: testCompany.id,
      sku,
      name: 'First Product',
      createdBy: testUserId,
    });

    // Try to create second product with same SKU
    const productData = {
      companyId: testCompany.id,
      sku,
      name: 'Second Product',
      unitOfMeasure: UnitOfMeasure.PIECE,
      createdBy: testUserId,
    };

    const res = await http('POST', '/v1/inventory/products', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });

    expect(res.status).toBe(HttpStatus.CONFLICT);
  });

  test('GET /v1/inventory/products - lists products', async () => {
    // Create test products
    await createTestProduct({
      companyId: testCompany.id,
      sku: `LIST-1-${Date.now()}`,
      name: 'List Product 1',
      createdBy: testUserId,
    });

    await createTestProduct({
      companyId: testCompany.id,
      sku: `LIST-2-${Date.now()}`,
      name: 'List Product 2',
      createdBy: testUserId,
    });

    const res = await http('GET', `/v1/inventory/products?companyId=${testCompany.id}`);

    expect(res.status).toBe(HttpStatus.OK);
    const body = await json<{ data: unknown[]; nextCursor: string | null }>(res);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  test('GET /v1/inventory/products - filters by category', async () => {
    const category = await createTestProductCategory({
      companyId: testCompany.id,
      name: `Filter Category ${Date.now()}`,
      createdBy: testUserId,
    });

    const product = await createTestProduct({
      companyId: testCompany.id,
      categoryId: category?.id,
      sku: `FILTER-${Date.now()}`,
      name: 'Filtered Product',
      createdBy: testUserId,
    });

    const res = await http('GET', `/v1/inventory/products?categoryId=${category?.id}`);

    expect(res.status).toBe(HttpStatus.OK);
    const body = await json<{ data: Array<{ id: string; categoryId: string | null }> }>(res);
    expect(body.data.some((p) => p.id === product?.id)).toBe(true);
    expect(body.data.every((p) => p.categoryId === category?.id)).toBe(true);
  });

  test('GET /v1/inventory/products - searches by name and SKU', async () => {
    const uniqueName = `SearchProduct-${Date.now()}`;
    const product = await createTestProduct({
      companyId: testCompany.id,
      sku: `SEARCH-${Date.now()}`,
      name: uniqueName,
      createdBy: testUserId,
    });

    // Search by name
    const res1 = await http('GET', `/v1/inventory/products?search=${uniqueName}`);
    expect(res1.status).toBe(HttpStatus.OK);
    const body1 = await json<{ data: Array<{ id: string }> }>(res1);
    expect(body1.data.some((p) => p.id === product?.id)).toBe(true);

    // Search by SKU
    const res2 = await http('GET', `/v1/inventory/products?search=${product?.sku}`);
    expect(res2.status).toBe(HttpStatus.OK);
    const body2 = await json<{ data: Array<{ id: string }> }>(res2);
    expect(body2.data.some((p) => p.id === product?.id)).toBe(true);
  });

  test('GET /v1/inventory/products/:id - gets a single product', async () => {
    const product = await createTestProduct({
      companyId: testCompany.id,
      categoryId: testCategory?.id,
      sku: `GET-${Date.now()}`,
      name: 'Get Product',
      description: 'Product to get',
      createdBy: testUserId,
    });

    const res = await http('GET', `/v1/inventory/products/${product?.id}`);

    expect(res.status).toBe(HttpStatus.OK);
    const body = await json<{
      id: string;
      sku: string;
      name: string;
      categoryName: string | null;
    }>(res);
    expect(product).toBeDefined();
    expect(body.id).toBe(product!.id);
    expect(body.sku).toBe(product!.sku);
    expect(body.name).toBe(product!.name);
  });

  test('GET /v1/inventory/products/:id - returns 404 for non-existent product', async () => {
    const fakeId = crypto.randomUUID();
    const res = await http('GET', `/v1/inventory/products/${fakeId}`);

    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  test('PUT /v1/inventory/products/:id - updates a product', async () => {
    const product = await createTestProduct({
      companyId: testCompany.id,
      sku: `UPDATE-${Date.now()}`,
      name: 'Original Name',
      createdBy: testUserId,
    });

    const updateData = {
      name: 'Updated Name',
      description: 'Updated description',
      minStockLevel: '20',
    };

    const res = await http('PUT', `/v1/inventory/products/${product?.id}`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });

    expect(res.status).toBe(HttpStatus.OK);

    // Verify the update
    const getRes = await http('GET', `/v1/inventory/products/${product?.id}`);
    const body = await json<{ name: string; description: string | null; minStockLevel: string }>(
      getRes,
    );
    expect(body.name).toBe('Updated Name');
    expect(body.description).toBe('Updated description');
    expect(body.minStockLevel).toBe('20');
  });

  test('PUT /v1/inventory/products/:id - fails when updating to duplicate SKU', async () => {
    const product1 = await createTestProduct({
      companyId: testCompany.id,
      sku: `DUP-UPDATE-1-${Date.now()}`,
      name: 'Product 1',
      createdBy: testUserId,
    });

    const product2 = await createTestProduct({
      companyId: testCompany.id,
      sku: `DUP-UPDATE-2-${Date.now()}`,
      name: 'Product 2',
      createdBy: testUserId,
    });

    const updateData = {
      sku: product2?.sku, // Try to use product2's SKU
    };

    const res = await http('PUT', `/v1/inventory/products/${product1?.id}`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });

    expect(res.status).toBe(HttpStatus.CONFLICT);
  });

  test('DELETE /v1/inventory/products/:id - soft deletes a product', async () => {
    const product = await createTestProduct({
      companyId: testCompany.id,
      sku: `DELETE-${Date.now()}`,
      name: 'Product to Delete',
      createdBy: testUserId,
    });

    const res = await http('DELETE', `/v1/inventory/products/${product?.id}`);

    expect(res.status).toBe(HttpStatus.OK);

    // Verify product is no longer accessible
    const getRes = await http('GET', `/v1/inventory/products/${product?.id}`);
    expect(getRes.status).toBe(HttpStatus.NOT_FOUND);
  });

  test('DELETE /v1/inventory/products/:id - returns 404 for non-existent product', async () => {
    const fakeId = crypto.randomUUID();
    const res = await http('DELETE', `/v1/inventory/products/${fakeId}`);

    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  test('GET /v1/inventory/products - supports pagination', async () => {
    // Create multiple products
    for (let i = 0; i < 5; i++) {
      await createTestProduct({
        companyId: testCompany.id,
        sku: `PAGE-${i}-${Date.now()}`,
        name: `Pagination Product ${i}`,
        createdBy: testUserId,
      });
    }

    // Get first page
    const res1 = await http('GET', `/v1/inventory/products?companyId=${testCompany.id}&limit=3`);
    expect(res1.status).toBe(HttpStatus.OK);
    const body1 = await json<{ data: unknown[]; nextCursor: string | null }>(res1);
    expect(body1.data.length).toBeLessThanOrEqual(3);

    // Get second page if cursor exists
    if (body1.nextCursor) {
      const res2 = await http(
        'GET',
        `/v1/inventory/products?companyId=${testCompany.id}&limit=3&after=${body1.nextCursor}`,
      );
      expect(res2.status).toBe(HttpStatus.OK);
      const body2 = await json<{ data: unknown[] }>(res2);
      expect(Array.isArray(body2.data)).toBe(true);
    }
  });
});
