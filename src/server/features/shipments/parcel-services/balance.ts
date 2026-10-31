import { fromPesewas, toPesewas } from '@/server/utils/gh-money';
import { PaymentMethod } from '@/db/schemas';
import { BadRequest, Conflict, NotFound } from '../../../utils/http-error';
import { getParcelRepo, updateParcelRepo } from '../parcels.repository';
import { getParcelChargeValidationError } from '@/shared/shipments/parcel-charge-policy';

export async function setPlannedToBePaidSvc(id: string, plannedCedis: number | string) {
  const cur = await getParcelRepo(id);
  if (!cur) throw NotFound('Parcel not found');
  if (cur.method === PaymentMethod.CREDIT && Number(plannedCedis) !== 0) {
    throw Conflict('A credit parcel cannot also have an amount to collect from the receiver');
  }
  const validationError = getParcelChargeValidationError({
    chargeCedis: fromPesewas(BigInt(cur.chargePsw)),
    plannedToBePaidCedis: Number(plannedCedis),
  });
  if (validationError) throw BadRequest(validationError);
  const plannedToBePaidPsw = toPesewas(plannedCedis);
  const updated = await updateParcelRepo(id, { plannedToBePaidPsw: Number(plannedToBePaidPsw) });
  if (!updated) throw NotFound('Parcel not found');
  return { id: updated.id, plannedToBePaidCedis: Number(plannedToBePaidPsw) / 100 };
}
