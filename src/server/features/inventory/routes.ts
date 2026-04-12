import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import {
  UUID,
  NonEmptyString255,
  PaginationRequestQueryProps,
  SmallInt,
} from '@/server/schemas/common';
import {
  listProductCategoriesCtrl,
  listProductCategoryOptionsCtrl,
  getProductCategoryCtrl,
  createProductCategoryCtrl,
  updateProductCategoryCtrl,
  deleteProductCategoryCtrl,
  listProductsCtrl,
  listProductOptionsCtrl,
  getProductCtrl,
  createProductCtrl,
  updateProductCtrl,
  deleteProductCtrl,
  listInventoryLocationsCtrl,
  listInventoryLocationOptionsCtrl,
  getInventoryLocationCtrl,
  createInventoryLocationCtrl,
  updateInventoryLocationCtrl,
  deleteInventoryLocationCtrl,
  listStockLevelsCtrl,
  listStockLotsCtrl,
  getStockLotAnalyticsCtrl,
  getStockLotCtrl,
  getStockLotTraceabilityCtrl,
  listStockCountSessionsCtrl,
  getStockCountSessionCtrl,
  createStockCountSessionCtrl,
  updateStockCountSessionLineCtrl,
  submitStockCountSessionCtrl,
  approveStockCountSessionCtrl,
  getInventoryMonitoringSummaryCtrl,
  runInventoryDailyAutomationCtrl,
  createStockLotCtrl,
  updateStockLotStatusCtrl,
  runStockLotExpirySweepCtrl,
  getStockLotExpiryAlertsCtrl,
  getStockLevelCtrl,
  getProductStockLevelsCtrl,
  listStockMovementsCtrl,
  createStockMovementCtrl,
  listStockAdjustmentsCtrl,
  createStockAdjustmentCtrl,
  listStockTransfersCtrl,
  getStockTransferCtrl,
  createStockTransferCtrl,
  updateStockTransferCtrl,
  acknowledgeStockTransferReceiptCtrl,
  listLegacyTransfersCtrl,
  getLegacyTransferCtrl,
  createLegacyTransferCtrl,
  updateLegacyTransferStatusCtrl,
  completeLegacyTransferCtrl,
  approveStockRequestCtrl,
  allocateStockReservationCtrl,
  autoFulfillStockRequestLineCtrl,
  acknowledgeStockRequestLineCtrl,
  createStockRequestCtrl,
  getStockAllocationPolicyCtrl,
  getStockReservationCtrl,
  getStockReservationExceptionsSummaryCtrl,
  createStockMaintenanceRecordCtrl,
  fulfillStockRequestLineCtrl,
  getInventoryDashboardSummaryCtrl,
  getStockMaintenanceRecordCtrl,
  getStockRequestCtrl,
  getStockRequestLineAllocationCtrl,
  getLowStockReportCtrl,
  listStockMaintenanceRecordsCtrl,
  listStockReservationsCtrl,
  listStockRequestsCtrl,
  issueStockReservationCtrl,
  getMovementHistoryCtrl,
  rejectStockRequestCtrl,
  resolveStockMaintenanceRecordCtrl,
  syncStockReservationsForRequestCtrl,
  submitStockRequestCtrl,
  upsertStockAllocationPolicyCtrl,
  listReorderSuggestionsCtrl,
  listInventoryApprovalPoliciesCtrl,
  createInventoryApprovalPolicyCtrl,
  submitInventoryApprovalRequestCtrl,
  listInventoryApprovalRequestsCtrl,
  decideInventoryApprovalRequestCtrl,
  escalateOverdueInventoryApprovalRequestsCtrl,
  getInventoryValuationSummaryCtrl,
  recomputeInventoryValuationSnapshotsCtrl,
  syncInventoryFinancialPostingsCtrl,
  generateReplenishmentProposalCtrl,
  listReplenishmentProposalsCtrl,
  getReplenishmentProposalCtrl,
  decideReplenishmentProposalCtrl,
  listInventoryTasksCtrl,
  getInventoryTaskCtrl,
  createInventoryTaskCtrl,
  updateInventoryTaskStatusCtrl,
  scanInventoryTaskCtrl,
  listInventoryEventJournalCtrl,
  postInventoryCorrectionCtrl,
  getInventoryEnterpriseKpisCtrl,
} from './controller';

