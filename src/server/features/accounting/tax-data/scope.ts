import { BranchType } from '@/db/schemas/enums';
import type { TaxDataFilters } from '@/shared/tax-data';
import { BadRequest, Forbidden } from '@/server/utils/http-error';

export type TaxDataActor = {
  companyId?: string | null;
  branchId?: string | null;
  branchType?: number | null;
  sub: string;
};
export type TaxDataScope = {
  companyId: string;
  branchId?: string;
  actorId: string;
  isHeadOffice: boolean;
};
export function resolveTaxDataScope(user: TaxDataActor): TaxDataScope {
  if (!user.companyId) throw Forbidden('Authenticated user company context is missing');
  const isHeadOffice = user.branchType === BranchType.HEADOFFICE;
  if (!isHeadOffice && !user.branchId)
    throw Forbidden('Authenticated user branch context is missing');
  return {
    companyId: user.companyId,
    branchId: isHeadOffice ? undefined : user.branchId!,
    actorId: user.sub,
    isHeadOffice,
  };
}
export function validateTaxDataFilters(scope: TaxDataScope, query: TaxDataFilters): TaxDataFilters {
  const date = new Date(`${query.date}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(query.date) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== query.date
  )
    throw BadRequest('Invalid booking date');
  if (!['all', 'confirmed', 'unconfirmed'].includes(query.confirmation))
    throw BadRequest('Invalid tax confirmation filter');
  if (
    query.amountPsw !== undefined &&
    (!Number.isSafeInteger(query.amountPsw) || query.amountPsw < 1)
  )
    throw BadRequest('Paid amount must be a positive whole number of pesewas');
  if (
    query.maxOccurrences !== undefined &&
    (!Number.isInteger(query.maxOccurrences) ||
      query.maxOccurrences < 1 ||
      query.maxOccurrences > 500)
  )
    throw BadRequest('Maximum occurrences must be a whole number from 1 to 500');
  return { ...query, branchId: scope.isHeadOffice ? query.branchId : scope.branchId };
}
export function validateTaxDataPage(page: number, limit: number) {
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    page > 10000 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  )
    throw BadRequest('Invalid tax data pagination');
}
