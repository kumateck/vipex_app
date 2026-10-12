import type { AuthUser } from '@/server/plugins/auth';
import { BranchType } from '@/db/schemas/enums';
import { Forbidden } from '@/server/utils/http-error';
import { listParcelChargeAgentOptionsRepo } from './parcel-charge-agents.repository';

export function listParcelChargeAgentOptionsSvc(user: AuthUser) {
  if (!user.companyId || !user.branchId || user.branchType === BranchType.HEADOFFICE) {
    throw Forbidden('A source branch is required to select a charge agent');
  }
  return listParcelChargeAgentOptionsRepo({ companyId: user.companyId, sourceId: user.branchId });
}
