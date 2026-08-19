import { BadRequest, NotFound } from '../../utils/http-error';
import { ParcelStatus } from '@/db/schemas';
import {
  getConsignmentReceivingCountsRepo,
  listConsignmentItemsRepo,
  listIncomingConsignmentsRepo,
} from './consignments-receiving.repository';
import {
  addConsignmentItemsRepo,
  createConsignmentRepo,
  getConsignmentRepo,
  getNextSerialForDayRepo,
  removeConsignmentItemRepo,
} from './consignments.repository';
import { updateParcelsStatusRepo } from './parcels.repository';
import { getParcelSvc } from './parcels.service';

export { closeConsignmentSvc, receiveConsignmentItemSvc } from './consignment-receiving.service';

function makeCode(consignmentDate: Date, serial: number): string {
  const y = consignmentDate.getFullYear();
  const m = String(consignmentDate.getMonth() + 1).padStart(2, '0');
  const d = String(consignmentDate.getDate()).padStart(2, '0');
  return `${y}${m}${d}-${serial}`;
}

export async function createConsignmentSvc(input: {
  companyId: string;
  sourceId: string;
  destinationId: string;
  consignmentDate: string; // date-only ISO "YYYY-MM-DD"
  createdBy: string;
}) {
  if (!input.companyId || !input.sourceId || !input.destinationId)
    throw BadRequest('Missing required fields');
  const dateOnly = new Date(input.consignmentDate);
  const serial = await getNextSerialForDayRepo(input.companyId, input.sourceId, dateOnly);
  const code = makeCode(dateOnly, serial);
  const created = await createConsignmentRepo({
    companyId: input.companyId,
    sourceId: input.sourceId,
    destinationId: input.destinationId,
    consignmentDate: dateOnly,
    serialForDay: serial,
    code,
    createdBy: input.createdBy,
  });
  return { id: created.id, code, serialForDay: serial };
}

export async function addItemsToConsignmentSvc(input: {
  consignmentId: string;
  parcelIds: string[];
}) {
  if (input.parcelIds.length === 0) return { added: 0 };
  const consignment = await getConsignmentRepo(input.consignmentId);
  if (!consignment) {
    throw BadRequest('Consignment not found');
  }

  const uniqueParcelIds = [...new Set(input.parcelIds)];
  const parcels = await Promise.all(uniqueParcelIds.map((parcelId) => getParcelSvc(parcelId)));

  for (const parcel of parcels) {
    if (parcel.isDeleted) {
      throw BadRequest(`Parcel ${parcel.id} is deleted and cannot be assigned to a consignment`);
    }
    if (parcel.status !== ParcelStatus.PROCESSED) {
      throw BadRequest(`Parcel ${parcel.id} must be in PROCESSED status before consignment`);
    }
    if (parcel.companyId !== consignment.companyId || parcel.sourceId !== consignment.sourceId) {
      throw BadRequest(`Parcel ${parcel.id} does not belong to this source branch consignment`);
    }
    if (parcel.destinationId !== consignment.destinationId) {
      throw BadRequest(
        `Parcel ${parcel.id} destination does not match consignment destination branch`,
      );
    }
  }

  const added = await addConsignmentItemsRepo(
    uniqueParcelIds.map((parcelId) => ({ consignmentId: input.consignmentId, parcelId })),
  );
  if (added > 0) {
    await updateParcelsStatusRepo(uniqueParcelIds, ParcelStatus.IN_TRANSIT);
  }
  return { added };
}

export async function removeItemFromConsignmentSvc(input: {
  consignmentId: string;
  parcelId: string;
}) {
  const removed = await removeConsignmentItemRepo(input.consignmentId, input.parcelId, new Date());
  return { removed };
}

export async function getConsignmentDetailSvc(consignmentId: string) {
  const consignment = await getConsignmentRepo(consignmentId);
  if (!consignment) throw NotFound('Consignment not found');
  const counts = await getConsignmentReceivingCountsRepo(consignmentId);
  return { ...consignment, ...counts };
}

export async function listConsignmentItemsSvc(consignmentId: string) {
  const consignment = await getConsignmentRepo(consignmentId);
  if (!consignment) throw NotFound('Consignment not found');
  return listConsignmentItemsRepo(consignmentId);
}

export async function listIncomingConsignmentsSvc(input: {
  companyId: string;
  destinationId: string;
  statuses?: number[];
}) {
  return listIncomingConsignmentsRepo(input);
}
