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
import { TransferStatus } from '../../src/db/schemas/enums';

describe('Stock Transfers API', () => {
  let testCompany: { id: string };
  let testBranch: { id: string };
  let testProduct: { id: string };
  let testLocation1: { id: string };
  let testLocation2: { id: string };
  let testUserId: string;

  beforeAll(async () => {
    testUserId = crypto.randomUUID();
    testCompany = (await createTestCompany({ createdBy: testUserId }))!;
    testBranch = (await createTestBranch({ companyId: testCompany.id, createdBy: testUserId }))!;
    testProduct = (await createTestProduct({ companyId: testCompany.id, createdBy: testUserId }))!;
    testLocation1 = (await createTestInventoryLocation({
      branchId: testBranch.id,
      name: `Location 1 ${Date.now()}`,
      createdBy: testUserId,
      companyId: testCompany.id,
    }))!;
    testLocation2 = (await createTestInventoryLocation({
      branchId: testBranch.id,
      name: `Location 2 ${Date.now()}`,
      createdBy: testUserId,
      companyId: testCompany.id,
    }))!;
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  test('POST /v1/inventory/transfers - creates a transfer', async () => {
    const transferData = {
      fromLocationId: testLocation1.id,
      toLocationId: testLocation2.id,
      items: [
        {
          productId: testProduct!.id,
          quantityRequested: '50',
          notes: 'Transfer item notes',
        },
      ],
      notes: 'Transfer between locations',
      requestedBy: testUserId,
    };

    const res = await http('POST', '/v1/inventory/transfers', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transferData),
    });

    expect(res.status).toBe(HttpStatus.CREATED);
    const body = await json<{ id: string }>(res);
    expect(body.id).toBeDefined();
  });

  test('POST /v1/inventory/transfers - fails when from and to locations are same', async () => {
    const transferData = {
      fromLocationId: testLocation1.id,
      toLocationId: testLocation1.id,
      items: [{ productId: testProduct!.id, quantityRequested: '10' }],
      requestedBy: testUserId,
    };

    const res = await http('POST', '/v1/inventory/transfers', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transferData),
    });

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });

  test('POST /v1/inventory/transfers - fails with no items', async () => {
    const transferData = {
      fromLocationId: testLocation1.id,
      toLocationId: testLocation2.id,
      items: [],
      requestedBy: testUserId,
    };

    const res = await http('POST', '/v1/inventory/transfers', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transferData),
    });

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });

  test('GET /v1/inventory/transfers - lists transfers', async () => {
    // Create a transfer
    await http('POST', '/v1/inventory/transfers', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromLocationId: testLocation1.id,
        toLocationId: testLocation2.id,
        items: [{ productId: testProduct!.id, quantityRequested: '20' }],
        requestedBy: testUserId,
      }),
    });

    const res = await http('GET', `/v1/inventory/transfers?fromLocationId=${testLocation1.id}`);

    expect(res.status).toBe(HttpStatus.OK);
    const body = await json<{ data: Array<{ fromLocationId: string }> }>(res);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.every((t) => t.fromLocationId === testLocation1.id)).toBe(true);
  });

  test('GET /v1/inventory/transfers/:id - gets transfer with items', async () => {
    const createRes = await http('POST', '/v1/inventory/transfers', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromLocationId: testLocation1.id,
        toLocationId: testLocation2.id,
        items: [{ productId: testProduct!.id, quantityRequested: '30' }],
        notes: 'Test transfer',
        requestedBy: testUserId,
      }),
    });

    const createBody = await json<{ id: string }>(createRes);
    const transferId = createBody.id;

    const res = await http('GET', `/v1/inventory/transfers/${transferId}`);

    expect(res.status).toBe(HttpStatus.OK);
    const body = await json<{
      id: string;
      transferNumber: string;
      items: Array<{ productId: string; quantityRequested: string }>;
    }>(res);
    expect(body.id).toBe(transferId);
    expect(body.transferNumber).toBeDefined();
    expect(body.items).toBeDefined();
    expect(body.items.length).toBe(1);
    expect(body.items[0]?.quantityRequested).toBe('30');
  });

  test('PUT /v1/inventory/transfers/:id/status - updates transfer status', async () => {
    const createRes = await http('POST', '/v1/inventory/transfers', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromLocationId: testLocation1.id,
        toLocationId: testLocation2.id,
        items: [{ productId: testProduct!.id, quantityRequested: '15' }],
        requestedBy: testUserId,
      }),
    });

    const createBody = await json<{ id: string }>(createRes);

    const updateRes = await http('PUT', `/v1/inventory/transfers/${createBody.id}/status`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: TransferStatus.IN_TRANSIT,
        notes: 'Shipped',
      }),
    });

    expect(updateRes.status).toBe(HttpStatus.OK);

    // Verify status was updated
    const getRes = await http('GET', `/v1/inventory/transfers/${createBody.id}`);
    const getBody = await json<{ status: number; shippedAt: string | null }>(getRes);
    expect(getBody.status).toBe(TransferStatus.IN_TRANSIT);
    expect(getBody.shippedAt).not.toBeNull();
  });

  test('POST /v1/inventory/transfers/:id/complete - completes transfer and moves stock', async () => {
    const product = await createTestProduct({
      companyId: testCompany.id,
      sku: `COMPLETE-${Date.now()}`,
      createdBy: testUserId,
    });

    // Set initial stock in source location
    await createTestStockLevel({
      companyId: testCompany.id,
      productId: product!.id,
      locationId: testLocation1.id,
      quantity: BigInt(100),
    });

    // Create transfer
    const createRes = await http('POST', '/v1/inventory/transfers', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromLocationId: testLocation1.id,
        toLocationId: testLocation2.id,
        items: [{ productId: product!.id, quantityRequested: '40' }],
        requestedBy: testUserId,
      }),
    });

    const createBody = await json<{ id: string }>(createRes);

    // Update to IN_TRANSIT
    await http('PUT', `/v1/inventory/transfers/${createBody.id}/status`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: TransferStatus.IN_TRANSIT }),
    });

    // Complete the transfer
    const completeRes = await http('POST', `/v1/inventory/transfers/${createBody.id}/complete`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: testUserId }),
    });

    expect(completeRes.status).toBe(HttpStatus.OK);

    // Verify stock was moved
    const stockRes = await http('GET', `/v1/inventory/products/${product!.id}/stock`);
    const stockBody = await json<{
      data: Array<{ locationId: string; quantityAvailable: string }>;
    }>(stockRes);

    const sourceStock = stockBody.data.find((s) => s.locationId === testLocation1.id);
    const destStock = stockBody.data.find((s) => s.locationId === testLocation2.id);

    expect(sourceStock?.quantityAvailable).toBe('60'); // 100 - 40
    expect(destStock?.quantityAvailable).toBe('40');
  });

  test('POST /v1/inventory/transfers/:id/complete - fails if not in transit', async () => {
    const createRes = await http('POST', '/v1/inventory/transfers', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromLocationId: testLocation1.id,
        toLocationId: testLocation2.id,
        items: [{ productId: testProduct!.id, quantityRequested: '5' }],
        requestedBy: testUserId,
      }),
    });

    const createBody = await json<{ id: string }>(createRes);

    // Try to complete without moving to IN_TRANSIT first
    const completeRes = await http('POST', `/v1/inventory/transfers/${createBody.id}/complete`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: testUserId }),
    });

    expect(completeRes.status).toBe(HttpStatus.BAD_REQUEST);
  });

  test('PUT /v1/inventory/transfers/:id/status - can cancel transfer', async () => {
    const createRes = await http('POST', '/v1/inventory/transfers', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromLocationId: testLocation1.id,
        toLocationId: testLocation2.id,
        items: [{ productId: testProduct!.id, quantityRequested: '10' }],
        requestedBy: testUserId,
      }),
    });

    const createBody = await json<{ id: string }>(createRes);

    const cancelRes = await http('PUT', `/v1/inventory/transfers/${createBody.id}/status`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: TransferStatus.CANCELLED,
        cancellationReason: 'No longer needed',
      }),
    });

    expect(cancelRes.status).toBe(HttpStatus.OK);

    // Verify cancellation
    const getRes = await http('GET', `/v1/inventory/transfers/${createBody.id}`);
    const getBody = await json<{
      status: number;
      cancelledAt: string | null;
      cancellationReason: string | null;
    }>(getRes);
    expect(getBody.status).toBe(TransferStatus.CANCELLED);
    expect(getBody.cancelledAt).not.toBeNull();
    expect(getBody.cancellationReason).toBe('No longer needed');
  });

  test('GET /v1/inventory/transfers - filters by status', async () => {
    // Create pending transfer
    await http('POST', '/v1/inventory/transfers', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromLocationId: testLocation1.id,
        toLocationId: testLocation2.id,
        items: [{ productId: testProduct!.id, quantityRequested: '5' }],
        requestedBy: testUserId,
      }),
    });

    const res = await http('GET', `/v1/inventory/transfers?status=${TransferStatus.PENDING}`);

    expect(res.status).toBe(HttpStatus.OK);
    const body = await json<{ data: Array<{ status: number }> }>(res);
    expect(body.data.every((t) => t.status === TransferStatus.PENDING)).toBe(true);
  });

  test('POST /v1/inventory/transfers/:id/complete - fails with insufficient stock', async () => {
    const product = await createTestProduct({
      companyId: testCompany.id,
      sku: `INSUFF-${Date.now()}`,
      createdBy: testUserId,
    });

    // Set low stock
    await createTestStockLevel({
      companyId: testCompany.id,
      productId: product!.id,
      locationId: testLocation1.id,
      quantity: BigInt(10),
    });

    // Create transfer requesting more than available
    const createRes = await http('POST', '/v1/inventory/transfers', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromLocationId: testLocation1.id,
        toLocationId: testLocation2.id,
        items: [{ productId: product!.id, quantityRequested: '50' }],
        requestedBy: testUserId,
      }),
    });

    const createBody = await json<{ id: string }>(createRes);

    await http('PUT', `/v1/inventory/transfers/${createBody.id}/status`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: TransferStatus.IN_TRANSIT }),
    });

    const completeRes = await http('POST', `/v1/inventory/transfers/${createBody.id}/complete`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: testUserId }),
    });

    expect(completeRes.status).toBe(HttpStatus.BAD_REQUEST);
  });
});
