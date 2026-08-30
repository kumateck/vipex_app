import { Elysia, t } from 'elysia';
import {
  authPlugin,
  type AuthUser,
  requireAnyPermissions,
  requireAuth,
  requirePermissions,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { MAX_BULK_ARRIVAL_PARCELS } from '@/shared/shipments/bulk-arrival';
import { HttpStatus } from '../../utils/http-status';
import { UUID } from '../../schemas/common';
import {
  approveParcelReconciliationCaseCtrl,
  createParcelCtrl,
  executeParcelReconciliationCaseCtrl,
  getParcelByIdCtrl,
  getParcelDetailsCtrl,
  listEligibleParcelCorrectionSessionsCtrl,
  listParcelReconciliationCasesCtrl,
  listParcelDispositionActionsCtrl,
  listOpenParcelDiscrepanciesCtrl,
  listParcelsCtrl,
  logParcelDiscrepancyCtrl,
  logParcelStickerPrintCtrl,
  markParcelReceivedCtrl,
  markIncomingParcelsArrivedCtrl,
  recordParcelDispositionActionCtrl,
  waiveParcelStorageAccrualCtrl,
  requestParcelReconciliationCaseCtrl,
  resolveParcelDiscrepancyCtrl,
  setPlannedToBePaidCtrl,
  softDeleteParcelCtrl,
  updateParcelCtrl,
} from './parcels.controller';
import { resolveParcelSort } from './parcel-sort';
import { uploadParcelDiscrepancyEvidenceSvc } from './parcel-discrepancy-evidence.service';

function parseStatuses(value: string | number[] | undefined): number[] | null {
  if (Array.isArray(value)) {
    const parsed = value.map((entry) => Number(entry)).filter((entry) => Number.isFinite(entry));
    return parsed.length ? parsed : null;
  }

  if (typeof value === 'string') {
    const parsed = value
      .split(',')
      .map((entry) => Number(entry.trim()))
      .filter((entry) => Number.isFinite(entry));
    return parsed.length ? parsed : null;
  }

  return null;
}

export const parcelsRoutes = new Elysia({ name: 'parcels' })
  .use(authPlugin)
  .get(
    '/',
    async ({ query }) =>
      listParcelsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: resolveParcelSort(query.sort, query.createdAtOrder),
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: query.companyId ?? null,
          sourceId: query.sourceId ?? null,
          destinationId: query.destinationId ?? null,
          locationId: query.locationId ?? null,
          status: query.status ?? null,
          statuses: parseStatuses(query.statuses),
          senderPaid: query.senderPaid ?? null,
          hasPickupQueue: query.hasPickupQueue ?? null,
          agedOnly: query.agedOnly ?? null,
          storageChargeAccruing: query.storageChargeAccruing ?? null,
          received: query.received ?? null,
          includeDeleted: query.includeDeleted ?? null,
        },
      }),
    {
      query: t.Object({
        page: t.Optional(t.Number({ minimum: 1 })),
        pageSize: t.Optional(t.Number({ minimum: 1, maximum: 200 })),
        search: t.Optional(t.String()),
        sort: t.Optional(
          t.Array(
            t.Object({
              field: t.String({ minLength: 1, maxLength: 100 }),
              direction: t.Union([t.Literal('asc'), t.Literal('desc')]),
            }),
            { minItems: 1 },
          ),
        ),
        createdAtOrder: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')])),
        dateFrom: t.Optional(t.String({ format: 'date-time' })),
        dateTo: t.Optional(t.String({ format: 'date-time' })),
        companyId: t.Optional(UUID),
        sourceId: t.Optional(UUID),
        destinationId: t.Optional(UUID),
        locationId: t.Optional(UUID),
        status: t.Optional(t.Number()),
        statuses: t.Optional(t.Union([t.Array(t.Number()), t.String()])),
        senderPaid: t.Optional(t.Boolean()),
        hasPickupQueue: t.Optional(t.Boolean()),
        agedOnly: t.Optional(t.Boolean()),
        storageChargeAccruing: t.Optional(t.Boolean()),
        received: t.Optional(t.Boolean()),
        includeDeleted: t.Optional(t.Boolean()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadParcels)],
      detail: { tags: ['Shipments'], summary: 'List/search parcels' },
    },
  )
  .get(
    '/reconciliation-cases',
    async ({ query, user }) => {
      const authUser = user as AuthUser;
      return listParcelReconciliationCasesCtrl({
        companyId: query.companyId ?? authUser.companyId ?? '',
        statuses: parseStatuses(query.statuses),
        branchId: query.branchId ?? authUser.branchId ?? null,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 20,
        search: query.search ?? null,
      });
    },
    {
      query: t.Object({
        companyId: t.Optional(UUID),
        branchId: t.Optional(t.Union([UUID, t.Null()])),
        statuses: t.Optional(t.Union([t.Array(t.Number()), t.String()])),
        page: t.Optional(t.Number({ minimum: 1 })),
        pageSize: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        search: t.Optional(t.String()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadParcelReconciliation)],
      detail: { tags: ['Shipments'], summary: 'List parcel reconciliation cases' },
    },
  )
  .get(
    '/reconciliation-cases/eligible-sessions/:parcelId',
    async ({ params, user }) =>
      listEligibleParcelCorrectionSessionsCtrl({
        companyId: (user as AuthUser).companyId ?? '',
        parcelId: params.parcelId,
      }),
    {
      params: t.Object({ parcelId: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanRequestParcelReconciliation),
      ],
      detail: { tags: ['Shipments'], summary: 'List eligible original cashier sessions' },
    },
  )
  .get('/:id', async ({ params }) => getParcelByIdCtrl(params.id), {
    params: t.Object({ id: UUID }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadParcels)],
    detail: { tags: ['Shipments'], summary: 'Get parcel' },
  })
  .get('/:id/details', async ({ params }) => getParcelDetailsCtrl(params.id), {
    params: t.Object({ id: UUID }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadParcels)],
    detail: {
      tags: ['Shipments'],
      summary: 'Get parcel full details (payments, delivery, consignments)',
    },
  })
  .get(
    '/:id/disposition-actions',
    async ({ params }) => listParcelDispositionActionsCtrl(params.id),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadParcels)],
      detail: { tags: ['Shipments'], summary: 'List parcel disposition actions' },
    },
  )
  .post(
    '/:id/disposition-actions',
    async ({ params, body, user }) =>
      recordParcelDispositionActionCtrl({
        parcelId: params.id,
        actorUserId: (user as AuthUser).sub,
        actionType: (body as { actionType: number }).actionType,
        notes: (body as { notes?: string | null }).notes ?? null,
        warehouseId: (body as { warehouseId?: string | null }).warehouseId ?? null,
        recoveredAmountCedis:
          (body as { recoveredAmountCedis?: number | string | null }).recoveredAmountCedis ?? null,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        actionType: t.Number(),
        notes: t.Optional(t.Union([t.String({ maxLength: 1000 }), t.Null()])),
        warehouseId: t.Optional(t.Union([UUID, t.Null()])),
        recoveredAmountCedis: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateParcels)],
      detail: { tags: ['Shipments'], summary: 'Record parcel disposition action' },
    },
  )
  .post(
    '/:id/storage-waivers',
    async ({ params, body, user }) =>
      waiveParcelStorageAccrualCtrl({
        parcelId: params.id,
        actorUserId: (user as AuthUser).sub,
        reason: (body as { reason: string }).reason,
        waivedAmountCedis:
          (body as { waivedAmountCedis?: number | string | null }).waivedAmountCedis ?? null,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        reason: t.String({ minLength: 3, maxLength: 1000 }),
        waivedAmountCedis: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanWaiveParcelStorageAccrual),
      ],
      detail: { tags: ['Shipments'], summary: 'Waive parcel storage accrual with reason' },
    },
  )
  .post(
    '/',
    async ({ body, set }) => {
      const res = await createParcelCtrl(
        body as {
          companyId: string;
          sourceId: string;
          destinationId: string;
          bookingId: string;
          bookingCode: string;
          trackingCode: string;
          senderId: string;
          receiverId: string;
          status: number;
          parcelDetails: string;
          parcelContent: string;
          parcelValueCedis?: number | string | null;
          chargeCedis?: number | string | null;
          plannedToBePaidCedis?: number | string | null;
          method: number;
          createdBy?: string | null;
          cashierSessionId?: string | null;
        },
      );
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        companyId: UUID,
        sourceId: UUID,
        destinationId: UUID,
        bookingId: UUID,
        bookingCode: t.String(),
        trackingCode: t.String(),
        senderId: UUID,
        receiverId: UUID,
        status: t.Number(),
        parcelDetails: t.String({ minLength: 1, maxLength: 255 }),
        parcelContent: t.String({ minLength: 1, maxLength: 255 }),
        parcelValueCedis: t.Optional(t.Union([t.Number(), t.String()])),
        chargeCedis: t.Optional(t.Union([t.Number(), t.String()])),
        plannedToBePaidCedis: t.Optional(t.Union([t.Number(), t.String()])),
        method: t.Number(),
        createdBy: t.Optional(UUID),
        cashierSessionId: t.Optional(UUID),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCreateParcels)],
      detail: { tags: ['Shipments'], summary: 'Create parcel' },
    },
  )
  .patch(
    '/:id',
    async ({ params, body, user }) =>
      updateParcelCtrl(
        params.id,
        body as {
          status?: number;
          destinationId?: string;
          sourceLocationId?: string | null;
          parcelDetails?: string;
          parcelContent?: string;
          secondReceiverId?: string | null;
          cardId?: string | null;
          cardNumber?: string | null;
          secondCardId?: string | null;
          secondCardNumber?: string | null;
          confirmedBy?: string | null;
          confirmedAt?: string | null;
          parcelValueCedis?: number | string | null;
          chargeCedis?: number | string | null;
          pickupLocationId?: string | null;
          method?: number;
          taxReportConfirmation?: boolean;
          receiverOtpVerificationToken?: string;
          receiverOtpTarget?: 'main' | 'second';
        },
        (user as AuthUser | null)?.sub ?? null,
      ),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        status: t.Optional(t.Number()),
        destinationId: t.Optional(UUID),
        sourceLocationId: t.Optional(t.Union([UUID, t.Null()])),
        parcelDetails: t.Optional(t.String()),
        parcelContent: t.Optional(t.String()),
        secondReceiverId: t.Optional(t.Union([UUID, t.Null()])),
        cardId: t.Optional(t.Union([UUID, t.Null()])),
        cardNumber: t.Optional(t.Union([t.String(), t.Null()])),
        secondCardId: t.Optional(t.Union([UUID, t.Null()])),
        secondCardNumber: t.Optional(t.Union([t.String(), t.Null()])),
        confirmedBy: t.Optional(t.Union([UUID, t.Null()])),
        confirmedAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        parcelValueCedis: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
        chargeCedis: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
        pickupLocationId: t.Optional(t.Union([UUID, t.Null()])),
        method: t.Optional(t.Number()),
        taxReportConfirmation: t.Optional(t.Boolean()),
        receiverOtpVerificationToken: t.Optional(t.String({ minLength: 1 })),
        receiverOtpTarget: t.Optional(t.Union([t.Literal('main'), t.Literal('second')])),
      }),
      beforeHandle: [
        requireAuth(),
        // This single endpoint is reused by several distinct status-transition workflows
        // (call outcomes, office pickup, scan-to-receive, doorstep address collection,
        // in-transit-incoming edits) that each gate their own page with a different
        // permission today. Accept any of them here so existing flows keep working while
        // closing the previously-total lack of enforcement. TODO: split into dedicated
        // per-transition endpoints (matching the /deliveries/dd/* pattern) for real
        // per-action granularity instead of this broad allow-list.
        requireAnyPermissions(
          PermissionKeys.CanUpdateParcels,
          PermissionKeys.CanReadCallCenterParcelStatus,
          PermissionKeys.CanCompleteOfficePickup,
          PermissionKeys.CanReadParcelScan,
          PermissionKeys.CanMarkDoorstepCalled,
          PermissionKeys.CanReadParcelIncoming,
        ),
      ],
      detail: { tags: ['Shipments'], summary: 'Update parcel' },
    },
  )
  .post(
    '/reconciliation-cases/request',
    async ({ body, user }) => {
      const authUser = user as AuthUser;
      return requestParcelReconciliationCaseCtrl({
        companyId: authUser.companyId ?? '',
        actorUserId: authUser.sub,
        parcelId: (body as { parcelId: string }).parcelId,
        linkedParcelId: (body as { linkedParcelId?: string | null }).linkedParcelId ?? null,
        caseType: (body as { caseType: number }).caseType,
        notes: (body as { notes: string }).notes,
        evidenceUrl: (body as { evidenceUrl?: string | null }).evidenceUrl ?? null,
        actionType: (body as { actionType?: number | null }).actionType ?? null,
        cashierSessionId: (body as { cashierSessionId?: string | null }).cashierSessionId ?? null,
        correctedChargeCedis:
          (body as { correctedChargeCedis?: number | string | null }).correctedChargeCedis ?? null,
        correctedPlannedToBePaidCedis:
          (
            body as {
              correctedPlannedToBePaidCedis?: number | string | null;
            }
          ).correctedPlannedToBePaidCedis ?? null,
      });
    },
    {
      body: t.Object({
        parcelId: UUID,
        linkedParcelId: t.Optional(t.Union([UUID, t.Null()])),
        caseType: t.Number(),
        actionType: t.Optional(t.Union([t.Number(), t.Null()])),
        cashierSessionId: t.Optional(t.Union([UUID, t.Null()])),
        correctedChargeCedis: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
        correctedPlannedToBePaidCedis: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
        notes: t.String({ minLength: 3, maxLength: 1000 }),
        evidenceUrl: t.Optional(t.Union([t.String({ maxLength: 1000 }), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanRequestParcelReconciliation),
      ],
      detail: { tags: ['Shipments'], summary: 'Request parcel reconciliation case' },
    },
  )
  .post(
    '/reconciliation-cases/:id/approve',
    async ({ params, body, user }) => {
      const authUser = user as AuthUser;
      return approveParcelReconciliationCaseCtrl({
        caseId: params.id,
        companyId: authUser.companyId ?? '',
        actorUserId: authUser.sub,
        actionType: (body as { actionType: number }).actionType,
        resolutionNote: (body as { resolutionNote?: string | null }).resolutionNote ?? null,
      });
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        actionType: t.Number(),
        resolutionNote: t.Optional(t.Union([t.String({ maxLength: 1000 }), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApproveParcelReconciliation),
      ],
      detail: { tags: ['Shipments'], summary: 'Approve parcel reconciliation case' },
    },
  )
  .post(
    '/reconciliation-cases/:id/execute',
    async ({ params, body, user }) => {
      const authUser = user as AuthUser;
      return executeParcelReconciliationCaseCtrl({
        caseId: params.id,
        companyId: authUser.companyId ?? '',
        actorUserId: authUser.sub,
        executionNote: (body as { executionNote?: string | null }).executionNote ?? null,
      });
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        executionNote: t.Optional(t.Union([t.String({ maxLength: 1000 }), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanExecuteParcelReconciliation),
      ],
      detail: { tags: ['Shipments'], summary: 'Execute parcel reconciliation case' },
    },
  )
  .post(
    '/discrepancies',
    async ({ body }) =>
      logParcelDiscrepancyCtrl(
        body as {
          companyId: string;
          actorUserId?: string | null;
          parcelId?: string | null;
          trackingCode?: string | null;
          bookingCode?: string | null;
          discrepancyType: 'record_not_physical' | 'physical_missing_in_system';
          notes?: string | null;
          branchId?: string | null;
        },
      ),
    {
      body: t.Object({
        companyId: UUID,
        actorUserId: t.Optional(t.Union([UUID, t.Null()])),
        parcelId: t.Optional(t.Union([UUID, t.Null()])),
        trackingCode: t.Optional(t.Union([t.String(), t.Null()])),
        bookingCode: t.Optional(t.Union([t.String(), t.Null()])),
        discrepancyType: t.Union([
          t.Literal('record_not_physical'),
          t.Literal('physical_missing_in_system'),
        ]),
        notes: t.Optional(t.Union([t.String({ maxLength: 1000 }), t.Null()])),
        branchId: t.Optional(t.Union([UUID, t.Null()])),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadParcelIncoming)],
      detail: { tags: ['Shipments'], summary: 'Log parcel discrepancy for incoming transit' },
    },
  )
  .post(
    '/sticker-prints',
    async ({ body, user }) => {
      const authUser = user as AuthUser;
      return logParcelStickerPrintCtrl({
        companyId: authUser.companyId ?? '',
        branchId: authUser.branchId ?? null,
        printedBy: authUser.sub,
        bookingCode: body.bookingCode,
        trackingCode: body.trackingCode,
        copies: body.copies,
      });
    },
    {
      body: t.Object({
        bookingCode: t.String(),
        trackingCode: t.String(),
        copies: t.Optional(t.Number()),
      }),
      beforeHandle: [requireAuth()],
      detail: { tags: ['Shipments'], summary: 'Log a parcel sticker print event' },
    },
  )
  .get(
    '/discrepancies/open',
    async ({ query, user }) => {
      const authUser = user as AuthUser;
      return listOpenParcelDiscrepanciesCtrl({
        companyId: query.companyId ?? authUser.companyId ?? '',
        branchId: query.branchId ?? authUser.branchId ?? null,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 20,
        search: query.search ?? null,
      });
    },
    {
      query: t.Object({
        companyId: t.Optional(UUID),
        branchId: t.Optional(t.Union([UUID, t.Null()])),
        page: t.Optional(t.Number({ minimum: 1 })),
        pageSize: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        search: t.Optional(t.String()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadParcelIncoming)],
      detail: { tags: ['Shipments'], summary: 'List open parcel discrepancies' },
    },
  )
  .post(
    '/discrepancies/:id/evidence',
    async ({ params, body, user }) => {
      const authUser = user as AuthUser;
      return uploadParcelDiscrepancyEvidenceSvc({
        discrepancyId: params.id,
        companyId: authUser.companyId ?? '',
        actorUserId: authUser.sub,
        fileName: body.fileName,
        dataUrl: body.dataUrl,
      });
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        fileName: t.String({ minLength: 1, maxLength: 255 }),
        dataUrl: t.String({ minLength: 20 }),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadParcelIncoming)],
      detail: { tags: ['Shipments'], summary: 'Upload photo evidence for a parcel discrepancy' },
    },
  )
  .post(
    '/discrepancies/:id/resolve',
    async ({ params, body, user }) => {
      const authUser = user as AuthUser;
      return resolveParcelDiscrepancyCtrl({
        id: params.id,
        companyId: authUser.companyId ?? '',
        actorUserId: authUser.sub,
        resolutionNote: (body as { resolutionNote?: string | null }).resolutionNote ?? null,
      });
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        resolutionNote: t.Optional(t.Union([t.String({ maxLength: 1000 }), t.Null()])),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadParcelIncoming)],
      detail: { tags: ['Shipments'], summary: 'Resolve parcel discrepancy' },
    },
  )
  .post(
    '/bulk-mark-received',
    async ({ body, user }) => {
      const authUser = user as AuthUser;
      return markIncomingParcelsArrivedCtrl({
        parcelIds: body.parcelIds,
        companyId: authUser.companyId ?? '',
        branchId: authUser.branchId ?? '',
        actorUserId: authUser.sub,
      });
    },
    {
      body: t.Object({
        parcelIds: t.Array(UUID, {
          minItems: 1,
          maxItems: MAX_BULK_ARRIVAL_PARCELS,
          uniqueItems: true,
        }),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadParcelIncoming)],
      detail: { tags: ['Shipments'], summary: 'Mark incoming parcels received in bulk' },
    },
  )
  .post(
    '/:id/mark-received',
    async ({ params, body }) =>
      markParcelReceivedCtrl(
        params.id,
        body as { receivedBy: string; receivedAt?: string; status?: number },
      ),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        receivedBy: UUID,
        receivedAt: t.Optional(t.String({ format: 'date-time' })),
        status: t.Optional(t.Number()),
      }),
      beforeHandle: [
        requireAuth(),
        requireAnyPermissions(
          PermissionKeys.CanReadParcelIncoming,
          PermissionKeys.CanReadParcelScan,
        ),
      ],
      detail: { tags: ['Shipments'], summary: 'Mark parcel received' },
    },
  )
  .post(
    '/:id/planned-tobepaid',
    async ({ params, body }) =>
      setPlannedToBePaidCtrl(
        params.id,
        (body as { plannedToBePaidCedis: number | string }).plannedToBePaidCedis,
      ),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ plannedToBePaidCedis: t.Union([t.Number(), t.String()]) }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateParcels)],
      detail: { tags: ['Shipments'], summary: 'Set planned to-be-paid (principal)' },
    },
  )
  .post(
    '/:id/soft-delete',
    async ({ params, body, user }) => {
      const authUser = user as AuthUser;
      return softDeleteParcelCtrl({
        parcelId: params.id,
        actorUserId: authUser.sub,
        reason: (body as { reason: string }).reason,
      });
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        reason: t.String({ minLength: 3, maxLength: 500 }),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanSoftDeleteParcelsAndPayments),
      ],
      detail: {
        tags: ['Shipments'],
        summary: 'Soft delete parcel and soft-delete (void) associated payments with reason',
      },
    },
  );
