import type { TaxDataFilters } from '@/shared/tax-data';
import { listTaxDataCountsRepo, listTaxDataRowsRepo } from './repository';
import { summarizeTaxDataCounts } from './rows';
import { validateTaxDataFilters, validateTaxDataPage, type TaxDataScope } from './scope';

export async function getTaxDataCounts(scope: TaxDataScope, query: TaxDataFilters) {
  const filters = validateTaxDataFilters(scope, query);
  return summarizeTaxDataCounts(await listTaxDataCountsRepo(scope, filters), filters);
}
export async function getTaxDataRecords(
  scope: TaxDataScope,
  query: TaxDataFilters,
  page = 1,
  limit = 50,
) {
  const filters = validateTaxDataFilters(scope, query);
  validateTaxDataPage(page, limit);
  const rows = await listTaxDataRowsRepo(scope, { filters, page, limit });
  return { filters, rows: rows.slice(0, limit), page, limit, hasMore: rows.length > limit };
}
