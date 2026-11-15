import { and, asc, eq, gt, or, sql, type SQL } from 'drizzle-orm';
import { db } from '@/db/config';
import { customers, locations, parcels, receivingOffices, users } from '@/db/schemas';
import type { BatchPickupPage } from '@/shared/shipments/parcel-batch-handover';
import { handoverNoteProjection } from '../shipments/handover-note/projection';
import { receivingOfficeJoin } from '../shipments/parcel-receiving-office/projection';
import { getBatchEligibility } from './eligibility';
import {
  availableParcelScope,
  batchStaffScope,
  batchTelephone,
  getBatchBranch,
  type BatchActor,
} from './selection';

const PAGE_SIZE = 20;

function matchesTelephone(column: SQL, telephone: string) {
  const digits = sql`regexp_replace(${column}, '[^0-9]', '', 'g')`;
  return or(eq(digits, telephone), eq(digits, `233${telephone.slice(1)}`));
}

export async function searchBatchParcels(
  actor: BatchActor,
  input: { telephone: string; after?: string },
): Promise<BatchPickupPage> {
  const telephone = batchTelephone(input.telephone);
  const [branch, staff, candidates] = await Promise.all([
    getBatchBranch(actor),
    actor.locationId
      ? db
          .select({ id: users.id, name: users.fullname })
          .from(users)
          .where(batchStaffScope(actor))
          .orderBy(asc(users.fullname), asc(users.id))
      : [],
    db
      .select({
        id: parcels.id,
        receiverId: parcels.receiverId,
        receiverName: customers.fullname,
        trackingCode: parcels.trackingCode,
        bookingCode: parcels.bookingCode,
        parcelDetails: parcels.parcelDetails,
        shelfPickerStaffId: parcels.shelfPickerStaffId,
        pickupLocationName: locations.name,
        receivingOfficeName: receivingOffices.name,
        ...handoverNoteProjection,
      })
      .from(parcels)
      .innerJoin(
        customers,
        and(
          eq(customers.id, parcels.receiverId),
          eq(customers.companyId, parcels.companyId),
          eq(customers.isDeleted, false),
        ),
      )
      .leftJoin(locations, eq(locations.id, parcels.pickupLocationId))
      .leftJoin(receivingOffices, receivingOfficeJoin)
      .where(
        and(
          availableParcelScope(actor),
          or(
            eq(customers.telephone, telephone),
            matchesTelephone(sql`${customers.telephone}`, telephone),
            matchesTelephone(sql`${customers.telephone2}`, telephone),
          ),
          input.after ? gt(parcels.id, input.after) : undefined,
        ),
      )
      .orderBy(asc(parcels.id))
      .limit(PAGE_SIZE + 1),
  ]);
  const page = candidates.slice(0, PAGE_SIZE);
  const checked = await Promise.all(
    page.map(async ({ shelfPickerStaffId, ...row }) => {
      const current = await getBatchEligibility(
        actor,
        { id: row.id, shelfPickerStaffId },
        branch.usePickupQueue,
      );
      return current.matchesWorkflow
        ? {
            ...row,
            principalPsw: current.principalPsw,
            storagePsw: current.storagePsw,
            queueNumber: current.queueNumber,
            blockedReason: current.blockedReason,
            needsAssociate: !current.associate,
          }
        : null;
    }),
  );
  return {
    rows: checked.filter((row) => row != null),
    next: candidates.length > PAGE_SIZE ? (page.at(-1)?.id ?? null) : null,
    staff,
  };
}
