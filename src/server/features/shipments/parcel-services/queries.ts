import { db } from '@/db/config';
import { NotFound } from '../../../utils/http-error';
import {
  DEFAULT_PARCEL_AGEING_POLICY,
  type ParcelAgeingPolicy,
} from '@/shared/shipments/parcel-ageing-policy';
import {
  getParcelRepo,
  listParcelsRepo,
  listStuckParcelsRepo,
  type ListParcelsParams,
  type ListStuckParcelsParams,
  type ParcelRow,
} from '../parcels.repository';
import { type DbExecutor } from './helpers';
import { getCompanyParcelAgeingPolicy, computeParcelAgeingSnapshot } from './ageing';

export async function listParcelsSvc(p: ListParcelsParams) {
  const policyCompanyId =
    p.companyId && (p.agedOnly || p.storageChargeAccruing || p.cashierCollectionRequired != null)
      ? p.companyId
      : null;
  const policy = policyCompanyId
    ? await getCompanyParcelAgeingPolicy(policyCompanyId)
    : DEFAULT_PARCEL_AGEING_POLICY;

  const { data, totalRecords } = await listParcelsRepo({
    ...p,
    ageThresholdMonths: p.ageThresholdMonths ?? policy.agedThresholdMonths,
    storageGraceDays: p.storageGraceDays ?? policy.gracePeriodDays,
    storageFeePerDayPsw: p.storageFeePerDayPsw ?? policy.storageFeePerDayPsw,
  });

  const now = new Date();
  const companyIds = [...new Set(data.map((row) => row.companyId).filter(Boolean))];
  // Reuse the policy already loaded for the filtered company instead of a second round trip.
  const policyByCompany = new Map<string, ParcelAgeingPolicy>(
    policyCompanyId ? [[policyCompanyId, policy]] : [],
  );

  await Promise.all(
    companyIds
      .filter((companyId) => !policyByCompany.has(companyId))
      .map(async (companyId) => {
        policyByCompany.set(companyId, await getCompanyParcelAgeingPolicy(companyId));
      }),
  );

  return {
    data: data.map((row) => {
      const rowPolicy = policyByCompany.get(row.companyId) ?? DEFAULT_PARCEL_AGEING_POLICY;
      return {
        ...row,
        ...computeParcelAgeingSnapshot({
          chargeExemptCustomerType: row.chargeExemptCustomerType,
          status: row.status,
          receivedAt: row.receivedAt,
          policy: rowPolicy,
          now,
        }),
      };
    }),
    totalRecords,
  };
}

export async function listStuckParcelsSvc(p: ListStuckParcelsParams) {
  return listStuckParcelsRepo(p);
}

export async function getParcelSvc(id: string, executor: DbExecutor = db): Promise<ParcelRow> {
  const row = await getParcelRepo(id, executor);
  if (!row) throw NotFound('Parcel not found');
  return row;
}
