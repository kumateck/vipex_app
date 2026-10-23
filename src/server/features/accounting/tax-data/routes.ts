import { Elysia, t } from 'elysia';
import {
  authPlugin,
  requireAuth,
  requireModuleEnabled,
  requirePermissions,
} from '@/server/plugins/auth';
import { UUID } from '@/server/schemas/common';
import { PermissionKeys } from '@/shared/permissions/constants';
import { assertAccountingEnabledSvc } from '../service';
import { resolveTaxDataScope } from './scope';
import { getTaxDataCounts, getTaxDataRecords } from './service';
import { listTaxDataBranchOptionsRepo } from './repository';
import { confirmTaxDataSelection, loadTaxDataSelection } from './selection';
import { buildTaxDataWorkbook } from './workbook';

const filterQuery = {
  date: t.String({ format: 'date' }),
  branchId: t.Optional(UUID),
  destinationBranchId: t.Optional(UUID),
  amountPsw: t.Optional(t.Numeric({ minimum: 1 })),
  maxOccurrences: t.Optional(t.Numeric({ minimum: 1, maximum: 500 })),
  confirmation: t.Union([t.Literal('all'), t.Literal('confirmed'), t.Literal('unconfirmed')]),
};
const selectionBody = t.Object({
  rows: t.Array(t.Object({ parcelId: UUID, version: t.String({ pattern: '^[a-f0-9]{64}$' }) }), {
    minItems: 1,
    maxItems: 500,
  }),
});

export const taxDataRoutes = new Elysia({ name: 'parcel-tax-data' })
  .use(authPlugin)
  .onBeforeHandle(({ user }) => requireAuth()({ user }))
  .onBeforeHandle(({ user }) => requireModuleEnabled('accounting')({ user }))
  .onBeforeHandle(async ({ user }) => {
    const scope = resolveTaxDataScope(user!);
    requirePermissions(PermissionKeys.CanReadAccounting)({ user });
    await assertAccountingEnabledSvc(scope.companyId);
  })
  .get(
    '/tax-data/options',
    ({ user }) => listTaxDataBranchOptionsRepo(resolveTaxDataScope(user!)),
    {
      detail: { tags: ['Accounting'], summary: 'Company-scoped parcel tax-data branch options' },
    },
  )
  .get(
    '/tax-data/counts',
    ({ user, query }) => getTaxDataCounts(resolveTaxDataScope(user!), query),
    {
      query: t.Object(filterQuery),
      detail: { tags: ['Accounting'], summary: 'Count parcel tax records by principal paid' },
    },
  )
  .get(
    '/tax-data/records',
    ({ user, query }) =>
      getTaxDataRecords(resolveTaxDataScope(user!), query, query.page, query.limit),
    {
      query: t.Object({
        ...filterQuery,
        page: t.Optional(t.Numeric({ minimum: 1, maximum: 10000 })),
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
      }),
      detail: { tags: ['Accounting'], summary: 'Load recorded parcel tax data' },
    },
  )
  .post(
    '/tax-data/export',
    async ({ user, body }) => {
      const rows = await loadTaxDataSelection(resolveTaxDataScope(user!), body.rows);
      return new Response(new Uint8Array(buildTaxDataWorkbook(rows)), {
        headers: {
          'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'content-disposition': `attachment; filename="parcel-tax-data-${new Date().toISOString().slice(0, 10)}.xlsx"`,
          'cache-control': 'no-store',
        },
      });
    },
    {
      body: selectionBody,
      detail: {
        tags: ['Accounting'],
        summary: 'Export validated selected parcel tax records to Excel',
      },
    },
  )
  .post(
    '/tax-data/confirm',
    ({ user, body }) => confirmTaxDataSelection(resolveTaxDataScope(user!), body.rows),
    {
      body: selectionBody,
      beforeHandle: requirePermissions(PermissionKeys.CanConfirmParcelTaxData),
      detail: {
        tags: ['Accounting'],
        summary: 'Confirm selected parcel tax-data flags atomically',
      },
    },
  );