export const inventoryRoutes = new Elysia({ name: 'inventory' })
  // Product Categories
  .get(
    '/categories/options',
    async ({ query }) =>
      listProductCategoryOptionsCtrl({
        companyId: query.companyId ?? null,
        search: query.search ?? null,
      }),
    {
      query: t.Object({
        companyId: t.Optional(UUID),
        search: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'List product category options',
        operationId: 'listProductCategoryOptions',
      },
    },
  )
  .get(
    '/categories',
    async ({ query }) =>
      listProductCategoriesCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: { companyId: query.companyId ?? null },
      }),
    {
      query: t.Object({ ...PaginationRequestQueryProps, companyId: t.Optional(UUID) }),
      detail: {
        tags: ['Inventory'],
        summary: 'List product categories',
        operationId: 'listProductCategories',
      },
    },
  )
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
  .patch(
    '/categories/:id',
    async ({ params, body }) => updateProductCategoryCtrl(params.id, body),
    {
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
    },
  )
  .delete('/categories/:id', async ({ params }) => deleteProductCategoryCtrl(params.id), {
    params: t.Object({ id: UUID }),
    detail: {
      tags: ['Inventory'],
      summary: 'Delete product category',
      operationId: 'deleteProductCategory',
    },
  })

  // Products
  .get(
    '/products/options',
    async ({ query }) =>
      listProductOptionsCtrl({
        companyId: query.companyId ?? null,
        categoryId: query.categoryId ?? null,
        search: query.search ?? null,
      }),
    {
      query: t.Object({
        companyId: t.Optional(UUID),
        categoryId: t.Optional(UUID),
        search: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'List product options',
        operationId: 'listProductOptions',
      },
    },
  )
  .get(
    '/products',
    async ({ query }) =>
      listProductsCtrl({
        page: query.page,
        pageSize: query.pageSize ?? query.limit,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: { companyId: query.companyId ?? null, categoryId: query.categoryId ?? null },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        after: t.Optional(t.String()),
        companyId: t.Optional(UUID),
        categoryId: t.Optional(UUID),
      }),
      detail: { tags: ['Inventory'], summary: 'List products', operationId: 'listProducts' },
    },
  )
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
        isRecoverable: t.Optional(t.Boolean()),
        unitConversions: t.Optional(
          t.Array(
            t.Object({
              unitOfMeasure: SmallInt,
              factorToBase: t.String(),
            }),
          ),
        ),
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
      isRecoverable: t.Optional(t.Boolean()),
      unitConversions: t.Optional(
        t.Array(
          t.Object({
            unitOfMeasure: SmallInt,
            factorToBase: t.String(),
          }),
        ),
      ),
      minStockLevel: t.Optional(t.String()),
    }),
    detail: { tags: ['Inventory'], summary: 'Update product', operationId: 'updateProduct' },
  })
  .put('/products/:id', async ({ params, body }) => updateProductCtrl(params.id, body), {
    params: t.Object({ id: UUID }),
    body: t.Object({
      categoryId: t.Optional(t.Union([UUID, t.Null()])),
      sku: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
      name: t.Optional(NonEmptyString255),
      description: t.Optional(t.Union([t.String(), t.Null()])),
      unitOfMeasure: t.Optional(SmallInt),
      isRecoverable: t.Optional(t.Boolean()),
      unitConversions: t.Optional(
        t.Array(
          t.Object({
            unitOfMeasure: SmallInt,
            factorToBase: t.String(),
          }),
        ),
      ),
      minStockLevel: t.Optional(t.String()),
    }),
    detail: {
      tags: ['Inventory'],
      summary: 'Update product (legacy PUT)',
      operationId: 'putProduct',
    },
  })
  .delete('/products/:id', async ({ params }) => deleteProductCtrl(params.id), {
    params: t.Object({ id: UUID }),
    detail: { tags: ['Inventory'], summary: 'Delete product', operationId: 'deleteProduct' },
  })

  // Inventory Locations
  .get(
    '/locations/options',
    async ({ query }) =>
      listInventoryLocationOptionsCtrl({
        companyId: query.companyId ?? null,
        branchId: query.branchId ?? null,
        locationType: query.locationType ?? null,
        parentLocationId: query.parentLocationId ?? null,
        search: query.search ?? null,
      }),
    {
      query: t.Object({
        companyId: t.Optional(UUID),
        branchId: t.Optional(UUID),
        locationType: t.Optional(SmallInt),
        parentLocationId: t.Optional(UUID),
        search: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'List inventory location options',
        operationId: 'listInventoryLocationOptions',
      },
    },
  )
  .get(
    '/locations',
    async ({ query }) =>
      listInventoryLocationsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: query.companyId ?? null,
          branchId: query.branchId ?? null,
          locationType: query.locationType ?? null,
          parentLocationId: query.parentLocationId ?? null,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        companyId: t.Optional(UUID),
        branchId: t.Optional(UUID),
        locationType: t.Optional(SmallInt),
        parentLocationId: t.Optional(UUID),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'List inventory locations',
        operationId: 'listInventoryLocations',
      },
    },
  )
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
        locationType: t.Optional(SmallInt),
        parentLocationId: t.Optional(t.Union([UUID, t.Null()])),
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
  .patch(
    '/locations/:id',
    async ({ params, body }) => updateInventoryLocationCtrl(params.id, body),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        locationType: t.Optional(SmallInt),
        parentLocationId: t.Optional(t.Union([UUID, t.Null()])),
        name: t.Optional(NonEmptyString255),
        description: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Update inventory location',
        operationId: 'updateInventoryLocation',
      },
    },
  )
  .delete('/locations/:id', async ({ params }) => deleteInventoryLocationCtrl(params.id), {
    params: t.Object({ id: UUID }),
    detail: {
      tags: ['Inventory'],
      summary: 'Delete inventory location',
      operationId: 'deleteInventoryLocation',
    },
  })

  // Stock Levels
  .get(
    '/monitoring/summary',
    async ({ query }) =>
      getInventoryMonitoringSummaryCtrl({
        companyId: query.companyId,
        daysAhead: query.daysAhead ?? 30,
        issueLookbackDays: query.issueLookbackDays ?? 90,
      }),
    {
      query: t.Object({
        companyId: UUID,
        daysAhead: t.Optional(SmallInt),
        issueLookbackDays: t.Optional(SmallInt),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Inventory monitoring summary (risk + reservation + cycle count)',
        operationId: 'getInventoryMonitoringSummary',
      },
    },
  )
  .post(
    '/automation/run-daily',
    async ({ body }) =>
      runInventoryDailyAutomationCtrl({
        companyId: body.companyId,
        actorUserId: body.actorUserId,
        daysAhead: body.daysAhead ?? 30,
        sendEmailAlerts: body.sendEmailAlerts ?? true,
        recipientEmails: body.recipientEmails ?? [],
      }),
    {
      body: t.Object({
        companyId: UUID,
        actorUserId: UUID,
        daysAhead: t.Optional(SmallInt),
        sendEmailAlerts: t.Optional(t.Boolean()),
        recipientEmails: t.Optional(t.Array(t.String({ format: 'email' }))),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Run inventory daily automation hook',
        operationId: 'runInventoryDailyAutomation',
      },
    },
  )
  .get(
    '/stock-count-sessions',
    async ({ query }) =>
      listStockCountSessionsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: query.companyId!,
          locationId: query.locationId ?? null,
          status: query.status ?? null,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        companyId: UUID,
        locationId: t.Optional(UUID),
        status: t.Optional(SmallInt),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'List stock count sessions',
        operationId: 'listStockCountSessions',
      },
    },
  )
  .get('/stock-count-sessions/:id', async ({ params }) => getStockCountSessionCtrl(params.id), {
    params: t.Object({ id: UUID }),
    detail: {
      tags: ['Inventory'],
      summary: 'Get stock count session',
      operationId: 'getStockCountSession',
    },
  })
  .post(
    '/stock-count-sessions',
    async ({ body, set }) => {
      const result = await createStockCountSessionCtrl({
        companyId: body.companyId,
        locationId: body.locationId,
        notes: body.notes ?? null,
        createdBy: body.createdBy,
        productIds: body.productIds ?? [],
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        companyId: UUID,
        locationId: UUID,
        notes: t.Optional(t.Union([t.String(), t.Null()])),
        createdBy: UUID,
        productIds: t.Optional(t.Array(UUID)),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Create stock count session',
        operationId: 'createStockCountSession',
      },
    },
  )
  .patch(
    '/stock-count-sessions/:id/lines/:lineId',
    async ({ params, body }) =>
      updateStockCountSessionLineCtrl({
        sessionId: params.id,
        lineId: params.lineId,
        countedQuantity: body.countedQuantity,
        varianceReason: body.varianceReason ?? null,
        countedBy: body.countedBy,
      }),
    {
      params: t.Object({ id: UUID, lineId: UUID }),
      body: t.Object({
        countedQuantity: t.String(),
        varianceReason: t.Optional(t.Union([t.String(), t.Null()])),
        countedBy: UUID,
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Update stock count line counted quantity',
        operationId: 'updateStockCountSessionLine',
      },
    },
  )
  .post(
    '/stock-count-sessions/:id/submit',
    async ({ params, body }) =>
      submitStockCountSessionCtrl({
        id: params.id,
        submittedBy: body.submittedBy,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ submittedBy: UUID }),
      detail: {
        tags: ['Inventory'],
        summary: 'Submit stock count session',
        operationId: 'submitStockCountSession',
      },
    },
  )
  .post(
    '/stock-count-sessions/:id/approve',
    async ({ params, body }) =>
      approveStockCountSessionCtrl({
        id: params.id,
        approvedBy: body.approvedBy,
        applyAdjustments: body.applyAdjustments ?? true,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        approvedBy: UUID,
        applyAdjustments: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Approve stock count session and apply reconciliation adjustments',
        operationId: 'approveStockCountSession',
      },
    },
  )
  .get(
    '/stock-levels',
    async ({ query }) =>
      listStockLevelsCtrl({
        page: query.page,
        pageSize: query.pageSize ?? query.limit,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: query.companyId ?? null,
          productId: query.productId ?? null,
          locationId: query.locationId ?? null,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        after: t.Optional(t.String()),
        companyId: t.Optional(UUID),
        productId: t.Optional(UUID),
        locationId: t.Optional(UUID),
      }),
      detail: { tags: ['Inventory'], summary: 'List stock levels', operationId: 'listStockLevels' },
    },
  )
  .get(
    '/stock-levels/:productId/:locationId',
    async ({ params }) => getStockLevelCtrl(params.productId, params.locationId),
    {
      params: t.Object({ productId: UUID, locationId: UUID }),
      detail: { tags: ['Inventory'], summary: 'Get stock level', operationId: 'getStockLevel' },
    },
  )
  .get('/products/:id/stock', async ({ params }) => getProductStockLevelsCtrl(params.id), {
    params: t.Object({ id: UUID }),
    detail: {
      tags: ['Inventory'],
      summary: 'Get stock levels for a product (legacy compatibility)',
      operationId: 'getProductStockLevelsLegacy',
    },
  })

  // Stock Lots
  .get(
    '/stock-lots/analytics',
    async ({ query }) =>
      getStockLotAnalyticsCtrl({
        companyId: query.companyId,
        daysAhead: query.daysAhead ?? 30,
        issueLookbackDays: query.issueLookbackDays ?? 90,
        locationId: query.locationId ?? null,
      }),
    {
      query: t.Object({
        companyId: UUID,
        daysAhead: t.Optional(SmallInt),
        issueLookbackDays: t.Optional(SmallInt),
        locationId: t.Optional(UUID),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Get stock lot analytics (aging + FEFO compliance)',
        operationId: 'getStockLotAnalytics',
      },
    },
  )
  .get(
    '/stock-lots',
    async ({ query }) =>
      listStockLotsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: query.companyId!,
          productId: query.productId ?? null,
          locationId: query.locationId ?? null,
          status: query.status ?? null,
          batchNumber: query.batchNumber ?? null,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        companyId: UUID,
        productId: t.Optional(UUID),
        locationId: t.Optional(UUID),
        status: t.Optional(SmallInt),
        batchNumber: t.Optional(t.String({ maxLength: 100 })),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'List stock lots',
        operationId: 'listStockLots',
      },
    },
  )
  .get('/stock-lots/:id', async ({ params }) => getStockLotCtrl(params.id), {
    params: t.Object({ id: UUID }),
    detail: {
      tags: ['Inventory'],
      summary: 'Get stock lot',
      operationId: 'getStockLot',
    },
  })
  .get(
    '/stock-lots/:id/traceability',
    async ({ params }) => getStockLotTraceabilityCtrl(params.id),
    {
      params: t.Object({ id: UUID }),
      detail: {
        tags: ['Inventory'],
        summary: 'Get stock lot traceability (GRN/PO/supplier)',
        operationId: 'getStockLotTraceability',
      },
    },
  )
  .post(
    '/stock-lots',
    async ({ body, set }) => {
      const result = await createStockLotCtrl(body);
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        companyId: UUID,
        productId: UUID,
        locationId: UUID,
        batchNumber: t.String({ minLength: 1, maxLength: 100 }),
        quantityOnHand: t.String(),
        supplierBatchNumber: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
        expiryDate: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        manufacturedAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        receivedAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        notes: t.Optional(t.Union([t.String(), t.Null()])),
        createdBy: UUID,
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Create stock lot (or add quantity to existing batch)',
        operationId: 'createStockLot',
      },
    },
  )
  .patch(
    '/stock-lots/:id/status',
    async ({ params, body }) =>
      updateStockLotStatusCtrl({
        id: params.id,
        status: body.status,
        notes: body.notes ?? null,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        status: t.Optional(SmallInt),
        notes: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Update stock lot status/notes',
        operationId: 'updateStockLotStatus',
      },
    },
  )
  .post(
    '/stock-lot-expiry/sweep',
    async ({ body }) =>
      runStockLotExpirySweepCtrl({
        companyId: body.companyId,
        actorUserId: body.actorUserId,
      }),
    {
      body: t.Object({
        companyId: UUID,
        actorUserId: UUID,
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Sweep and mark expired lots',
        operationId: 'runStockLotExpirySweep',
      },
    },
  )
  .get(
    '/stock-lot-expiry/alerts',
    async ({ query }) =>
      getStockLotExpiryAlertsCtrl({
        companyId: query.companyId,
        daysAhead: query.daysAhead ?? 30,
        locationId: query.locationId ?? null,
      }),
    {
      query: t.Object({
        companyId: UUID,
        daysAhead: t.Optional(t.Numeric()),
        locationId: t.Optional(UUID),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Get near-expiry and expired lot alerts',
        operationId: 'getStockLotExpiryAlerts',
      },
    },
  )

  // Stock Movements
  .get(
    '/stock-movements',
    async ({ query }) =>
      listStockMovementsCtrl({
        page: query.page,
        pageSize: query.pageSize ?? query.limit,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom ?? query.startDate,
        dateTo: query.dateTo ?? query.endDate,
        filters: {
          companyId: query.companyId ?? null,
          productId: query.productId ?? null,
          locationId: query.locationId ?? null,
          movementType: query.movementType ?? null,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        after: t.Optional(t.String()),
        startDate: t.Optional(t.String({ format: 'date-time' })),
        endDate: t.Optional(t.String({ format: 'date-time' })),
        companyId: t.Optional(UUID),
        productId: t.Optional(UUID),
        locationId: t.Optional(UUID),
        movementType: t.Optional(SmallInt),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'List stock movements',
        operationId: 'listStockMovements',
      },
    },
  )
  .post(
    '/stock-movements',
    async ({ body, set }) => {
      const res = await createStockMovementCtrl(body);
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        companyId: t.Optional(UUID),
        productId: UUID,
        locationId: UUID,
        movementType: SmallInt,
        quantity: t.String(),
        batchNumber: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
        sourceLotId: t.Optional(t.Union([UUID, t.Null()])),
        supplierBatchNumber: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
        expiryDate: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        manufacturedAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        receivedAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
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
  .get(
    '/stock-adjustments',
    async ({ query }) =>
      listStockAdjustmentsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: query.companyId ?? null,
          productId: query.productId ?? null,
          locationId: query.locationId ?? null,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        companyId: t.Optional(UUID),
        productId: t.Optional(UUID),
        locationId: t.Optional(UUID),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'List stock adjustments',
        operationId: 'listStockAdjustments',
      },
    },
  )
  .post(
    '/stock-adjustments',
    async ({ body, set }) => {
      const res = await createStockAdjustmentCtrl(body);
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        companyId: t.Optional(UUID),
        productId: UUID,
        locationId: UUID,
        reason: SmallInt,
        quantityChange: t.Optional(t.String()),
        quantity: t.Optional(t.String()),
        batchNumber: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
        sourceLotId: t.Optional(t.Union([UUID, t.Null()])),
        supplierBatchNumber: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
        expiryDate: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        manufacturedAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
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
  .get(
    '/stock-transfers',
    async ({ query }) =>
      listStockTransfersCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: query.companyId ?? null,
          productId: query.productId ?? null,
          status: query.status ?? null,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        companyId: t.Optional(UUID),
        productId: t.Optional(UUID),
        status: t.Optional(SmallInt),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'List stock transfers',
        operationId: 'listStockTransfers',
      },
    },
  )
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
  .patch(
    '/stock-transfers/:id',
    async ({ params, body }) => updateStockTransferCtrl(params.id, body),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        status: t.Optional(SmallInt),
        fulfillQuantity: t.Optional(t.String()),
        completedBy: t.Optional(UUID),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Update stock transfer',
        operationId: 'updateStockTransfer',
      },
    },
  )
  .post(
    '/stock-transfers/:id/acknowledge-receipt',
    async ({ params, body }) =>
      acknowledgeStockTransferReceiptCtrl({
        transferId: params.id,
        acceptedQuantity: body.acceptedQuantity,
        damagedQuantity: body.damagedQuantity,
        missingQuantity: body.missingQuantity,
        notes: body.notes ?? null,
        acknowledgedBy: body.acknowledgedBy,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        acceptedQuantity: t.String(),
        damagedQuantity: t.Optional(t.String()),
        missingQuantity: t.Optional(t.String()),
        notes: t.Optional(t.String()),
        acknowledgedBy: UUID,
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Acknowledge stock transfer receipt (supports partial acceptance and variance)',
        operationId: 'acknowledgeStockTransferReceipt',
      },
    },
  )
  .get(
    '/transfers',
    async ({ query }) =>
      listLegacyTransfersCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: query.companyId ?? null,
          productId: query.productId ?? null,
          status: query.status ?? null,
          fromLocationId: query.fromLocationId ?? null,
          toLocationId: query.toLocationId ?? null,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        companyId: t.Optional(UUID),
        productId: t.Optional(UUID),
        status: t.Optional(SmallInt),
        fromLocationId: t.Optional(UUID),
        toLocationId: t.Optional(UUID),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'List stock transfers (legacy compatibility)',
        operationId: 'listStockTransfersLegacy',
      },
    },
  )
  .get('/transfers/:id', async ({ params }) => getLegacyTransferCtrl(params.id), {
    params: t.Object({ id: UUID }),
    detail: {
      tags: ['Inventory'],
      summary: 'Get stock transfer (legacy compatibility)',
      operationId: 'getStockTransferLegacy',
    },
  })
  .post(
    '/transfers',
    async ({ body, set }) => {
      const res = await createLegacyTransferCtrl(body);
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        fromLocationId: UUID,
        toLocationId: UUID,
        items: t.Array(
          t.Object({
            productId: UUID,
            quantityRequested: t.String(),
            notes: t.Optional(t.String()),
          }),
        ),
        notes: t.Optional(t.String()),
        requestedBy: UUID,
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Create stock transfer (legacy compatibility)',
        operationId: 'createStockTransferLegacy',
      },
    },
  )
  .put(
    '/transfers/:id/status',
    async ({ params, body }) => updateLegacyTransferStatusCtrl(params.id, body),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        status: SmallInt,
        notes: t.Optional(t.String()),
        cancellationReason: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Update stock transfer status (legacy compatibility)',
        operationId: 'updateStockTransferStatusLegacy',
      },
    },
  )
  .post(
    '/transfers/:id/complete',
    async ({ params, body }) => completeLegacyTransferCtrl(params.id, body),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ userId: UUID }),
      detail: {
        tags: ['Inventory'],
        summary: 'Complete stock transfer (legacy compatibility)',
        operationId: 'completeStockTransferLegacy',
      },
    },
  )

  // Stock Requests
  .get(
    '/dashboard/location-summary',
    async ({ query }) =>
      getInventoryDashboardSummaryCtrl({
        companyId: query.companyId,
        locationId: query.locationId ?? null,
        lowStockLimit:
          query.lowStockLimit !== undefined
            ? Number.parseInt(String(query.lowStockLimit), 10)
            : null,
      }),
    {
      query: t.Object({
        companyId: UUID,
        locationId: t.Optional(UUID),
        lowStockLimit: t.Optional(t.Numeric()),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Get inventory dashboard summary by location scope',
        operationId: 'getInventoryDashboardSummary',
      },
    },
  )
  .get(
    '/reorder-suggestions',
    async ({ query }) =>
      listReorderSuggestionsCtrl({
        companyId: query.companyId,
        locationId: query.locationId ?? null,
        includeZeroMin: query.includeZeroMin ?? false,
      }),
    {
      query: t.Object({
        companyId: UUID,
        locationId: t.Optional(UUID),
        includeZeroMin: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'List inventory reorder suggestions by min stock and hierarchy',
        operationId: 'listReorderSuggestions',
      },
    },
  )
  .get(
    '/stock-requests',
    async ({ query }) =>
      listStockRequestsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: query.companyId ?? null,
          requesterLocationId: query.requesterLocationId ?? null,
          status: query.status ?? null,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        companyId: t.Optional(UUID),
        requesterLocationId: t.Optional(UUID),
        status: t.Optional(SmallInt),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'List stock requests',
        operationId: 'listStockRequests',
      },
    },
  )
  .get('/stock-requests/:id', async ({ params }) => getStockRequestCtrl(params.id), {
    params: t.Object({ id: UUID }),
    detail: {
      tags: ['Inventory'],
      summary: 'Get stock request',
      operationId: 'getStockRequest',
    },
  })
  .post(
    '/stock-requests',
    async ({ body, set }) => {
      const res = await createStockRequestCtrl(body);
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        companyId: UUID,
        requesterLocationId: UUID,
        requestedToLocationId: t.Optional(t.Union([UUID, t.Null()])),
        notes: t.Optional(t.String()),
        requestedBy: UUID,
        submit: t.Optional(t.Boolean()),
        lines: t.Array(
          t.Object({
            productId: UUID,
            requestedQuantity: t.String(),
            notes: t.Optional(t.String()),
          }),
        ),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Create stock request',
        operationId: 'createStockRequest',
      },
    },
  )
  .post('/stock-requests/:id/submit', async ({ params }) => submitStockRequestCtrl(params.id), {
    params: t.Object({ id: UUID }),
    detail: {
      tags: ['Inventory'],
      summary: 'Submit stock request',
      operationId: 'submitStockRequest',
    },
  })
  .post(
    '/stock-requests/:id/approve',
    async ({ params, body }) => approveStockRequestCtrl(params.id, body.approvedBy),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ approvedBy: UUID }),
      detail: {
        tags: ['Inventory'],
        summary: 'Approve stock request',
        operationId: 'approveStockRequest',
      },
    },
  )
  .post(
    '/stock-requests/:id/reject',
    async ({ params, body }) => rejectStockRequestCtrl(params.id, body.rejectedBy, body.reason),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        rejectedBy: UUID,
        reason: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Reject stock request',
        operationId: 'rejectStockRequest',
      },
    },
  )
  .post(
    '/stock-requests/:id/fulfill',
    async ({ params, body }) =>
      fulfillStockRequestLineCtrl({
        requestId: params.id,
        lineId: body.lineId,
        fromLocationId: body.fromLocationId,
        fulfillQuantity: body.fulfillQuantity,
        fulfilledBy: body.fulfilledBy,
        notes: body.notes ?? null,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        lineId: UUID,
        fromLocationId: UUID,
        fulfillQuantity: t.String(),
        fulfilledBy: UUID,
        notes: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Fulfill stock request line',
        operationId: 'fulfillStockRequestLine',
      },
    },
  )
  .get(
    '/stock-requests/:id/allocation',
    async ({ params, query }) =>
      getStockRequestLineAllocationCtrl({
        requestId: params.id,
        lineId: query.lineId,
      }),
    {
      params: t.Object({ id: UUID }),
      query: t.Object({ lineId: UUID }),
      detail: {
        tags: ['Inventory'],
        summary: 'Get stock request allocation suggestion for a line',
        operationId: 'getStockRequestLineAllocation',
      },
    },
  )
  .post(
    '/stock-requests/:id/auto-fulfill',
    async ({ params, body }) =>
      autoFulfillStockRequestLineCtrl({
        requestId: params.id,
        lineId: body.lineId,
        fulfilledBy: body.fulfilledBy,
        notes: body.notes ?? null,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        lineId: UUID,
        fulfilledBy: UUID,
        notes: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Auto-fulfill stock request line using prioritized source locations',
        operationId: 'autoFulfillStockRequestLine',
      },
    },
  )
  .post(
    '/stock-requests/:id/lines/:lineId/acknowledge',
    async ({ params, body }) =>
      acknowledgeStockRequestLineCtrl({
        requestId: params.id,
        lineId: params.lineId,
        acknowledgedQuantity: body.acknowledgedQuantity,
        acknowledgedBy: body.acknowledgedBy,
        notes: body.notes ?? null,
      }),
    {
      params: t.Object({ id: UUID, lineId: UUID }),
      body: t.Object({
        acknowledgedQuantity: t.String(),
        acknowledgedBy: UUID,
        notes: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Acknowledge received quantity for a stock request line',
        operationId: 'acknowledgeStockRequestLine',
      },
    },
  )
  .post(
    '/stock-requests/:id/sync-reservations',
    async ({ params, body }) =>
      syncStockReservationsForRequestCtrl({
        requestId: params.id,
        actorUserId: body.actorUserId,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ actorUserId: UUID }),
      detail: {
        tags: ['Inventory'],
        summary: 'Create missing reservations for stock request lines',
        operationId: 'syncStockReservationsForRequest',
      },
    },
  )
  .get(
    '/stock-reservations',
    async ({ query }) =>
      listStockReservationsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: query.companyId!,
          status: query.status ?? null,
          requestId: query.requestId ?? null,
          productId: query.productId ?? null,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        companyId: UUID,
        status: t.Optional(SmallInt),
        requestId: t.Optional(UUID),
        productId: t.Optional(UUID),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'List stock reservations',
        operationId: 'listStockReservations',
      },
    },
  )
  .get('/stock-reservations/:id', async ({ params }) => getStockReservationCtrl(params.id), {
    params: t.Object({ id: UUID }),
    detail: {
      tags: ['Inventory'],
      summary: 'Get stock reservation',
      operationId: 'getStockReservation',
    },
  })
  .post(
    '/stock-reservations/:id/allocate',
    async ({ params, body }) =>
      allocateStockReservationCtrl({
        reservationId: params.id,
        actorUserId: body.actorUserId,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ actorUserId: UUID }),
      detail: {
        tags: ['Inventory'],
        summary: 'Allocate stock reservation using policy',
        operationId: 'allocateStockReservation',
      },
    },
  )
  .post(
    '/stock-reservations/:id/issue',
    async ({ params, body }) =>
      issueStockReservationCtrl({
        reservationId: params.id,
        actorUserId: body.actorUserId,
        notes: body.notes ?? null,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        actorUserId: UUID,
        notes: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Issue from reserved allocations',
        operationId: 'issueStockReservation',
      },
    },
  )
  .get(
    '/stock-reservations/exceptions/summary',
    async ({ query }) => getStockReservationExceptionsSummaryCtrl(query.companyId),
    {
      query: t.Object({ companyId: UUID }),
      detail: {
        tags: ['Inventory'],
        summary: 'Get reservation exception summary',
        operationId: 'getStockReservationExceptionsSummary',
      },
    },
  )
  .get(
    '/allocation-policies',
    async ({ query }) =>
      getStockAllocationPolicyCtrl({
        companyId: query.companyId,
        requesterRootLocationId: query.requesterRootLocationId ?? null,
      }),
    {
      query: t.Object({
        companyId: UUID,
        requesterRootLocationId: t.Optional(t.Union([UUID, t.Null()])),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Get allocation policy',
        operationId: 'getStockAllocationPolicy',
      },
    },
  )
  .post(
    '/allocation-policies',
    async ({ body, set }) => {
      const result = await upsertStockAllocationPolicyCtrl({
        companyId: body.companyId,
        requesterRootLocationId: body.requesterRootLocationId ?? null,
        strategy: body.strategy,
        allowPartial: body.allowPartial ?? true,
        prioritizeSameBranch: body.prioritizeSameBranch ?? true,
        maxSourceLocations: body.maxSourceLocations ?? 3,
        active: body.active ?? true,
        createdBy: body.createdBy,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        companyId: UUID,
        requesterRootLocationId: t.Optional(t.Union([UUID, t.Null()])),
        strategy: SmallInt,
        allowPartial: t.Optional(t.Boolean()),
        prioritizeSameBranch: t.Optional(t.Boolean()),
        maxSourceLocations: t.Optional(SmallInt),
        active: t.Optional(t.Boolean()),
        createdBy: UUID,
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Create or update allocation policy',
        operationId: 'upsertStockAllocationPolicy',
      },
    },
  )
  .get(
    '/stock-maintenance',
    async ({ query }) =>
      listStockMaintenanceRecordsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: query.companyId ?? null,
          locationId: query.locationId ?? null,
          issueType: query.issueType ?? null,
          status: query.status ?? null,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        companyId: t.Optional(UUID),
        locationId: t.Optional(UUID),
        issueType: t.Optional(SmallInt),
        status: t.Optional(SmallInt),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'List stock maintenance records',
        operationId: 'listStockMaintenanceRecords',
      },
    },
  )
  .get('/stock-maintenance/:id', async ({ params }) => getStockMaintenanceRecordCtrl(params.id), {
    params: t.Object({ id: UUID }),
    detail: {
      tags: ['Inventory'],
      summary: 'Get stock maintenance record',
      operationId: 'getStockMaintenanceRecord',
    },
  })
  .post(
    '/stock-maintenance',
    async ({ body, set }) => {
      const res = await createStockMaintenanceRecordCtrl(body);
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        companyId: UUID,
        productId: UUID,
        locationId: UUID,
        issueType: SmallInt,
        quantity: t.String(),
        notes: t.Optional(t.String()),
        createdBy: UUID,
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Create stock maintenance record',
        operationId: 'createStockMaintenanceRecord',
      },
    },
  )
  .post(
    '/stock-maintenance/:id/resolve',
    async ({ params, body }) =>
      resolveStockMaintenanceRecordCtrl({
        id: params.id,
        quantityReturned: body.quantityReturned ?? null,
        quantityDisposed: body.quantityDisposed ?? null,
        notes: body.notes ?? null,
        resolvedBy: body.resolvedBy,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        quantityReturned: t.Optional(t.String()),
        quantityDisposed: t.Optional(t.String()),
        notes: t.Optional(t.String()),
        resolvedBy: UUID,
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Resolve stock maintenance record',
        operationId: 'resolveStockMaintenanceRecord',
      },
    },
  )

  // Reports
  .get('/reports/low-stock', async ({ query }) => getLowStockReportCtrl(query), {
    query: t.Object({
      companyId: t.Optional(UUID),
      branchId: t.Optional(UUID),
      locationId: t.Optional(UUID),
    }),
    detail: {
      tags: ['Inventory'],
      summary: 'Get low stock report',
      operationId: 'getLowStockReport',
    },
  })
  .get(
    '/reports/movements',
    async ({ query }) =>
      getMovementHistoryCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: query.companyId,
          productId: query.productId ?? null,
          locationId: query.locationId ?? null,
          startDate: query.startDate ?? null,
          endDate: query.endDate ?? null,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        companyId: UUID,
        productId: t.Optional(UUID),
        locationId: t.Optional(UUID),
        startDate: t.Optional(t.String({ format: 'date-time' })),
        endDate: t.Optional(t.String({ format: 'date-time' })),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Get movement history report',
        operationId: 'getMovementHistory',
      },
    },
  )

  // 1) Approval policy engine
  .get(
    '/approval-policies',
    async ({ query }) =>
      listInventoryApprovalPoliciesCtrl({
        companyId: query.companyId,
        entityType: query.entityType ?? null,
        active: query.active ?? null,
      }),
    {
      query: t.Object({
        companyId: UUID,
        entityType: t.Optional(SmallInt),
        active: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'List inventory approval policies',
        operationId: 'listInventoryApprovalPolicies',
      },
    },
  )
  .post(
    '/approval-policies',
    async ({ body, set }) => {
      const result = await createInventoryApprovalPolicyCtrl({
        companyId: body.companyId,
        entityType: body.entityType,
        minAmount: body.minAmount ?? 0,
        maxAmount: body.maxAmount ?? null,
        locationType: body.locationType ?? null,
        level1ApproverRoleId: body.level1ApproverRoleId ?? null,
        level2ApproverRoleId: body.level2ApproverRoleId ?? null,
        slaHours: body.slaHours ?? 24,
        escalationRoleId: body.escalationRoleId ?? null,
        active: body.active ?? true,
        createdBy: body.createdBy,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        companyId: UUID,
        entityType: SmallInt,
        minAmount: t.Optional(t.Numeric()),
        maxAmount: t.Optional(t.Union([t.Numeric(), t.Null()])),
        locationType: t.Optional(t.Union([SmallInt, t.Null()])),
        level1ApproverRoleId: t.Optional(t.Union([UUID, t.Null()])),
        level2ApproverRoleId: t.Optional(t.Union([UUID, t.Null()])),
        slaHours: t.Optional(SmallInt),
        escalationRoleId: t.Optional(t.Union([UUID, t.Null()])),
        active: t.Optional(t.Boolean()),
        createdBy: UUID,
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Create inventory approval policy',
        operationId: 'createInventoryApprovalPolicy',
      },
    },
  )
  .post(
    '/approval-requests',
    async ({ body, set }) => {
      const result = await submitInventoryApprovalRequestCtrl({
        companyId: body.companyId,
        entityType: body.entityType,
        entityId: body.entityId,
        amount: Number(body.amount ?? 0),
        submittedBy: body.submittedBy,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        companyId: UUID,
        entityType: SmallInt,
        entityId: UUID,
        amount: t.Numeric(),
        submittedBy: UUID,
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Submit approval request for inventory entity',
        operationId: 'submitInventoryApprovalRequest',
      },
    },
  )
  .get(
    '/approval-requests',
    async ({ query }) =>
      listInventoryApprovalRequestsCtrl({
        companyId: query.companyId,
        status: query.status ?? null,
        entityType: query.entityType ?? null,
      }),
    {
      query: t.Object({
        companyId: UUID,
        status: t.Optional(SmallInt),
        entityType: t.Optional(SmallInt),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'List inventory approval requests',
        operationId: 'listInventoryApprovalRequests',
      },
    },
  )
  .post(
    '/approval-requests/:id/decide',
    async ({ params, body }) =>
      decideInventoryApprovalRequestCtrl({
        id: params.id,
        status: body.status,
        decidedBy: body.decidedBy,
        reason: body.reason ?? null,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        status: SmallInt,
        decidedBy: UUID,
        reason: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Approve or reject inventory approval request',
        operationId: 'decideInventoryApprovalRequest',
      },
    },
  )
  .post(
    '/approval-requests/escalate-overdue',
    async ({ body }) =>
      escalateOverdueInventoryApprovalRequestsCtrl({
        companyId: body.companyId,
        actorUserId: body.actorUserId,
      }),
    {
      body: t.Object({
        companyId: UUID,
        actorUserId: UUID,
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Escalate overdue inventory approval requests',
        operationId: 'escalateOverdueInventoryApprovalRequests',
      },
    },
  )

  // 2) Valuation + finance integration
  .get(
    '/valuation/summary',
    async ({ query }) =>
      getInventoryValuationSummaryCtrl({
        companyId: query.companyId,
        locationId: query.locationId ?? null,
      }),
    {
      query: t.Object({
        companyId: UUID,
        locationId: t.Optional(UUID),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Get inventory valuation summary',
        operationId: 'getInventoryValuationSummary',
      },
    },
  )
  .post(
    '/valuation/recompute',
    async ({ body }) =>
      recomputeInventoryValuationSnapshotsCtrl({
        companyId: body.companyId,
        method: body.method ?? undefined,
        actorUserId: body.actorUserId,
      }),
    {
      body: t.Object({
        companyId: UUID,
        method: t.Optional(SmallInt),
        actorUserId: UUID,
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Recompute inventory valuation snapshots',
        operationId: 'recomputeInventoryValuationSnapshots',
      },
    },
  )
  .post(
    '/valuation/sync-financial-postings',
    async ({ body }) =>
      syncInventoryFinancialPostingsCtrl({
        companyId: body.companyId,
        actorUserId: body.actorUserId,
        dateFrom: body.dateFrom ?? null,
        dateTo: body.dateTo ?? null,
      }),
    {
      body: t.Object({
        companyId: UUID,
        actorUserId: UUID,
        dateFrom: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        dateTo: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Sync missing inventory financial postings',
        operationId: 'syncInventoryFinancialPostings',
      },
    },
  )

  // 3) Planning engine
  .post(
    '/replenishment-proposals',
    async ({ body, set }) => {
      const result = await generateReplenishmentProposalCtrl({
        companyId: body.companyId,
        scopeLocationId: body.scopeLocationId ?? null,
        leadTimeDays: body.leadTimeDays ?? 7,
        coverageDays: body.coverageDays ?? 14,
        notes: body.notes ?? null,
        generatedBy: body.generatedBy,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        companyId: UUID,
        scopeLocationId: t.Optional(t.Union([UUID, t.Null()])),
        leadTimeDays: t.Optional(SmallInt),
        coverageDays: t.Optional(SmallInt),
        notes: t.Optional(t.Union([t.String(), t.Null()])),
        generatedBy: UUID,
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Generate replenishment proposal from reorder suggestions',
        operationId: 'generateReplenishmentProposal',
      },
    },
  )
  .get(
    '/replenishment-proposals',
    async ({ query }) =>
      listReplenishmentProposalsCtrl({
        companyId: query.companyId,
        status: query.status ?? null,
      }),
    {
      query: t.Object({
        companyId: UUID,
        status: t.Optional(SmallInt),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'List replenishment proposals',
        operationId: 'listReplenishmentProposals',
      },
    },
  )
  .get(
    '/replenishment-proposals/:id',
    async ({ params }) => getReplenishmentProposalCtrl(params.id),
    {
      params: t.Object({ id: UUID }),
      detail: {
        tags: ['Inventory'],
        summary: 'Get replenishment proposal',
        operationId: 'getReplenishmentProposal',
      },
    },
  )
  .post(
    '/replenishment-proposals/:id/decide',
    async ({ params, body }) =>
      decideReplenishmentProposalCtrl({
        id: params.id,
        status: body.status,
        actorUserId: body.actorUserId,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        status: SmallInt,
        actorUserId: UUID,
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Submit/approve/reject replenishment proposal',
        operationId: 'decideReplenishmentProposal',
      },
    },
  )

  // 4) Physical operations layer
  .get(
    '/tasks',
    async ({ query }) =>
      listInventoryTasksCtrl({
        companyId: query.companyId,
        status: query.status ?? null,
        taskType: query.taskType ?? null,
      }),
    {
      query: t.Object({
        companyId: UUID,
        status: t.Optional(SmallInt),
        taskType: t.Optional(SmallInt),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'List inventory tasks',
        operationId: 'listInventoryTasks',
      },
    },
  )
  .get('/tasks/:id', async ({ params }) => getInventoryTaskCtrl(params.id), {
    params: t.Object({ id: UUID }),
    detail: {
      tags: ['Inventory'],
      summary: 'Get inventory task',
      operationId: 'getInventoryTask',
    },
  })
  .post(
    '/tasks',
    async ({ body, set }) => {
      const result = await createInventoryTaskCtrl({
        companyId: body.companyId,
        taskType: body.taskType,
        productId: body.productId ?? null,
        fromLocationId: body.fromLocationId ?? null,
        toLocationId: body.toLocationId ?? null,
        plannedQuantity: body.plannedQuantity ?? undefined,
        assignedTo: body.assignedTo ?? null,
        notes: body.notes ?? null,
        createdBy: body.createdBy,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        companyId: UUID,
        taskType: SmallInt,
        productId: t.Optional(t.Union([UUID, t.Null()])),
        fromLocationId: t.Optional(t.Union([UUID, t.Null()])),
        toLocationId: t.Optional(t.Union([UUID, t.Null()])),
        plannedQuantity: t.Optional(t.String()),
        assignedTo: t.Optional(t.Union([UUID, t.Null()])),
        notes: t.Optional(t.Union([t.String(), t.Null()])),
        createdBy: UUID,
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Create inventory task',
        operationId: 'createInventoryTask',
      },
    },
  )
  .post(
    '/tasks/:id/status',
    async ({ params, body }) =>
      updateInventoryTaskStatusCtrl({
        id: params.id,
        status: body.status,
        actorUserId: body.actorUserId,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        status: SmallInt,
        actorUserId: UUID,
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Update inventory task status',
        operationId: 'updateInventoryTaskStatus',
      },
    },
  )
  .post(
    '/tasks/:id/scan',
    async ({ params, body }) =>
      scanInventoryTaskCtrl({
        taskId: params.id,
        scanCode: body.scanCode,
        quantity: body.quantity,
        scannedBy: body.scannedBy,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        scanCode: NonEmptyString255,
        quantity: t.String(),
        scannedBy: UUID,
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Record a task scan event',
        operationId: 'scanInventoryTask',
      },
    },
  )

  // 5) Audit/compliance hardening
  .get(
    '/audit/event-journal',
    async ({ query }) =>
      listInventoryEventJournalCtrl({
        companyId: query.companyId,
        entityType: query.entityType ?? null,
        entityId: query.entityId ?? null,
        eventType: query.eventType ?? null,
      }),
    {
      query: t.Object({
        companyId: UUID,
        entityType: t.Optional(t.String({ maxLength: 100 })),
        entityId: t.Optional(UUID),
        eventType: t.Optional(SmallInt),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'List inventory immutable event journal entries',
        operationId: 'listInventoryEventJournal',
      },
    },
  )
  .post(
    '/audit/corrections',
    async ({ body, set }) => {
      const result = await postInventoryCorrectionCtrl({
        companyId: body.companyId,
        productId: body.productId,
        locationId: body.locationId,
        quantityChange: body.quantityChange,
        notes: body.notes ?? null,
        actorUserId: body.actorUserId,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        companyId: UUID,
        productId: UUID,
        locationId: UUID,
        quantityChange: t.String(),
        notes: t.Optional(t.Union([t.String(), t.Null()])),
        actorUserId: UUID,
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Post manual inventory correction',
        operationId: 'postInventoryCorrection',
      },
    },
  )

  // 6) Enterprise reporting pack
  .get(
    '/reports/enterprise-kpis',
    async ({ query }) =>
      getInventoryEnterpriseKpisCtrl({
        companyId: query.companyId,
        locationId: query.locationId ?? null,
        days: query.days !== undefined ? Number(query.days) : undefined,
      }),
    {
      query: t.Object({
        companyId: UUID,
        locationId: t.Optional(UUID),
        days: t.Optional(t.Numeric()),
      }),
      detail: {
        tags: ['Inventory'],
        summary: 'Get enterprise inventory KPI pack',
        operationId: 'getInventoryEnterpriseKpis',
      },
    },
  );
