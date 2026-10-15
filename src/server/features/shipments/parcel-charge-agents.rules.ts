import { BadRequest } from '@/server/utils/http-error';

export function assertParcelChargeAgentSelections(
  parcels: ReadonlyArray<{ chargeAgentUserId?: string | null }>,
  eligibleIds: ReadonlySet<string>,
) {
  parcels.forEach((parcel, index) => {
    if (parcel.chargeAgentUserId != null && !eligibleIds.has(parcel.chargeAgentUserId)) {
      throw BadRequest(`Parcel ${index + 1}: Select an active charge agent from the source branch`);
    }
  });
}
