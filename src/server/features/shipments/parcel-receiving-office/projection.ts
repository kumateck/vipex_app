import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { locations, parcels, parcelInternalHolders, receivingOffices } from '@/db/schemas';
import { RECEIVING_OFFICE_STATUSES } from '@/shared/shipments/receiving-office';

export const receivingOfficeProjection = {
  receivingOfficeId: receivingOffices.id,
  receivingOfficeName: receivingOffices.name,
};

export const parcelAtPickupLocation = sql<boolean>`not exists (
  select 1 from ${parcelInternalHolders}
  where ${parcelInternalHolders.parcelId} = ${parcels.id}
    and (
      ${parcelInternalHolders.branchId} <> ${parcels.destinationId}
      or ${parcelInternalHolders.warehouseId} is not null
      or (${parcelInternalHolders.locationId} is not null and
        ${parcelInternalHolders.locationId} is distinct from ${parcels.pickupLocationId})
    )
)`;

export const receivingOfficeJoin = and(
  eq(receivingOffices.id, parcels.receivingOfficeId),
  eq(receivingOffices.locationId, parcels.pickupLocationId),
  eq(parcels.isDeleted, false),
  isNull(parcels.confirmedAt),
  isNull(parcels.deletedAt),
  parcelAtPickupLocation,
  sql`exists (select 1 from ${locations}
    where ${locations.id} = ${parcels.pickupLocationId}
      and ${locations.companyId} = ${parcels.companyId}
      and ${locations.branchId} = ${parcels.destinationId}
      and ${locations.canReceive}
      and not ${locations.isDeleted})`,
  inArray(parcels.status, RECEIVING_OFFICE_STATUSES),
);
