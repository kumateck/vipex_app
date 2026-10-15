import { findCompanyModuleRepo } from '@/server/features/company-modules/repository';

export const DEVICE_VERIFICATION_MODULE = 'device_verification';

export async function isDeviceVerificationRequired(
  companyId: string | null | undefined,
  lookup: (
    companyId: string,
    moduleCode: string,
  ) => Promise<{ isEnabled: boolean } | null> = findCompanyModuleRepo,
) {
  if (!companyId) return false;
  const state = await lookup(companyId, DEVICE_VERIFICATION_MODULE);
  return state?.isEnabled === true;
}
