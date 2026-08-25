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
  });
}

// Never trust the client-picked destination blindly: re-verify it's a real,
// active branch in the same company, not the source branch itself, not head
// office, and (if a location was picked) that the location actually belongs
// to that branch.
export async function validateSelfServiceDestinationSvc(input: {
  sourceBranchId: string;
  companyId: string;
  destinationBranchId: string;
  destinationLocationId?: string | null;
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

  if (!input.destinationLocationId) {
    return { destinationBranchId: destination.id, destinationLocationId: null };
  }

  const locationOptions = await listLocationOptionsRepo({
    companyId: input.companyId,
    branchId: destination.id,
  });
  const matchedLocation = locationOptions.find(
    (location) => location.id === input.destinationLocationId,
  );
  if (!matchedLocation) {
    throw BadRequest('Select a valid destination location');
  }

  return { destinationBranchId: destination.id, destinationLocationId: matchedLocation.id };
}
