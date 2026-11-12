import { and, desc, eq, sql } from 'drizzle-orm';
import { auditLogs } from '@/db/schemas';
import type {
  OtpAuthorizationTarget,
  OtpAuthorizationWorkflow,
  PickupOtpAuthorization,
} from '@/shared/shipments/receiver-otp-exception';
import { BadRequest, Conflict } from '@/server/utils/http-error';
import type { DbExecutor } from '../shipments/parcel-repositories/parcel-repository.types';

const AUTHORIZED = 'PARCEL_RECEIVER_OTP_EXCEPTION_AUTHORIZED';
const USED = 'PARCEL_RECEIVER_OTP_EXCEPTION_USED';

export type ReceiverOtpExceptionInput = {
  otpAuthorizationId?: string;
  receiverOtpVerificationToken?: string;
};

export type AuthorizationScope = {
  companyId: string;
  branchId: string;
  parcelId: string;
  workflow: OtpAuthorizationWorkflow;
  handoverTarget: OtpAuthorizationTarget;
  receiverId: string;
  collectorId: string;
};

function parcelAudit(scope: Pick<AuthorizationScope, 'companyId' | 'parcelId'>) {
  return and(
    eq(auditLogs.companyId, scope.companyId),
    eq(auditLogs.entityType, 'parcel'),
    eq(auditLogs.entityId, scope.parcelId),
  );
}

export async function getActiveOtpAuthorization(tx: DbExecutor, scope: AuthorizationScope) {
  const [entry] = await tx
    .select({
      id: auditLogs.id,
      approvedBy: auditLogs.actorUserId,
      metadata: auditLogs.metadata,
    })
    .from(auditLogs)
    .where(
      and(
        parcelAudit(scope),
        eq(auditLogs.action, AUTHORIZED),
        sql`${auditLogs.metadata}->>'workflow' = ${scope.workflow}`,
      ),
    )
    .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
    .limit(1);
  if (!entry?.approvedBy) return null;

  const data = entry.metadata as Partial<AuthorizationScope & { expiresAt: string }> | null;
  if (
    data?.branchId !== scope.branchId ||
    data.handoverTarget !== scope.handoverTarget ||
    data.receiverId !== scope.receiverId ||
    data.collectorId !== scope.collectorId ||
    !data.expiresAt ||
    !(Date.parse(data.expiresAt) > Date.now())
  )
    return null;

  const [used] = await tx
    .select({ id: auditLogs.id })
    .from(auditLogs)
    .where(
      and(
        parcelAudit(scope),
        eq(auditLogs.action, USED),
        sql`${auditLogs.metadata}->>'authorizationId' = ${entry.id}`,
      ),
    )
    .limit(1);
  return used
    ? null
    : {
        id: entry.id,
        approvedBy: entry.approvedBy,
        expiresAt: data.expiresAt,
        handoverTarget: scope.handoverTarget,
      };
}

export async function resolveReceiverOtpException(
  tx: DbExecutor,
  input: ReceiverOtpExceptionInput,
  otpRequired: boolean,
  scope: AuthorizationScope,
) {
  if (!input.otpAuthorizationId) return null;
  if (!otpRequired) throw BadRequest('An OTP approval is only available when OTP is required');
  if (input.receiverOtpVerificationToken)
    throw BadRequest('Choose OTP verification or an admin approval');
  const approval = await getActiveOtpAuthorization(tx, scope);
  if (approval?.id !== input.otpAuthorizationId)
    throw Conflict('Admin approval is unavailable or expired. Check for a new approval.');
  return approval;
}

export async function recordReceiverOtpException(
  tx: DbExecutor,
  scope: AuthorizationScope,
  actorUserId: string,
  approval: { id: string; approvedBy: string },
) {
  await tx.insert(auditLogs).values({
    companyId: scope.companyId,
    actorUserId,
    entityType: 'parcel',
    entityId: scope.parcelId,
    action: USED,
    message: 'Handover processed with admin approval without OTP',
    metadata: { ...scope, authorizationId: approval.id, approvedBy: approval.approvedBy },
  });
}

export async function saveOtpAuthorization(
  tx: DbExecutor,
  scope: AuthorizationScope,
  actorUserId: string,
  reason: string,
  expiresAt: string,
): Promise<PickupOtpAuthorization> {
  const [entry] = await tx
    .insert(auditLogs)
    .values({
      companyId: scope.companyId,
      actorUserId,
      entityType: 'parcel',
      entityId: scope.parcelId,
      action: AUTHORIZED,
      message: 'Admin approved parcel handover without OTP',
      metadata: { ...scope, reason, expiresAt },
      createdAt: sql`clock_timestamp() at time zone 'UTC'`,
    })
    .returning({ id: auditLogs.id });
  return { id: entry!.id, expiresAt, handoverTarget: scope.handoverTarget };
}
