import { BranchType } from '@/db/schemas/enums';
import { PARCEL_STATUS_LABELS } from '@/shared/shipments/parcel-status-labels';
import type { ParcelAnalyticsQuery } from '@/shared/reporting';
import { BadRequest, Forbidden } from '@/server/utils/http-error';
import type { AnalyticsScope } from './types';

const DAY = 86_400_000;
function parseDay(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  )
    throw BadRequest('Invalid analytics date');
  return date;
}

export function resolveParcelAnalyticsScope(
  user: {
    companyId?: string | null;
    branchId?: string | null;
    branchType?: number | null;
  },
  query: ParcelAnalyticsQuery,
): AnalyticsScope {
  if (!user.companyId) throw Forbidden('Authenticated user company context is missing');
  const from = parseDay(query.from);
  const to = parseDay(query.to);
  if (to < from || (to.getTime() - from.getTime()) / DAY >= 366)
    throw BadRequest('Choose a date range of 1 to 366 days');
  if (query.basis !== 'source' && query.basis !== 'destination')
    throw BadRequest('Invalid branch basis');
  if (query.status !== undefined && !(query.status in PARCEL_STATUS_LABELS))
    throw BadRequest('Invalid parcel status');
  const isHeadOffice = user.branchType === BranchType.HEADOFFICE;
  if (!isHeadOffice && !user.branchId)
    throw Forbidden('Authenticated user branch context is missing');
  return {
    ...query,
    companyId: user.companyId,
    lockedBranchId: isHeadOffice ? undefined : user.branchId!,
    branchId: isHeadOffice ? query.branchId : user.branchId!,
  };
}

export function analyticsDateBounds(scope: Pick<AnalyticsScope, 'from' | 'to'>) {
  const from = parseDay(scope.from);
  const until = new Date(parseDay(scope.to).getTime() + DAY);
  const previousFrom = new Date(from.getTime() - (until.getTime() - from.getTime()));
  return { from, until, previousFrom };
}
