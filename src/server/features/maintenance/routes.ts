import { MAINTENANCE_SCRIPTS } from '@/shared/maintenance';
import { Elysia, t } from 'elysia';
import { authPlugin, requireAuth, type AuthUser } from '@/server/plugins/auth';
import {
  executeMaintenanceRunSvc,
  getMaintenanceRunsSvc,
  getMaintenanceScriptsSvc,
} from './service';

export const maintenanceRoutes = new Elysia({ name: 'system-maintenance' })
  .use(authPlugin)
  .get('/scripts', ({ user }) => getMaintenanceScriptsSvc(user as AuthUser | null), {
    beforeHandle: requireAuth(),
    detail: { tags: ['Maintenance'], summary: 'List System Admin maintenance scripts' },
  })
  .get('/runs', ({ user }) => getMaintenanceRunsSvc(user as AuthUser | null), {
    beforeHandle: requireAuth(),
    detail: {
      tags: ['Maintenance'],
      summary: 'List recent maintenance runs in the current company',
    },
  })
  .post('/runs', ({ user, body }) => executeMaintenanceRunSvc(user as AuthUser | null, body), {
    beforeHandle: requireAuth(),
    body: t.Object(
      {
        operationId: t.Union(MAINTENANCE_SCRIPTS.map((script) => t.Literal(script.id))),
        params: t.Record(
          t.String({ maxLength: 80 }),
          t.Union([t.String({ maxLength: 255 }), t.Boolean()]),
        ),
        mode: t.Union([t.Literal('preview'), t.Literal('execute')]),
        previewRunId: t.Optional(t.String({ minLength: 1, maxLength: 25 })),
        confirmNoCashReceived: t.Optional(t.Boolean()),
        confirmRepair: t.Optional(t.Boolean()),
      },
      { additionalProperties: false },
    ),
    detail: {
      tags: ['Maintenance'],
      summary: 'Preview or execute a registered System Admin maintenance script',
    },
  });
