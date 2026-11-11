import { Elysia, t } from 'elysia';
import { authPlugin, requireAnyPermissions, requirePermissions } from '@/server/plugins/auth';
import { UUID } from '@/server/schemas/common';
import { PermissionKeys } from '@/shared/permissions/constants';
import { MAX_PARCEL_HANDOVER_NOTE_LENGTH } from '@/shared/shipments/parcel-handover-note';
import { getParcelHandoverNote, saveParcelHandoverNote } from './service';

const canReadNote = requireAnyPermissions(
  PermissionKeys.CanReadParcels,
  PermissionKeys.CanReadParcelIncoming,
  PermissionKeys.CanReadConsignments,
  PermissionKeys.CanReadParcelScan,
  PermissionKeys.CanReadCallCenterAssignment,
  PermissionKeys.CanReadCallCenterParcelStatus,
  PermissionKeys.CanMarkDoorstepCalled,
  PermissionKeys.CanReadShelfPickerUpdate,
  PermissionKeys.CanCreatePickupQueue,
  PermissionKeys.CanReadReceiverPickupQueue,
  PermissionKeys.CanReadSenderPickupQueue,
  PermissionKeys.CanCompleteOfficePickup,
  PermissionKeys.CanCreateReceiverPayments,
  PermissionKeys.CanUpdateParcelHandoverNote,
);
const params = t.Object({ id: UUID });

export const parcelHandoverNoteRoutes = new Elysia({ name: 'parcel-handover-note' })
  .use(authPlugin)
  .get(
    '/:id/handover-note',
    async ({ params, user, set }) => {
      set.headers['cache-control'] = 'no-store';
      return getParcelHandoverNote(params.id, user!);
    },
    {
      params,
      beforeHandle: canReadNote,
      detail: { tags: ['Shipments'], summary: 'Read the parcel handover note' },
    },
  )
  .patch(
    '/:id/handover-note',
    ({ params, user, body }) => saveParcelHandoverNote({ ...body, id: params.id, user: user! }),
    {
      params,
      body: t.Object({
        note: t.String({ minLength: 1, maxLength: MAX_PARCEL_HANDOVER_NOTE_LENGTH }),
        expectedNote: t.Union([t.String({ maxLength: MAX_PARCEL_HANDOVER_NOTE_LENGTH }), t.Null()]),
      }),
      beforeHandle: requirePermissions(PermissionKeys.CanUpdateParcelHandoverNote),
      detail: {
        tags: ['Shipments'],
        summary: 'Add or edit a parcel handover note before delivery',
      },
    },
  );
