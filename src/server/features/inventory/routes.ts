import { Elysia } from 'elysia';
import { decodeCursor, encodeCursor } from '@/server/utils/cursor';
import * as ctrl from './controller';
import * as schemas from './schemas';

// Helper to format dates in responses
function formatDates<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const [key, value] of Object.entries(result)) {
    if (value instanceof Date) {
      result[key] = value.toISOString() as T[Extract<keyof T, string>];
    }
  }
  return result;
}

// Helper to format bigint values to strings
function formatBigInts<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'bigint') {
      result[key] = value.toString() as T[Extract<keyof T, string>];
    }
  }
  return result;
}

function formatResponse<T extends Record<string, unknown>>(obj: T): T {
  return formatBigInts(formatDates(obj));
}

export const inventoryRoutes = new Elysia({ name: 'inventory' })
  // Product Categories
  .get(
    '/categories',
    async ({ query }) => {
      const limit = query.limit ? Math.min(Math.max(query.limit, 1), 100) : 25;
      const after = decodeCursor<{ createdAt: string; id: string }>(query.after || null);
      const { data, nextCursor } = await ctrl.listProductCategories({
        limit,
        after,
        companyId: query.companyId ?? null,
      });
      return {
        data: data.map(formatResponse),
        nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
      };
    },
    {
      query: schemas.ListProductCategoriesQuery,
      response: schemas.ListProductCategoriesResponse,
      detail: {
        tags: ['Inventory'],
        summary: 'List product categories',
        operationId: 'listProductCategories',
      },
    },
  )
  .get(
    '/categories/:id',
    async ({ params }) => {
      const category = await ctrl.getProductCategory(params.id);
      return formatResponse(category);
    },
    {
      params: schemas.GetProductCategoryParams,
      response: schemas.ProductCategoryDto,
      detail: {
        tags: ['Inventory'],
        summary: 'Get product category',
        operationId: 'getProductCategory',
      },
    },
  )
  .post(
    '/categories',
    async ({ body, set }) => {
      const result = await ctrl.createProductCategory(body);
      set.status = 201;
      return result;
    },
    {
      body: schemas.CreateProductCategoryBody,
      response: schemas.CreateResponse,
      detail: {
        tags: ['Inventory'],
        summary: 'Create product category',
        operationId: 'createProductCategory',
      },
    },
  )
  .put(
    '/categories/:id',
    async ({ params, body }) => {
      const result = await ctrl.updateProductCategory(params.id, body);
      return result;
    },
    {
      params: schemas.GetProductCategoryParams,
      body: schemas.UpdateProductCategoryBody,
      response: schemas.CreateResponse,
      detail: {
        tags: ['Inventory'],
        summary: 'Update product category',
        operationId: 'updateProductCategory',
      },
    },
  )
  .delete(
    '/categories/:id',
    async ({ params }) => {
      const result = await ctrl.deleteProductCategory(params.id);
      return result;
    },
    {
      params: schemas.GetProductCategoryParams,
      detail: {
        tags: ['Inventory'],
        summary: 'Delete product category',
        operationId: 'deleteProductCategory',
      },
    },
  )

  // Products
  .get(
    '/products',
    async ({ query }) => {
      const limit = query.limit ? Math.min(Math.max(query.limit, 1), 100) : 25;
      const after = decodeCursor<{ createdAt: string; id: string }>(query.after || null);
      const { data, nextCursor } = await ctrl.listProducts({
        limit,
        after,
        companyId: query.companyId ?? null,
        categoryId: query.categoryId ?? null,
        search: query.search ?? null,
      });
      return {
        data: data.map(formatResponse),
        nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
      };
    },
    {
      query: schemas.ListProductsQuery,
      response: schemas.ListProductsResponse,
      detail: { tags: ['Inventory'], summary: 'List products', operationId: 'listProducts' },
    },
  )
  .get(
    '/products/:id',
    async ({ params }) => {
      const product = await ctrl.getProduct(params.id);
      return formatResponse(product);
    },
    {
      params: schemas.GetProductParams,
      response: schemas.ProductDto,
      detail: { tags: ['Inventory'], summary: 'Get product', operationId: 'getProduct' },
    },
  )
  .post(
    '/products',
    async ({ body, set }) => {
      const result = await ctrl.createProduct(body);
      set.status = 201;
      return result;
    },
    {
      body: schemas.CreateProductBody,
      response: schemas.CreateResponse,
      detail: { tags: ['Inventory'], summary: 'Create product', operationId: 'createProduct' },
    },
  )
  .put(
    '/products/:id',
    async ({ params, body }) => {
      const result = await ctrl.updateProduct(params.id, body);
      return result;
    },
    {
      params: schemas.GetProductParams,
      body: schemas.UpdateProductBody,
      response: schemas.CreateResponse,
      detail: { tags: ['Inventory'], summary: 'Update product', operationId: 'updateProduct' },
    },
  )
  .delete(
    '/products/:id',
    async ({ params }) => {
      const result = await ctrl.deleteProduct(params.id);
      return result;
    },
    {
      params: schemas.GetProductParams,
      detail: { tags: ['Inventory'], summary: 'Delete product', operationId: 'deleteProduct' },
    },
  )
  .get(
    '/products/:id/stock',
    async ({ params }) => {
      const stock = await ctrl.getProductStock(params.id);
      return { data: stock.map(formatResponse) };
    },
    {
      params: schemas.GetProductParams,
      detail: {
        tags: ['Inventory'],
        summary: 'Get product stock levels',
        operationId: 'getProductStock',
      },
    },
  )

  // Inventory Locations
  .get(
    '/locations',
    async ({ query }) => {
      const limit = query.limit ? Math.min(Math.max(query.limit, 1), 100) : 25;
      const after = decodeCursor<{ createdAt: string; id: string }>(query.after || null);
      const { data, nextCursor } = await ctrl.listInventoryLocations({
        limit,
        after,
        branchId: query.branchId ?? null,
        isActive: query.isActive ?? null,
      });
      return {
        data: data.map(formatResponse),
        nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
      };
    },
    {
      query: schemas.ListInventoryLocationsQuery,
      response: schemas.ListInventoryLocationsResponse,
      detail: {
        tags: ['Inventory'],
        summary: 'List inventory locations',
        operationId: 'listInventoryLocations',
      },
    },
  )
  .get(
    '/locations/:id',
    async ({ params }) => {
      const location = await ctrl.getInventoryLocation(params.id);
      return formatResponse(location);
    },
    {
      params: schemas.GetInventoryLocationParams,
      response: schemas.InventoryLocationDto,
      detail: {
        tags: ['Inventory'],
        summary: 'Get inventory location',
        operationId: 'getInventoryLocation',
      },
    },
  )
  .post(
    '/locations',
    async ({ body, set }) => {
      const result = await ctrl.createInventoryLocation(body);
      set.status = 201;
      return result;
    },
    {
      body: schemas.CreateInventoryLocationBody,
      response: schemas.CreateResponse,
      detail: {
        tags: ['Inventory'],
        summary: 'Create inventory location',
        operationId: 'createInventoryLocation',
      },
    },
  )
  .put(
    '/locations/:id',
    async ({ params, body }) => {
      const result = await ctrl.updateInventoryLocation(params.id, body);
      return result;
    },
    {
      params: schemas.GetInventoryLocationParams,
      body: schemas.UpdateInventoryLocationBody,
      response: schemas.CreateResponse,
      detail: {
        tags: ['Inventory'],
        summary: 'Update inventory location',
        operationId: 'updateInventoryLocation',
      },
    },
  )

  // Stock Levels
  .get(
    '/stock-levels',
    async ({ query }) => {
      const limit = query.limit ? Math.min(Math.max(query.limit, 1), 100) : 25;
      const after = decodeCursor<{ updatedAt: string; id: string }>(query.after || null);
      const { data, nextCursor } = await ctrl.listStockLevels({
        limit,
        after,
        productId: query.productId ?? null,
        locationId: query.locationId ?? null,
      });
      return {
        data: data.map(formatResponse),
        nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
      };
    },
    {
      query: schemas.ListStockLevelsQuery,
      response: schemas.ListStockLevelsResponse,
      detail: {
        tags: ['Inventory'],
        summary: 'List stock levels',
        operationId: 'listStockLevels',
      },
    },
  )

  // Stock Movements
  .post(
    '/stock-movements',
    async ({ body, set }) => {
      const result = await ctrl.recordStockMovement(body);
      set.status = 201;
      return { id: result.id };
    },
    {
      body: schemas.CreateStockMovementBody,
      response: schemas.CreateResponse,
      detail: {
        tags: ['Inventory'],
        summary: 'Record stock movement',
        operationId: 'recordStockMovement',
      },
    },
  )
  .get(
    '/stock-movements',
    async ({ query }) => {
      const limit = query.limit ? Math.min(Math.max(query.limit, 1), 100) : 25;
      const after = decodeCursor<{ createdAt: string; id: string }>(query.after || null);
      const { data, nextCursor } = await ctrl.listStockMovements({
        limit,
        after,
        productId: query.productId ?? null,
        locationId: query.locationId ?? null,
        movementType: query.movementType ?? null,
        startDate: query.startDate ?? null,
        endDate: query.endDate ?? null,
      });
      return {
        data: data.map(formatResponse),
        nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
      };
    },
    {
      query: schemas.ListMovementsQuery,
      response: schemas.ListStockMovementsResponse,
      detail: {
        tags: ['Inventory'],
        summary: 'List stock movements',
        operationId: 'listStockMovements',
      },
    },
  )

  // Stock Adjustments
  .post(
    '/stock-adjustments',
    async ({ body, set }) => {
      const result = await ctrl.createStockAdjustment(body);
      set.status = 201;
      return { id: result.id };
    },
    {
      body: schemas.CreateStockAdjustmentBody,
      response: schemas.CreateResponse,
      detail: {
        tags: ['Inventory'],
        summary: 'Create stock adjustment',
        operationId: 'createStockAdjustment',
      },
    },
  )

  // Stock Transfers
  .get(
    '/transfers',
    async ({ query }) => {
      const limit = query.limit ? Math.min(Math.max(query.limit, 1), 100) : 25;
      const after = decodeCursor<{ createdAt: string; id: string }>(query.after || null);
      const { data, nextCursor } = await ctrl.listStockTransfers({
        limit,
        after,
        fromLocationId: query.fromLocationId ?? null,
        toLocationId: query.toLocationId ?? null,
        status: query.status ?? null,
      });
      return {
        data: data.map(formatResponse),
        nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
      };
    },
    {
      query: schemas.ListTransfersQuery,
      response: schemas.ListStockTransfersResponse,
      detail: {
        tags: ['Inventory'],
        summary: 'List stock transfers',
        operationId: 'listStockTransfers',
      },
    },
  )
  .post(
    '/transfers',
    async ({ body, set }) => {
      const result = await ctrl.createStockTransfer(body);
      set.status = 201;
      return { id: result.id };
    },
    {
      body: schemas.CreateTransferBody,
      response: schemas.CreateResponse,
      detail: {
        tags: ['Inventory'],
        summary: 'Create stock transfer',
        operationId: 'createStockTransfer',
      },
    },
  )
  .get(
    '/transfers/:id',
    async ({ params }) => {
      const transfer = await ctrl.getStockTransfer(params.id);
      return {
        ...formatResponse(transfer),
        items: transfer.items.map(formatResponse),
      };
    },
    {
      params: schemas.GetTransferParams,
      response: schemas.StockTransferDto,
      detail: {
        tags: ['Inventory'],
        summary: 'Get stock transfer',
        operationId: 'getStockTransfer',
      },
    },
  )
  .put(
    '/transfers/:id/status',
    async ({ params, body }) => {
      const result = await ctrl.updateTransferStatus(
        params.id,
        body.status,
        body.notes,
        body.cancellationReason,
      );
      return { id: result.id };
    },
    {
      params: schemas.GetTransferParams,
      body: schemas.UpdateTransferStatusBody,
      response: schemas.CreateResponse,
      detail: {
        tags: ['Inventory'],
        summary: 'Update transfer status',
        operationId: 'updateTransferStatus',
      },
    },
  )
  .post(
    '/transfers/:id/complete',
    async ({ params, body }) => {
      const result = await ctrl.completeStockTransfer(params.id, body.userId);
      return { id: result.id };
    },
    {
      params: schemas.GetTransferParams,
      body: schemas.t.Object({ userId: schemas.UUID }),
      response: schemas.CreateResponse,
      detail: {
        tags: ['Inventory'],
        summary: 'Complete stock transfer',
        operationId: 'completeStockTransfer',
      },
    },
  )

  // Reports
  .get(
    '/reports/low-stock',
    async ({ query }) => {
      const data = await ctrl.getLowStockReport({
        companyId: query.companyId ?? null,
        branchId: query.branchId ?? null,
      });
      return { data: data.map(formatResponse) };
    },
    {
      query: schemas.ListLowStockQuery,
      response: schemas.ListLowStockResponse,
      detail: {
        tags: ['Inventory'],
        summary: 'Get low stock report',
        operationId: 'getLowStockReport',
      },
    },
  );
