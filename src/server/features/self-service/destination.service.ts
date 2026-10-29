import { BadRequest, NotFound } from '@/server/utils/http-error';
import { getBranchRepo, listBranchOptionsRepo } from '@/server/features/branches/repository';
import { listLocationOptionsRepo } from '@/server/features/locations/repository';
import { BranchType } from '@/db/schemas/enums';
import { validateSelfServiceSessionSvc } from './session.service';

// Same branch/location option shape and same "not source, not head office"
// filter the agent create-parcel form applies client-side - see
// destinationBranchOptions in use-parcel-create-form-workflow.ts.
export async function listSelfServiceDestinationBranchesSvc(input: {
  sourceBranchId: string;
  sessionToken: string;
}) {
  await validateSelfServiceSessionSvc({
    branchId: input.sourceBranchId,
    sessionToken: input.sessionToken,
  });
  const source = await getBranchRepo(input.sourceBranchId);
  if (!source || source.isDeleted) throw NotFound('Branch not found');

  const options = await listBranchOptionsRepo({ companyId: source.companyId });
  return options.filter(
    (branch) => branch.id !== input.sourceBranchId && branch.type !== BranchType.HEADOFFICE,
  );
}

export async function listSelfServiceDestinationLocationsSvc(input: {
  sourceBranchId: string;
  destinationBranchId: string;
  sessionToken: string;
}) {
  await validateSelfServiceSessionSvc({
    branchId: input.sourceBranchId,
    sessionToken: input.sessionToken,
  });
  const source = await getBranchRepo(input.sourceBranchId);
  if (!source || source.isDeleted) throw NotFound('Branch not found');

  const destination = await getBranchRepo(input.destinationBranchId);
  if (!destination || destination.isDeleted || destination.companyId !== source.companyId) {
    throw NotFound('Destination branch not found');
  }

  return listLocationOptionsRepo({
    companyId: source.companyId,
    branchId: input.destinationBranchId,
    canReceive: true,
  });
}

// Never trust the client-picked destination blindly: re-verify it's a real,
// active branch in the same company, not the source branch itself, not head
// office, and (if a location was picked) that the location actually belongs
// to that branch. Public submissions can additionally be limited to its first
// receiving location while staff draft edits retain the full location list.
export async function validateSelfServiceDestinationSvc(input: {
  sourceBranchId: string;
  companyId: string;
  destinationBranchId: string;
  destinationLocationId?: string | null;
  firstReceivingLocationOnly?: boolean;
}): Promise<{ destinationBranchId: string; destinationLocationId: string | null }> {
  if (input.destinationBranchId === input.sourceBranchId) {
    throw BadRequest('Destination branch cannot be the same as the source branch');
  }

  const destination = await getBranchRepo(input.destinationBranchId);
  if (!destination || destination.isDeleted || destination.companyId !== input.companyId) {
    throw BadRequest('Select a valid destination branch');
  }
  if (destination.type === BranchType.HEADOFFICE) {
    throw BadRequest('Head office cannot be selected as destination branch');
  }

  if (!input.destinationLocationId && !input.firstReceivingLocationOnly) {
    return { destinationBranchId: destination.id, destinationLocationId: null };
  }

  const locationOptions = await listLocationOptionsRepo({
    companyId: input.companyId,
    branchId: destination.id,
    canReceive: true,
  });
  const firstReceivingLocation = locationOptions[0];
  if (!firstReceivingLocation) {
    throw BadRequest('The destination branch has no receiving locations');
  }
  const selectedLocation = input.destinationLocationId
    ? locationOptions.find((location) => location.id === input.destinationLocationId)
    : firstReceivingLocation;
  if (!selectedLocation) {
    throw BadRequest('Select a valid receiving location for the destination branch');
  }
  if (input.firstReceivingLocationOnly && selectedLocation.id !== firstReceivingLocation.id) {
    throw BadRequest('Select the first receiving location for the destination branch');
  }

  return {
    destinationBranchId: destination.id,
    destinationLocationId: selectedLocation.id,
  };
}
