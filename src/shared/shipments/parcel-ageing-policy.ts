export type ParcelAgeingPolicy = {
  storageFeePerDayPsw: number;
  gracePeriodDays: number;
  agedThresholdMonths: number;
};

export const DEFAULT_PARCEL_AGEING_POLICY: ParcelAgeingPolicy = {
  storageFeePerDayPsw: 500,
  gracePeriodDays: 14,
  agedThresholdMonths: 6,
};

function toPositiveInteger(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.floor(parsed);
  return rounded > 0 ? rounded : fallback;
}

export function normalizeParcelAgeingPolicy(input: unknown): ParcelAgeingPolicy {
  const record = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};

  return {
    storageFeePerDayPsw: toPositiveInteger(
      record.storageFeePerDayPsw,
      DEFAULT_PARCEL_AGEING_POLICY.storageFeePerDayPsw,
    ),
    gracePeriodDays: toPositiveInteger(
      record.gracePeriodDays,
      DEFAULT_PARCEL_AGEING_POLICY.gracePeriodDays,
    ),
    agedThresholdMonths: toPositiveInteger(
      record.agedThresholdMonths,
      DEFAULT_PARCEL_AGEING_POLICY.agedThresholdMonths,
    ),
  };
}

export function getParcelAgeingPolicyFromModuleSettings(settings: unknown): ParcelAgeingPolicy {
  const root =
    settings && typeof settings === 'object' ? (settings as Record<string, unknown>) : {};
  return normalizeParcelAgeingPolicy(root.parcelAgeing);
}

export function parcelAgeingPolicyToCedisPerDay(policy: ParcelAgeingPolicy): number {
  return policy.storageFeePerDayPsw / 100;
}
