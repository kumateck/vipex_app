import { and, desc, eq, ilike, isNull, or, sql, type SQL } from 'drizzle-orm';
import { branches, parcels, ParcelStatus, parcelReceiverOtps } from '@/db/schemas';
import type { OtpAuthorizationWorkflow } from '@/shared/shipments/receiver-otp-exception';
import type { DbExecutor } from '../shipments/parcel-repositories/parcel-repository.types';
import { OTP_EXCEPTION_AUTHORIZED, OTP_EXCEPTION_USED } from './exception';
import { currentReceiverPhone } from './repository';

function hasNoActiveApproval(workflow: OtpAuthorizationWorkflow, now: Date) {
  return sql`not exists (
    select 1 from (
      select approval.id, approval.actor_user_id, approval.metadata
      from audit_logs approval
      where approval.company_id = ${parcels.companyId}
        and approval.entity_type = 'parcel' and approval.entity_id = ${parcels.id}
        and approval.action = ${OTP_EXCEPTION_AUTHORIZED}
        and approval.metadata->>'workflow' = ${workflow}
      order by approval.created_at desc, approval.id desc
      limit 1
    ) latest
    where latest.actor_user_id is not null
      and latest.metadata->>'branchId' = ${parcels.destinationId}
      and latest.metadata->>'receiverId' = ${parcels.receiverId}
      and latest.metadata->>'collectorId' = case latest.metadata->>'handoverTarget'
        when 'main' then ${parcels.receiverId}
        when 'second' then ${parcels.secondReceiverId}
      end
      and latest.metadata->>'expiresAt' > ${now.toISOString()}
      and not exists (
        select 1 from audit_logs usage
        where usage.company_id = ${parcels.companyId}
          and usage.entity_type = 'parcel' and usage.entity_id = ${parcels.id}
          and usage.action = ${OTP_EXCEPTION_USED}
          and usage.metadata->>'authorizationId' = latest.id
      )
  )`;
}

type QueueScope = {
  companyId: string;
  workflow: OtpAuthorizationWorkflow;
};

function pendingOtpQuery(executor: DbExecutor, input: QueueScope, scope?: SQL) {
  const latestByReceiver = executor
    .selectDistinctOn([parcelReceiverOtps.targetReceiver], {
      id: parcelReceiverOtps.id,
      target: parcelReceiverOtps.targetReceiver,
      requestedAt: parcelReceiverOtps.createdAt,
      expiresAt: parcelReceiverOtps.expiresAt,
      verifiedAt: parcelReceiverOtps.verifiedAt,
    })
    .from(parcelReceiverOtps)
    .where(
      and(
        eq(parcelReceiverOtps.parcelId, parcels.id),
        eq(parcelReceiverOtps.companyId, parcels.companyId),
        eq(parcelReceiverOtps.branchId, parcels.destinationId),
        currentReceiverPhone,
      ),
    )
    .orderBy(
      parcelReceiverOtps.targetReceiver,
      desc(parcelReceiverOtps.createdAt),
      desc(parcelReceiverOtps.id),
    )
    .as('latest_by_receiver');
  const pending = executor
    .select()
    .from(latestByReceiver)
    .where(isNull(latestByReceiver.verifiedAt))
    .orderBy(desc(latestByReceiver.requestedAt), desc(latestByReceiver.id))
    .limit(1)
    .as('pending_otp');
  const otpRequired =
    input.workflow === 'office_pickup' ? branches.requirePickupOtp : branches.requireReceiverOtp;
  const now = new Date();

  return executor
    .select({
      id: parcels.id,
      bookingCode: parcels.bookingCode,
      trackingCode: parcels.trackingCode,
      receiverId: parcels.receiverId,
      receiverNameSnapshot: parcels.receiverNameSnapshot,
      secondReceiverId: parcels.secondReceiverId,
      secondReceiverNameSnapshot: parcels.secondReceiverNameSnapshot,
      destinationName: branches.name,
      otpRequestId: pending.id,
      otpTarget: pending.target,
      otpRequestedAt: pending.requestedAt,
      otpExpired: sql<boolean>`${pending.expiresAt} <= ${now.toISOString()}::timestamp`,
    })
    .from(parcels)
    .innerJoin(
      branches,
      and(eq(branches.id, parcels.destinationId), eq(branches.companyId, parcels.companyId)),
    )
    .innerJoinLateral(pending, sql`true`)
    .where(
      and(
        eq(parcels.companyId, input.companyId),
        eq(parcels.status, ParcelStatus.AWAITING_PICKUP),
        eq(parcels.isDeleted, false),
        isNull(parcels.confirmedAt),
        isNull(parcels.pendingReceiverHandover),
        eq(branches.isDeleted, false),
        eq(otpRequired, true),
        scope,
        hasNoActiveApproval(input.workflow, now),
      ),
    )
    .orderBy(desc(pending.requestedAt), desc(parcels.id));
}

export function listPendingOtpApprovals(
  executor: DbExecutor,
  input: QueueScope & { destinationId?: string; search?: string; offset: number; limit: number },
) {
  const search = input.search?.trim();
  const pattern = search ? `%${search.replace(/[\\%_]/g, '\\$&')}%` : undefined;
  return pendingOtpQuery(
    executor,
    input,
    and(
      input.destinationId ? eq(parcels.destinationId, input.destinationId) : undefined,
      pattern
        ? or(ilike(parcels.bookingCode, pattern), ilike(parcels.trackingCode, pattern))
        : undefined,
    ),
  )
    .limit(input.limit)
    .offset(input.offset);
}

export async function findPendingOtpForApproval(
  executor: DbExecutor,
  input: QueueScope & { parcelId: string },
) {
  const [pending] = await pendingOtpQuery(executor, input, eq(parcels.id, input.parcelId)).limit(1);
  return pending;
}
