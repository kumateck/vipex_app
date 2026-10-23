import { Elysia, t } from 'elysia';
import { authPlugin, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { UUID } from '@/server/schemas/common';
import { PermissionKeys } from '@/shared/permissions/constants';
import { resolveParcelAnalyticsScope } from './scope';
import { getParcelAnalyticsReport } from './service';
import { getParcelAnalyticsDetails } from './details';

const query = {
  from: t.String({ format: 'date' }),
  to: t.String({ format: 'date' }),
  basis: t.Union([t.Literal('source'), t.Literal('destination')]),
  branchId: t.Optional(UUID),
  sourceId: t.Optional(UUID),
  destinationId: t.Optional(UUID),
  status: t.Optional(t.Numeric({ minimum: 0, maximum: 20 })),
};
const beforeHandle = [
  requireAuth(),
  requirePermissions(PermissionKeys.CanViewReportParcelsStatusSummary),
];

export const parcelAnalyticsRoutes = new Elysia({ name: 'parcel-analytics' })
  .use(authPlugin)
  .get(
    '/parcel-analytics',
    ({ user, query }) => getParcelAnalyticsReport(resolveParcelAnalyticsScope(user!, query)),
    {
      query: t.Object(query),
      beforeHandle,
      detail: {
        tags: ['Reporting'],
        summary: 'Global, branch and current-status parcel analytics',
        operationId: 'getParcelAnalytics',
      },
    },
  )
  .get(
    '/parcel-analytics/details',
    ({ user, query }) =>
      getParcelAnalyticsDetails(resolveParcelAnalyticsScope(user!, query), query.page),
    {
      query: t.Object({ ...query, page: t.Optional(t.Numeric({ minimum: 1, maximum: 10000 })) }),
      beforeHandle,
      detail: {
        tags: ['Reporting'],
        summary: 'Paginated parcel analytics drill-down',
        operationId: 'getParcelAnalyticsDetails',
      },
    },
  );
