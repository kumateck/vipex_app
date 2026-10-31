import { listParcelReconciliationCasesRepo } from '../parcel-reconciliation-cases.repository';

export async function listParcelReconciliationCasesSvc(input: {
  companyId: string;
  statuses?: number[] | null;
  branchId?: string | null;
  limit: number;
  offset: number;
  search?: string | null;
}) {
  return listParcelReconciliationCasesRepo(input);
}
