import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useListCompanyModulesQuery, useSetCompanyModuleStateMutation } from '../api';
import {
  getParcelAgeingPolicyFromModuleSettings,
  parcelAgeingPolicyToCedisPerDay,
} from '@/shared/shipments/parcel-ageing-policy';

type ParcelAgeingFormState = {
  agedThresholdMonths: string;
  storageFeePerDayCedis: string;
  storageGracePeriodDays: string;
};

const DEFAULT_FORM_STATE: ParcelAgeingFormState = {
  agedThresholdMonths: '6',
  storageFeePerDayCedis: '2',
  storageGracePeriodDays: '14',
};

export function useParcelAgeingSettings() {
  const { data: modules = [], isFetching, refetch } = useListCompanyModulesQuery();
  const [setCompanyModuleState] = useSetCompanyModuleStateMutation();
  const [formState, setFormState] = useState(DEFAULT_FORM_STATE);
  const [isSaving, setIsSaving] = useState(false);
  const shipmentsModule = useMemo(
    () => modules.find((module) => module.code === 'shipments') ?? null,
    [modules],
  );

  useEffect(() => {
    if (!shipmentsModule) return;
    const policy = getParcelAgeingPolicyFromModuleSettings(shipmentsModule.settings);
    setFormState({
      agedThresholdMonths: String(policy.agedThresholdMonths),
      storageFeePerDayCedis: String(parcelAgeingPolicyToCedisPerDay(policy)),
      storageGracePeriodDays: String(policy.gracePeriodDays),
    });
  }, [shipmentsModule]);

  async function saveParcelAgeingPolicy() {
    if (!shipmentsModule) {
      toast.error('Shipments module was not found');
      return;
    }

    const storageFee = Number(formState.storageFeePerDayCedis);
    const graceDays = Number(formState.storageGracePeriodDays);
    const ageMonths = Number(formState.agedThresholdMonths);

    if (!Number.isFinite(storageFee) || storageFee <= 0) {
      toast.error('Storage fee per day must be greater than 0');
      return;
    }
    if (!Number.isFinite(graceDays) || graceDays <= 0) {
      toast.error('Grace period days must be greater than 0');
      return;
    }
    if (!Number.isFinite(ageMonths) || ageMonths <= 0) {
      toast.error('Aging threshold months must be greater than 0');
      return;
    }

    const existingSettings =
      shipmentsModule.settings && typeof shipmentsModule.settings === 'object'
        ? (shipmentsModule.settings as Record<string, unknown>)
        : {};

    try {
      setIsSaving(true);
      await setCompanyModuleState({
        moduleCode: shipmentsModule.code,
        isEnabled: shipmentsModule.isEnabled,
        settings: {
          ...existingSettings,
          parcelAgeing: {
            storageFeePerDayPsw: Math.round(storageFee * 100),
            gracePeriodDays: Math.floor(graceDays),
            agedThresholdMonths: Math.floor(ageMonths),
          },
        },
      }).unwrap();
      toast.success('Parcel ageing policy updated');
      await refetch();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to save parcel ageing policy');
    } finally {
      setIsSaving(false);
    }
  }

  return {
    agedThresholdMonths: formState.agedThresholdMonths,
    isFetching,
    isSaving,
    saveParcelAgeingPolicy,
    setAgedThresholdMonths: (value: string) =>
      setFormState((current) => ({ ...current, agedThresholdMonths: value })),
    setStorageFeePerDayCedis: (value: string) =>
      setFormState((current) => ({ ...current, storageFeePerDayCedis: value })),
    setStorageGracePeriodDays: (value: string) =>
      setFormState((current) => ({ ...current, storageGracePeriodDays: value })),
    shipmentsModule,
    storageFeePerDayCedis: formState.storageFeePerDayCedis,
    storageGracePeriodDays: formState.storageGracePeriodDays,
  };
}
