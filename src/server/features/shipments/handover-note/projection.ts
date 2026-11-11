import { sql } from 'drizzle-orm';
import { parcels } from '@/db/schemas';
import { ParcelStatus } from '@/db/schemas/enums';
import { editableParcelStatuses } from '../customer-corrections/rules';

const deliveredNoteStatuses = [
  ParcelStatus.DELIVERED_BY_OFFICE,
  ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
  ParcelStatus.DELIVERED_AT_HOME,
];

export const handoverNoteProjection = {
  hasHandoverNote: sql<boolean>`${parcels.handoverNote} is not null and not ${parcels.isDeleted}`,
  handoverNoteCritical: sql<boolean>`${parcels.handoverNote} is not null
    and not ${parcels.isDeleted}
    and ${parcels.handoverNoteClearedAt} is null
    and ${parcels.status} not in (${sql.join(
      deliveredNoteStatuses.map((status) => sql`${status}`),
      sql`, `,
    )})`,
};

export const handoverNoteEditable = sql<boolean>`not ${parcels.isDeleted}
  and ${parcels.handoverNoteClearedAt} is null
  and ${parcels.confirmedAt} is null
  and ${parcels.deliveryConfirmationSnapshot} is null
  and ${parcels.status} in (${sql.join(
    [...editableParcelStatuses].map((status) => sql`${status}`),
    sql`, `,
  )})`;
