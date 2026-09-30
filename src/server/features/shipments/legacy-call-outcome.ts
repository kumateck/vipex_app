import { ParcelStatus } from '@/db/schemas/enums';

export function legacyCallOutcomeFromParcelPatch(
  patch: Record<string, unknown>,
): 'pickup' | 'delivery' | null {
  const keys = Object.keys(patch);
  if (
    keys.length !== 2 ||
    !Object.hasOwn(patch, 'status') ||
    !Object.hasOwn(patch, 'secondReceiverId')
  ) {
    return null;
  }
  if (patch.status === ParcelStatus.AWAITING_PICKUP) return 'pickup';
  if (patch.status === ParcelStatus.HOME_DELIVERY_REQUESTED) return 'delivery';
  return null;
}
