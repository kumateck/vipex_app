import { Elysia, t } from 'elysia';
import { HttpStatus } from '@/server/utils/http-status';
import { NonEmpty255, PaginationRequestQueryProps, UUID } from '@/server/schemas/common';
import {
  authPlugin,
  type AuthUser,
  requireAuth,
  requireModuleEnabled,
  requirePermissions,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  acceptProcurementSupplierQuoteCtrl,
  approveProcurementDemandCtrl,
  approvePurchaseRequestCtrl,
  consolidateProcurementDemandsCtrl,
  convertProcurementDemandsToPurchaseRequestsCtrl,
  createProcurementDemandCtrl,
  createProcurementDemandsFromInventoryLowStockCtrl,
  createProcurementDemandsFromFleetLowStockCtrl,
  createProcurementFleetPolicyCtrl,
  createProcurementGoodsReceiptCtrl,
  createProcurementPurchaseOrderFromAcceptedQuotesCtrl,
  createProcurementSupplierQuoteCtrl,
  createProcurementSupplierCtrl,
  createPurchaseRequestCtrl,
  getProcurementFleetPolicyByIdCtrl,
  getProcurementSupplierByIdCtrl,
  listProcurementDemandConsolidationsCtrl,
  listProcurementDemandsCtrl,
  listProcurementFleetPoliciesCtrl,
  listProcurementGoodsReceiptsCtrl,
  listProcurementPurchaseOrdersCtrl,
  listProcurementSupplierQuotesCtrl,
  listProcurementSupplierOptionsCtrl,
  listProcurementSuppliersCtrl,
  listPurchaseRequestsCtrl,
  rejectProcurementDemandCtrl,
  rejectPurchaseRequestCtrl,
  updateProcurementFleetPolicyCtrl,
  updateProcurementSupplierCtrl,
} from './controller';

