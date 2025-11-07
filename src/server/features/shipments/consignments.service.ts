import { BadRequest } from '../../utils/http-error';
import {
  addConsignmentItemsRepo,
  createConsignmentRepo,
  getNextSerialForDayRepo,
  removeConsignmentItemRepo,
} from './consignments.repository';

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
  const added = await addConsignmentItemsRepo(
    input.parcelIds.map((pid) => ({ consignmentId: input.consignmentId, parcelId: pid })),
  );
  return { added };
}

export async function removeItemFromConsignmentSvc(input: {
  consignmentId: string;
  parcelId: string;
}) {
  const removed = await removeConsignmentItemRepo(input.consignmentId, input.parcelId, new Date());
  return { removed };
}
