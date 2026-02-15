import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { UUID, NonEmptyString255, PaginationQuery, SmallInt } from '@/server/schemas/common';
import {
  listProductCategoriesCtrl,
  getProductCategoryCtrl,
  createProductCategoryCtrl,
  updateProductCategoryCtrl,
  deleteProductCategoryCtrl,
  listProductsCtrl,
  getProductCtrl,
  createProductCtrl,
  updateProductCtrl,
  deleteProductCtrl,
  listInventoryLocationsCtrl,
  getInventoryLocationCtrl,
  createInventoryLocationCtrl,
  updateInventoryLocationCtrl,
  deleteInventoryLocationCtrl,
  listStockLevelsCtrl,
  getStockLevelCtrl,
  listStockMovementsCtrl,
  createStockMovementCtrl,
  listStockAdjustmentsCtrl,
  createStockAdjustmentCtrl,
  listStockTransfersCtrl,
  getStockTransferCtrl,
  createStockTransferCtrl,
  updateStockTransferCtrl,
  getLowStockReportCtrl,
  getMovementHistoryCtrl,
} from './controller';

export const inventoryRoutes = new Elysia({ name: 'inventory' })
  // Product Categories
  .get('/categories', async ({ query }) => listProductCategoriesCtrl(query), {
    query: t.Intersect([PaginationQuery, t.Object({ companyId: t.Optional(UUID) })]),
    detail: {
      tags: ['Inventory'],
      summary: 'List product categories',
      operationId: 'listProductCategories',
    },
  })
  .get('/categories/:id', async ({ params }) => getProductCategoryCtrl(params.id), {
    params: t.Object({ id: UUID }),
    detail: {
      tags: ['Inventory'],
      summary: 'Get product category',
      operationId: 'getProductCategory',
    },
  })
  .post(
    '/categories',
    async ({ body, set }) => {
      const res = await createProductCategoryCtrl(body);
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        companyId: UUID,
        name: NonEmptyString255,
        description: t.Optional(t.String()),
        createdBy: UUID,
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Create product category',
        operationId: 'createProductCategory',
      },
    },
  )
  .patch('/categories/:id', async ({ params, body }) => updateProductCategoryCtrl(params.id, body), {
    params: t.Object({ id: UUID }),
    body: t.Object({
      name: t.Optional(NonEmptyString255),
      description: t.Optional(t.Union([t.String(), t.Null()])),
    }),
    detail: {
      tags: ['Inventory'],
      summary: 'Update product category',
      operationId: 'updateProductCategory',
    },
  })
  .delete('/categories/:id', async ({ params }) => deleteProductCategoryCtrl(params.id), {
    params: t.Object({ id: UUID }),
    detail: {
      tags: ['Inventory'],
      summary: 'Delete product category',
      operationId: 'deleteProductCategory',
    },
  })

  // Products
  .get('/products', async ({ query }) => listProductsCtrl(query), {
    query: t.Intersect([
      PaginationQuery,
      t.Object({ companyId: t.Optional(UUID), categoryId: t.Optional(UUID) }),
    ]),
    detail: { tags: ['Inventory'], summary: 'List products', operationId: 'listProducts' },
  })
  .get('/products/:id', async ({ params }) => getProductCtrl(params.id), {
    params: t.Object({ id: UUID }),
    detail: { tags: ['Inventory'], summary: 'Get product', operationId: 'getProduct' },
  })
  .post(
    '/products',
    async ({ body, set }) => {
      const res = await createProductCtrl(body);
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        companyId: UUID,
        categoryId: t.Optional(UUID),
        sku: t.String({ minLength: 1, maxLength: 100 }),
        name: NonEmptyString255,
        description: t.Optional(t.String()),
        unitOfMeasure: SmallInt,
        minStockLevel: t.Optional(t.String()),
        createdBy: UUID,
      }),
      detail: { tags: ['Inventory'], summary: 'Create product', operationId: 'createProduct' },
    },
  )
  .patch('/products/:id', async ({ params, body }) => updateProductCtrl(params.id, body), {
    params: t.Object({ id: UUID }),
    body: t.Object({
      categoryId: t.Optional(t.Union([UUID, t.Null()])),
      name: t.Optional(NonEmptyString255),
      description: t.Optional(t.Union([t.String(), t.Null()])),
      unitOfMeasure: t.Optional(SmallInt),
      minStockLevel: t.Optional(t.String()),
    }),
    detail: { tags: ['Inventory'], summary: 'Update product', operationId: 'updateProduct' },
  })
  .delete('/products/:id', async ({ params }) => deleteProductCtrl(params.id), {
    params: t.Object({ id: UUID }),
    detail: { tags: ['Inventory'], summary: 'Delete product', operationId: 'deleteProduct' },
  })

  // Inventory Locations
  .get('/locations', async ({ query }) => listInventoryLocationsCtrl(query), {
    query: t.Intersect([
      PaginationQuery,
      t.Object({ companyId: t.Optional(UUID), branchId: t.Optional(UUID) }),
    ]),
    detail: {
      tags: ['Inventory'],
      summary: 'List inventory locations',
      operationId: 'listInventoryLocations',
    },
  })
  .get('/locations/:id', async ({ params }) => getInventoryLocationCtrl(params.id), {
    params: t.Object({ id: UUID }),
    detail: {
      tags: ['Inventory'],
      summary: 'Get inventory location',
      operationId: 'getInventoryLocation',
    },
  })
  .post(
    '/locations',
    async ({ body, set }) => {
      const res = await createInventoryLocationCtrl(body);
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        companyId: UUID,
        branchId: UUID,
        name: NonEmptyString255,
        description: t.Optional(t.String()),
        createdBy: UUID,
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Create inventory location',
        operationId: 'createInventoryLocation',
      },
    },
  )
  .patch('/locations/:id', async ({ params, body }) => updateInventoryLocationCtrl(params.id, body), {
    params: t.Object({ id: UUID }),
    body: t.Object({
      name: t.Optional(NonEmptyString255),
      description: t.Optional(t.Union([t.String(), t.Null()])),
    }),
    detail: {
      tags: ['Inventory'],
      summary: 'Update inventory location',
      operationId: 'updateInventoryLocation',
    },
  })
  .delete('/locations/:id', async ({ params }) => deleteInventoryLocationCtrl(params.id), {
    params: t.Object({ id: UUID }),
    detail: {
      tags: ['Inventory'],
      summary: 'Delete inventory location',
      operationId: 'deleteInventoryLocation',
    },
  })

  // Stock Levels
  .get('/stock-levels', async ({ query }) => listStockLevelsCtrl(query), {
    query: t.Intersect([
      PaginationQuery,
      t.Object({
        companyId: t.Optional(UUID),
        productId: t.Optional(UUID),
        locationId: t.Optional(UUID),
      }),
    ]),
    detail: { tags: ['Inventory'], summary: 'List stock levels', operationId: 'listStockLevels' },
  })
  .get('/stock-levels/:productId/:locationId', async ({ params }) =>
    getStockLevelCtrl(params.productId, params.locationId), {
    params: t.Object({ productId: UUID, locationId: UUID }),
    detail: { tags: ['Inventory'], summary: 'Get stock level', operationId: 'getStockLevel' },
  })

  // Stock Movements
  .get('/stock-movements', async ({ query }) => listStockMovementsCtrl(query), {
    query: t.Intersect([
      PaginationQuery,
      t.Object({
        companyId: t.Optional(UUID),
        productId: t.Optional(UUID),
        locationId: t.Optional(UUID),
        movementType: t.Optional(SmallInt),
      }),
    ]),
    detail: {
      tags: ['Inventory'],
      summary: 'List stock movements',
      operationId: 'listStockMovements',
    },
  })
  .post(
    '/stock-movements',
    async ({ body, set }) => {
      const res = await createStockMovementCtrl(body);
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        companyId: UUID,
        productId: UUID,
        locationId: UUID,
        movementType: SmallInt,
        quantity: t.String(),
        referenceId: t.Optional(UUID),
        referenceType: t.Optional(t.String({ maxLength: 50 })),
        notes: t.Optional(t.String()),
        createdBy: UUID,
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Create stock movement',
        operationId: 'createStockMovement',
      },
    },
  )

  // Stock Adjustments
  .get('/stock-adjustments', async ({ query }) => listStockAdjustmentsCtrl(query), {
    query: t.Intersect([
      PaginationQuery,
      t.Object({
        companyId: t.Optional(UUID),
        productId: t.Optional(UUID),
        locationId: t.Optional(UUID),
      }),
    ]),
    detail: {
      tags: ['Inventory'],
      summary: 'List stock adjustments',
      operationId: 'listStockAdjustments',
    },
  })
  .post(
    '/stock-adjustments',
    async ({ body, set }) => {
      const res = await createStockAdjustmentCtrl(body);
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        companyId: UUID,
        productId: UUID,
        locationId: UUID,
        reason: SmallInt,
        quantityChange: t.String(),
        notes: t.Optional(t.String()),
        createdBy: UUID,
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Create stock adjustment',
        operationId: 'createStockAdjustment',
      },
    },
  )

  // Stock Transfers
  .get('/stock-transfers', async ({ query }) => listStockTransfersCtrl(query), {
    query: t.Intersect([
      PaginationQuery,
      t.Object({
        companyId: t.Optional(UUID),
        productId: t.Optional(UUID),
        status: t.Optional(SmallInt),
      }),
    ]),
    detail: {
      tags: ['Inventory'],
      summary: 'List stock transfers',
      operationId: 'listStockTransfers',
    },
  })
  .get('/stock-transfers/:id', async ({ params }) => getStockTransferCtrl(params.id), {
    params: t.Object({ id: UUID }),
    detail: { tags: ['Inventory'], summary: 'Get stock transfer', operationId: 'getStockTransfer' },
  })
  .post(
    '/stock-transfers',
    async ({ body, set }) => {
      const res = await createStockTransferCtrl(body);
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        companyId: UUID,
        productId: UUID,
        fromLocationId: UUID,
        toLocationId: UUID,
        quantity: t.String(),
        notes: t.Optional(t.String()),
        createdBy: UUID,
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Create stock transfer',
        operationId: 'createStockTransfer',
      },
    },
  )
  .patch('/stock-transfers/:id', async ({ params, body }) => updateStockTransferCtrl(params.id, body), {
    params: t.Object({ id: UUID }),
    body: t.Object({
      status: SmallInt,
      completedBy: t.Optional(UUID),
    }),
    detail: {
      tags: ['Inventory'],
      summary: 'Update stock transfer',
      operationId: 'updateStockTransfer',
    },
  })

  // Reports
  .get('/reports/low-stock', async ({ query }) => getLowStockReportCtrl(query.companyId, query.locationId), {
    query: t.Object({
      companyId: UUID,
      locationId: t.Optional(UUID),
    }),
    detail: {
      tags: ['Inventory'],
      summary: 'Get low stock report',
      operationId: 'getLowStockReport',
    },
  })
  .get('/reports/movements', async ({ query }) => getMovementHistoryCtrl(query), {
    query: t.Intersect([
      PaginationQuery,
      t.Object({
        companyId: UUID,
        productId: t.Optional(UUID),
        locationId: t.Optional(UUID),
        startDate: t.Optional(t.String({ format: 'date-time' })),
        endDate: t.Optional(t.String({ format: 'date-time' })),
      }),
    ]),
    detail: {
      tags: ['Inventory'],
      summary: 'Get movement history report',
      operationId: 'getMovementHistory',
    },
  });