export const procurementRoutes = new Elysia({ name: 'procurement' })
  .use(authPlugin)
  .get(
    '/fleet-policies',
    async ({ query, user }) =>
      listProcurementFleetPoliciesCtrl({
        companyId: (user as AuthUser).companyId!,
        isActive: query.isActive ?? null,
        branchId: query.branchId ?? null,
      }),
    {
      query: t.Object({
        isActive: t.Optional(t.Boolean()),
        branchId: t.Optional(UUID),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadProcurement),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'List fleet procurement policy rules' },
    },
  )
  .get(
    '/fleet-policies/:id',
    async ({ params, user }) =>
      getProcurementFleetPolicyByIdCtrl({
        companyId: (user as AuthUser).companyId!,
        id: params.id,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadProcurement),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'Get fleet procurement policy rule by id' },
    },
  )
  .post(
    '/fleet-policies',
    async ({ body, set, user }) => {
      const result = await createProcurementFleetPolicyCtrl({
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        branchId: body.branchId ?? null,
        preferredSupplierId: body.preferredSupplierId ?? null,
        demandUrgency: body.demandUrgency ?? 1,
        replenishMultiplier: body.replenishMultiplier ?? 1,
        isActive: body.isActive ?? true,
        note: body.note ?? null,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        branchId: t.Optional(t.Union([UUID, t.Null()])),
        preferredSupplierId: t.Optional(t.Union([UUID, t.Null()])),
        demandUrgency: t.Optional(t.Number({ minimum: 0, maximum: 3 })),
        replenishMultiplier: t.Optional(t.Number({ minimum: 1, maximum: 5 })),
        isActive: t.Optional(t.Boolean()),
        note: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateProcurementPurchaseRequests),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'Create fleet procurement policy rule' },
    },
  )
  .patch(
    '/fleet-policies/:id',
    async ({ params, body, user }) =>
      updateProcurementFleetPolicyCtrl({
        companyId: (user as AuthUser).companyId!,
        id: params.id,
        actorUserId: (user as AuthUser).sub,
        patch: {
          preferredSupplierId: body.preferredSupplierId,
          demandUrgency: body.demandUrgency,
          replenishMultiplier: body.replenishMultiplier,
          isActive: body.isActive,
          note: body.note,
        },
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        preferredSupplierId: t.Optional(t.Union([UUID, t.Null()])),
        demandUrgency: t.Optional(t.Number({ minimum: 0, maximum: 3 })),
        replenishMultiplier: t.Optional(t.Number({ minimum: 1, maximum: 5 })),
        isActive: t.Optional(t.Boolean()),
        note: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateProcurementPurchaseRequests),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'Update fleet procurement policy rule' },
    },
  )
  .get(
    '/suppliers/options',
    async ({ query, user }) =>
      listProcurementSupplierOptionsCtrl({
        companyId: (user as AuthUser).companyId!,
        search: query.search ?? null,
        isActive: query.isActive ?? null,
      }),
    {
      query: t.Object({
        search: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadProcurement),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'List procurement supplier options' },
    },
  )
  .get(
    '/suppliers/:id',
    async ({ params, user }) =>
      getProcurementSupplierByIdCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadProcurement),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'Get procurement supplier by id' },
    },
  )
  .get(
    '/suppliers',
    async ({ query, user }) =>
      listProcurementSuppliersCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          search: query.search,
          isActive: query.isActive ?? undefined,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        isActive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadProcurement),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'List procurement suppliers' },
    },
  )
  .post(
    '/suppliers',
    async ({ body, set, user }) => {
      const result = await createProcurementSupplierCtrl({
        companyId: (user as AuthUser).companyId!,
        createdBy: (user as AuthUser).sub,
        name: body.name,
        contactPerson: body.contactPerson ?? null,
        email: body.email ?? null,
        telephone: body.telephone ?? null,
        address: body.address ?? null,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        name: NonEmpty255,
        contactPerson: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        email: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        telephone: t.Optional(t.Union([t.String({ maxLength: 50 }), t.Null()])),
        address: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateProcurementSuppliers),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'Create procurement supplier' },
    },
  )
  .patch(
    '/suppliers/:id',
    async ({ params, body, user }) =>
      updateProcurementSupplierCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        patch: {
          name: body.name,
          contactPerson: body.contactPerson,
          email: body.email,
          telephone: body.telephone,
          address: body.address,
          isActive: body.isActive,
        },
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        name: t.Optional(NonEmpty255),
        contactPerson: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        email: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        telephone: t.Optional(t.Union([t.String({ maxLength: 50 }), t.Null()])),
        address: t.Optional(t.Union([t.String(), t.Null()])),
        isActive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanUpdateProcurementSuppliers),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'Update procurement supplier' },
    },
  )
  .get(
    '/demands',
    async ({ query, user }) =>
      listProcurementDemandsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          search: query.search,
          status: query.status,
          sourceModule: query.sourceModule,
          branchId: query.branchId,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        status: t.Optional(t.Number()),
        sourceModule: t.Optional(t.String({ maxLength: 50 })),
        branchId: t.Optional(UUID),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadProcurement),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'List procurement demands' },
    },
  )
  .post(
    '/demands',
    async ({ body, set, user }) => {
      const result = await createProcurementDemandCtrl({
        companyId: (user as AuthUser).companyId!,
        requestedByUserId: (user as AuthUser).sub,
        branchId: body.branchId ?? null,
        sourceModule: body.sourceModule,
        sourceEntityType: body.sourceEntityType ?? null,
        sourceEntityId: body.sourceEntityId ?? null,
        dedupeKey: body.dedupeKey ?? null,
        itemCode: body.itemCode,
        itemName: body.itemName,
        unit: body.unit ?? null,
        quantity: body.quantity,
        estimatedUnitCostPsw: body.estimatedUnitCostPsw ?? 0,
        urgency: body.urgency ?? 1,
        neededBy: body.neededBy ?? null,
        note: body.note ?? null,
        metadataJson: body.metadataJson ?? null,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        branchId: t.Optional(t.Union([UUID, t.Null()])),
        sourceModule: t.String({ minLength: 1, maxLength: 50 }),
        sourceEntityType: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
        sourceEntityId: t.Optional(t.Union([UUID, t.Null()])),
        dedupeKey: t.Optional(t.Union([t.String({ maxLength: 200 }), t.Null()])),
        itemCode: t.String({ minLength: 1, maxLength: 100 }),
        itemName: t.String({ minLength: 1, maxLength: 255 }),
        unit: t.Optional(t.Union([t.String({ maxLength: 30 }), t.Null()])),
        quantity: t.Number({ minimum: 1 }),
        estimatedUnitCostPsw: t.Optional(t.Number({ minimum: 0 })),
        urgency: t.Optional(t.Number({ minimum: 0, maximum: 3 })),
        neededBy: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        note: t.Optional(t.Union([t.String(), t.Null()])),
        metadataJson: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateProcurementPurchaseRequests),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'Create procurement demand' },
    },
  )
  .post(
    '/demands/from-inventory-low-stock',
    async ({ body, user }) =>
      createProcurementDemandsFromInventoryLowStockCtrl({
        companyId: (user as AuthUser).companyId!,
        requestedByUserId: (user as AuthUser).sub,
        rootLocationId: body.rootLocationId ?? null,
        targetMainStoreLocationId: body.targetMainStoreLocationId ?? null,
        lowStockLimit: body.lowStockLimit ?? 200,
      }),
    {
      body: t.Object({
        rootLocationId: t.Optional(t.Union([UUID, t.Null()])),
        targetMainStoreLocationId: t.Optional(t.Union([UUID, t.Null()])),
        lowStockLimit: t.Optional(t.Number({ minimum: 1, maximum: 500 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateProcurementPurchaseRequests),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'Create demands from inventory low-stock signals' },
    },
  )
  .post(
    '/demands/from-fleet-low-stock',
    async ({ body, user }) =>
      createProcurementDemandsFromFleetLowStockCtrl({
        companyId: (user as AuthUser).companyId!,
        requestedByUserId: (user as AuthUser).sub,
        branchId: body.branchId ?? null,
        limit: body.limit ?? 100,
        replenishMultiplier: body.replenishMultiplier ?? 1,
        usePolicyRules: body.usePolicyRules ?? true,
      }),
    {
      body: t.Object({
        branchId: t.Optional(t.Union([UUID, t.Null()])),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 500 })),
        replenishMultiplier: t.Optional(t.Number({ minimum: 1, maximum: 5 })),
        usePolicyRules: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateProcurementPurchaseRequests),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'Create demands from fleet low-stock candidates' },
    },
  )
  .get(
    '/demands/consolidations',
    async ({ query, user }) =>
      listProcurementDemandConsolidationsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadProcurement),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'List procurement demand consolidations' },
    },
  )
  .post(
    '/demands/consolidations',
    async ({ body, user }) =>
      consolidateProcurementDemandsCtrl({
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        demandIds: body.demandIds,
        sourceRootLocationId: body.sourceRootLocationId ?? null,
        targetMainStoreLocationId: body.targetMainStoreLocationId ?? null,
        note: body.note ?? null,
      }),
    {
      body: t.Object({
        demandIds: t.Array(UUID, { minItems: 1 }),
        sourceRootLocationId: t.Optional(t.Union([UUID, t.Null()])),
        targetMainStoreLocationId: t.Optional(t.Union([UUID, t.Null()])),
        note: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateProcurementPurchaseRequests),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'Consolidate selected procurement demands' },
    },
  )
  .post(
    '/demands/:id/approve',
    async ({ params, user }) =>
      approveProcurementDemandCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        approverUserId: (user as AuthUser).sub,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApproveProcurementPurchaseRequests),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'Approve procurement demand' },
    },
  )
  .post(
    '/demands/:id/reject',
    async ({ params, body, user }) =>
      rejectProcurementDemandCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        approverUserId: (user as AuthUser).sub,
        rejectionReason: body.rejectionReason,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        rejectionReason: NonEmpty255,
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApproveProcurementPurchaseRequests),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'Reject procurement demand' },
    },
  )
  .get(
    '/purchase-requests',
    async ({ query, user }) =>
      listPurchaseRequestsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          search: query.search,
          status: query.status,
          supplierId: query.supplierId,
          pendingOnly: query.pendingOnly ?? undefined,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        status: t.Optional(t.Number()),
        supplierId: t.Optional(UUID),
        pendingOnly: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadProcurement),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'List purchase requests' },
    },
  )
  .post(
    '/demands/convert-to-purchase-requests',
    async ({ body, user }) =>
      convertProcurementDemandsToPurchaseRequestsCtrl({
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        demandIds: body.demandIds,
        supplierId: body.supplierId ?? null,
      }),
    {
      body: t.Object({
        demandIds: t.Array(UUID, { minItems: 1 }),
        supplierId: t.Optional(t.Union([UUID, t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateProcurementPurchaseRequests),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'Convert demands to purchase requests' },
    },
  )
  .get(
    '/supplier-quotes',
    async ({ query, user }) =>
      listProcurementSupplierQuotesCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          demandId: query.demandId,
          supplierId: query.supplierId,
          status: query.status,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        demandId: t.Optional(UUID),
        supplierId: t.Optional(UUID),
        status: t.Optional(t.Number()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadProcurement),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'List supplier quotes' },
    },
  )
  .post(
    '/supplier-quotes',
    async ({ body, set, user }) => {
      const result = await createProcurementSupplierQuoteCtrl({
        companyId: (user as AuthUser).companyId!,
        createdBy: (user as AuthUser).sub,
        demandId: body.demandId,
        supplierId: body.supplierId,
        quantity: body.quantity,
        unitCostPsw: body.unitCostPsw,
        note: body.note ?? null,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        demandId: UUID,
        supplierId: UUID,
        quantity: t.Number({ minimum: 1 }),
        unitCostPsw: t.Number({ minimum: 0 }),
        note: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateProcurementPurchaseRequests),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'Create supplier quote' },
    },
  )
  .post(
    '/supplier-quotes/:id/accept',
    async ({ params, user }) =>
      acceptProcurementSupplierQuoteCtrl({
        companyId: (user as AuthUser).companyId!,
        id: params.id,
        actorUserId: (user as AuthUser).sub,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApproveProcurementPurchaseRequests),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'Accept supplier quote' },
    },
  )
  .get(
    '/purchase-orders',
    async ({ query, user }) =>
      listProcurementPurchaseOrdersCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          supplierId: query.supplierId,
          status: query.status,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        supplierId: t.Optional(UUID),
        status: t.Optional(t.Number()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadProcurement),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'List purchase orders' },
    },
  )
  .post(
    '/purchase-orders/from-accepted-quotes',
    async ({ body, set, user }) => {
      const result = await createProcurementPurchaseOrderFromAcceptedQuotesCtrl({
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        quoteIds: body.quoteIds,
        note: body.note ?? null,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        quoteIds: t.Array(UUID, { minItems: 1 }),
        note: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateProcurementPurchaseRequests),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'Create purchase order from accepted quotes' },
    },
  )
  .get(
    '/goods-receipts',
    async ({ query, user }) =>
      listProcurementGoodsReceiptsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          purchaseOrderId: query.purchaseOrderId,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        purchaseOrderId: t.Optional(UUID),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadProcurement),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'List goods receipts' },
    },
  )
  .post(
    '/goods-receipts',
    async ({ body, set, user }) => {
      const result = await createProcurementGoodsReceiptCtrl({
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        purchaseOrderId: body.purchaseOrderId,
        note: body.note ?? null,
        lines: body.lines.map((line) => ({
          purchaseOrderItemId: line.purchaseOrderItemId,
          receivedQuantity: line.receivedQuantity,
          locationId: line.locationId ?? null,
          batchNumber: line.batchNumber ?? null,
          supplierBatchNumber: line.supplierBatchNumber ?? null,
          manufacturedAt: line.manufacturedAt ? new Date(line.manufacturedAt) : null,
          expiryDate: line.expiryDate ? new Date(line.expiryDate) : null,
        })),
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        purchaseOrderId: UUID,
        note: t.Optional(t.Union([t.String(), t.Null()])),
        lines: t.Array(
          t.Object({
            purchaseOrderItemId: UUID,
            receivedQuantity: t.Number({ minimum: 1 }),
            locationId: t.Optional(t.Union([UUID, t.Null()])),
            batchNumber: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
            supplierBatchNumber: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
            manufacturedAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
            expiryDate: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
          }),
          { minItems: 1 },
        ),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateProcurementPurchaseRequests),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'Create goods receipt for purchase order' },
    },
  )
  .post(
    '/purchase-requests',
    async ({ body, set, user }) => {
      const result = await createPurchaseRequestCtrl({
        companyId: (user as AuthUser).companyId!,
        requestedByUserId: (user as AuthUser).sub,
        branchId: body.branchId ?? null,
        supplierId: body.supplierId ?? null,
        title: body.title,
        description: body.description ?? null,
        amountPsw: body.amountPsw,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        branchId: t.Optional(t.Union([UUID, t.Null()])),
        supplierId: t.Optional(t.Union([UUID, t.Null()])),
        title: NonEmpty255,
        description: t.Optional(t.Union([t.String(), t.Null()])),
        amountPsw: t.Number({ minimum: 0 }),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateProcurementPurchaseRequests),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'Create purchase request' },
    },
  )
  .post(
    '/purchase-requests/:id/approve',
    async ({ params, user }) =>
      approvePurchaseRequestCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        approverUserId: (user as AuthUser).sub,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApproveProcurementPurchaseRequests),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'Approve purchase request' },
    },
  )
  .post(
    '/purchase-requests/:id/reject',
    async ({ params, body, user }) =>
      rejectPurchaseRequestCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        approverUserId: (user as AuthUser).sub,
        rejectionReason: body.rejectionReason,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        rejectionReason: NonEmpty255,
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApproveProcurementPurchaseRequests),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'Reject purchase request' },
    },
  );
