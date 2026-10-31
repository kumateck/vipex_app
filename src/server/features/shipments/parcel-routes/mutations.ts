import { Elysia, t } from 'elysia';
import {
  authPlugin,
  type AuthUser,
  requireAnyPermissions,
  requireAuth,
  requirePermissions,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { HttpStatus } from '../../../utils/http-status';
import { UUID } from '../../../schemas/common';
import { createParcelCtrl, updateParcelCtrl } from '../parcels.controller';
import { recordCallCenterContactSvc } from '../parcel-call-center-contact.service';
import { legacyCallOutcomeFromParcelPatch } from '../legacy-call-outcome';
import { ParcelStatus } from '@/db/schemas/enums';
export const routes = new Elysia({ name: 'parcel-mutations' })
  .use(authPlugin)
  .post(
    '/',
    async ({ body, set }) => {
      const res = await createParcelCtrl(
        body as {
          companyId: string;
          sourceId: string;
          destinationId: string;
          pickupLocationId?: string | null;
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
        pickupLocationId: t.Optional(t.Union([UUID, t.Null()])),
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
    async ({ params, body, user }) => {
      const authUser = user as AuthUser;
      if (body.status === ParcelStatus.ARRIVED_AT_DESTINATION)
        requireAnyPermissions(
          PermissionKeys.CanReadParcelIncoming,
          PermissionKeys.CanReadParcelScan,
        )({ user: authUser });
      const legacyOutcome = legacyCallOutcomeFromParcelPatch(body);
      if (legacyOutcome) {
        requirePermissions(PermissionKeys.CanReadCallCenterParcelStatus)({ user: authUser });
        return recordCallCenterContactSvc({
          parcelId: params.id,
          companyId: authUser.companyId ?? '',
          branchId: authUser.branchId ?? '',
          locationId: authUser.locationId,
          actorUserId: authUser.sub,
          outcome: legacyOutcome,
          secondReceiverId: body.secondReceiverId,
        });
      }
      return updateParcelCtrl(
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
        authUser.sub,
      );
    },
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
  );
