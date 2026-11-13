import { db } from '@/db/config';
import { BranchType } from '@/db/schemas/enums';
import { Forbidden } from '@/server/utils/http-error';
import { normalizePagination } from '@/server/utils/pagination';
import type { OtpApprovalQueueQuery } from '@/shared/shipments/receiver-otp-exception';
import { findOtpApprover, type OtpApproverScope } from './exception-access.repository';
import { listPendingOtpApprovals } from './exception-queue.repository';

export async function getPendingOtpApprovals(input: OtpApproverScope & OtpApprovalQueueQuery) {
  const grant = await findOtpApprover(db, input);
  if (!grant) throw Forbidden('You do not have permission to approve pickup without OTP');
  const { pageSize, offset } = normalizePagination(input);
  const rows = await listPendingOtpApprovals(db, {
    ...input,
    destinationId: grant.branchType === BranchType.HEADOFFICE ? undefined : input.branchId,
    offset,
    limit: pageSize + 1,
  });
  return { items: rows.slice(0, pageSize), hasNextPage: rows.length > pageSize };
}
