import { createUploadSvc } from '@/server/features/uploads/service';
import { NotFound } from '@/server/utils/http-error';
import { getParcelDiscrepancyRepo } from './parcel-discrepancies.repository';

export async function uploadParcelDiscrepancyEvidenceSvc(input: {
  discrepancyId: string;
  companyId: string;
  actorUserId: string;
  fileName: string;
  dataUrl: string;
}) {
  const discrepancy = await getParcelDiscrepancyRepo(input.discrepancyId, input.companyId);
  if (!discrepancy) throw NotFound('Parcel discrepancy not found');

  return createUploadSvc({
    companyId: input.companyId,
    uploadedBy: input.actorUserId,
    modelType: 'parcel-discrepancy-evidence',
    modelId: discrepancy.id,
    fileName: input.fileName,
    dataUrl: input.dataUrl,
  });
}
