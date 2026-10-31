import { Elysia, t } from 'elysia';
import { authPlugin, type AuthUser, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { UUID } from '../../../schemas/common';
import {
  approveParcelReconciliationCaseCtrl,
  executeParcelReconciliationCaseCtrl,
  listOpenParcelDiscrepanciesCtrl,
  logParcelDiscrepancyCtrl,
  logParcelStickerPrintCtrl,
  requestParcelReconciliationCaseCtrl,
} from '../parcels.controller';
import { uploadParcelDiscrepancyEvidenceSvc } from '../parcel-discrepancy-evidence.service';
export const routes = new Elysia({ name: 'parcel-reconciliation' })
  .use(authPlugin)
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
  );
