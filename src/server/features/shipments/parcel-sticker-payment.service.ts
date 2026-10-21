import { BranchType, ParcelStatus } from '@/db/schemas/enums';
import type { AuthUser } from '@/server/plugins/auth';
import { NotFound } from '@/server/utils/http-error';
import { PermissionKeys } from '@/shared/permissions/constants';
import { ensureCompanyModuleEnabledSvc } from '../company-modules/service';
import { getStickerPaymentRecord } from './parcel-sticker-payment.repository';
import { verifyStickerPaymentRecord } from './parcel-sticker-payment.rules';

export function canVerifyStickerPayment(
  user: AuthUser,
  parcel: { companyId: string; sourceId: string; destinationId: string },
) {
  return Boolean(
    user.companyId &&
      user.companyId === parcel.companyId &&
      (user.branchType === BranchType.HEADOFFICE ||
        user.permissions?.includes(PermissionKeys.CanReadParcels) ||
        user.branchId === parcel.sourceId ||
        user.branchId === parcel.destinationId),
  );
}

export async function getVerifiedStickerPayment(
  input: { trackingCode: string; bookingCode: string },
  user: AuthUser,
  deps: {
    load: typeof getStickerPaymentRecord;
    ensureModule: (companyId: string, moduleCode: string) => Promise<unknown>;
  } = { load: getStickerPaymentRecord, ensureModule: ensureCompanyModuleEnabledSvc },
) {
  if (!user.companyId) throw NotFound('Parcel not found');
  const record = await deps.load(user.companyId, input.trackingCode, input.bookingCode);
  if (!record || !canVerifyStickerPayment(user, record) || record.status === ParcelStatus.CANCELLED)
    throw NotFound('Parcel not found');
  await deps.ensureModule(user.companyId, 'sticker_print');
  return verifyStickerPaymentRecord(record);
}
