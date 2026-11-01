import { isChargeExemptCustomerType } from '@/shared/customers/customer-types';
import { ParcelStatus } from '@/db/schemas';
import {
  DEFAULT_PARCEL_AGEING_POLICY,
  getParcelAgeingPolicyFromModuleSettings,
  type ParcelAgeingPolicy,
} from '@/shared/shipments/parcel-ageing-policy';
import { findCompanyModuleRepo } from '../../company-modules/repository';
import { STORAGE_DAY_MS } from './helpers';

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export async function getCompanyParcelAgeingPolicy(companyId: string): Promise<ParcelAgeingPolicy> {
  const shipmentsModule = await findCompanyModuleRepo(companyId, 'shipments');
  return shipmentsModule?.settings
    ? getParcelAgeingPolicyFromModuleSettings(shipmentsModule.settings)
    : DEFAULT_PARCEL_AGEING_POLICY;
}

export function computeParcelAgeingSnapshot(input: {
  chargeExemptCustomerType?: number | null;
  status: number;
  receivedAt: Date | null;
  policy: ParcelAgeingPolicy;
  now: Date;
}) {
  const isCollectionStatus =
    input.status === ParcelStatus.AWAITING_PICKUP ||
    input.status === ParcelStatus.HOME_DELIVERY_REQUESTED ||
    input.status === ParcelStatus.AGED_IN_WAREHOUSE;

  if (!isCollectionStatus || !input.receivedAt) {
    return {
      isParcelAgeingEligible: false,
      isParcelAged: false,
      ageingDays: null,
      storageChargeStartAt: null,
      storageChargeDays: 0,
      storageChargePsw: 0,
      storageFeePerDayPsw: isChargeExemptCustomerType(input.chargeExemptCustomerType)
        ? 0
        : input.policy.storageFeePerDayPsw,
      storageChargeGraceDays: input.policy.gracePeriodDays,
      ageingThresholdMonths: input.policy.agedThresholdMonths,
    };
  }

  const ageDays = Math.max(
    0,
    Math.floor((input.now.getTime() - input.receivedAt.getTime()) / STORAGE_DAY_MS),
  );
  const storageChargeStartAt = new Date(
    input.receivedAt.getTime() + input.policy.gracePeriodDays * STORAGE_DAY_MS,
  );
  const chargeDays = isChargeExemptCustomerType(input.chargeExemptCustomerType)
    ? 0
    : Math.max(
        0,
        Math.floor((input.now.getTime() - storageChargeStartAt.getTime()) / STORAGE_DAY_MS),
      );
  const isAged =
    addMonths(input.receivedAt, input.policy.agedThresholdMonths).getTime() <= input.now.getTime();

  return {
    isParcelAgeingEligible: true,
    isParcelAged: isAged,
    ageingDays: ageDays,
    storageChargeStartAt: storageChargeStartAt.toISOString(),
    storageChargeDays: chargeDays,
    storageChargePsw: chargeDays * input.policy.storageFeePerDayPsw,
    storageFeePerDayPsw: isChargeExemptCustomerType(input.chargeExemptCustomerType)
      ? 0
      : input.policy.storageFeePerDayPsw,
    storageChargeGraceDays: input.policy.gracePeriodDays,
    ageingThresholdMonths: input.policy.agedThresholdMonths,
  };
}

export function computeStorageAccrualPsw(input: {
  chargeExemptCustomerType?: number | null;
  status: number;
  receivedAt: Date | null;
  policy: ParcelAgeingPolicy;
  now: Date;
}) {
  const isCollectionStatus =
    input.status === ParcelStatus.AWAITING_PICKUP ||
    input.status === ParcelStatus.HOME_DELIVERY_REQUESTED ||
    input.status === ParcelStatus.AGED_IN_WAREHOUSE;
  if (
    isChargeExemptCustomerType(input.chargeExemptCustomerType) ||
    !isCollectionStatus ||
    !input.receivedAt
  )
    return 0;
  const storageChargeStartAt = new Date(
    input.receivedAt.getTime() + input.policy.gracePeriodDays * STORAGE_DAY_MS,
  );
  const chargeDays = isChargeExemptCustomerType(input.chargeExemptCustomerType)
    ? 0
    : Math.max(
        0,
        Math.floor((input.now.getTime() - storageChargeStartAt.getTime()) / STORAGE_DAY_MS),
      );
  return chargeDays * input.policy.storageFeePerDayPsw;
}
