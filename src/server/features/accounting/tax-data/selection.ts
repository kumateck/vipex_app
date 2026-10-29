import { sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { auditLogs, parcels } from '@/db/schemas';
import { and, eq, inArray } from 'drizzle-orm';
import type { TaxDataConfirmation, TaxDataSelection } from '@/shared/tax-data';
import type { DbExecutor } from '@/server/features/payments/types';
import { BadRequest, Conflict, Forbidden } from '@/server/utils/http-error';
import type { TaxDataScope } from './scope';
import { listTaxDataRowsRepo } from './repository';
import { assertRecordedTaxBalances } from './rows';

export function validateTaxDataSelection(selection: TaxDataSelection[]) {
  if (
    !selection.length ||
    selection.length > 500 ||
    new Set(selection.map((row) => row.parcelId)).size !== selection.length
  )
    throw BadRequest('Select 1 to 500 distinct parcels');
}
export async function loadTaxDataSelection(
  scope: TaxDataScope,
  selection: TaxDataSelection[],
  executor: DbExecutor = db,
) {
  validateTaxDataSelection(selection);
  const rows = await listTaxDataRowsRepo(
    scope,
    { ids: selection.map((row) => row.parcelId) },
    executor,
  );
  if (rows.length !== selection.length)
    throw Forbidden(
      'Some selected parcels are no longer available in your company or branch. Reload the export list.',
    );
  const versions = new Map(selection.map((row) => [row.parcelId, row.version]));
  for (const row of rows) {
    if (versions.get(row.parcelId) !== row.version)
      throw Conflict(
        'Selected parcel data changed. Reload and add the records again before continuing.',
      );
    assertRecordedTaxBalances(row);
  }
  return rows;
}
export async function confirmTaxDataSelection(
  scope: TaxDataScope,
  selection: TaxDataSelection[],
): Promise<TaxDataConfirmation> {
  validateTaxDataSelection(selection);
  return db.transaction(async (tx) => {
    const ids = selection.map((row) => row.parcelId);
    await tx.execute(sql`SELECT id FROM parcels WHERE company_id = ${scope.companyId}
      ${scope.branchId ? sql`AND source_id = ${scope.branchId}` : sql``}
      AND id IN (${sql.join(
        ids.map((id) => sql`${id}`),
        sql`, `,
      )}) ORDER BY id FOR UPDATE`);
    const rows = await loadTaxDataSelection(scope, selection, tx);
    const freshIds = rows.filter((row) => !row.confirmed).map((row) => row.parcelId);
    if (freshIds.length) {
      await tx
        .update(parcels)
        .set({ taxReportConfirmation: true, updatedAt: new Date() })
        .where(and(eq(parcels.companyId, scope.companyId), inArray(parcels.id, freshIds)));
      await tx.insert(auditLogs).values({
        companyId: scope.companyId,
        actorUserId: scope.actorId,
        entityType: 'parcel_tax_data',
        action: 'CONFIRM_PARCEL_TAX_DATA',
        message: 'Selected parcels marked as tax-confirmed',
        metadata: {
          parcelIds: freshIds,
          versions: selection,
          principalPsw: rows.reduce((sum, row) => sum + row.paidPrincipalPsw, 0),
          taxPsw: rows.reduce((sum, row) => sum + row.taxTotalPsw, 0),
        },
      });
    }
    return {
      confirmed: freshIds.length,
      alreadyConfirmed: rows.length - freshIds.length,
      rows: rows.map((row) => ({ ...row, confirmed: true })),
    };
  });
}
