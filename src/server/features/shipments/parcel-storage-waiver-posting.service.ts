import { db } from '@/db/config';
import { Conflict, NotFound } from '@/server/utils/http-error';
import { JournalSourceType } from '@/db/schemas/enums';
import { postJournalEntrySvc } from '../accounting/posting.service';
import { getAccountByCodeRepo } from '../accounting/repository';
import { isAccountingEnabledForCompanySvc } from '../accounting/service';
import {
  createParcelStorageWaiverRepo,
  updateParcelStorageWaiverAccountingPostingRepo,
  type ParcelRow,
} from './parcels.repository';

const STORAGE_WAIVER_RECEIVABLE_ACCOUNT_CODE = '1300';
const STORAGE_WAIVER_EXPENSE_ACCOUNT_CODE = '5180';
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function postParcelStorageWaiver(
  input: {
    parcelId: string;
    actorUserId: string;
    reason: string;
    amountPsw: number;
    parcel: ParcelRow;
  },
  tx: Transaction,
) {
  const { parcel, reason, amountPsw: requestedPsw } = input;
  const createdWaiver = await createParcelStorageWaiverRepo(
    {
      companyId: parcel.companyId,
      parcelId: input.parcelId,
      waivedAmountPsw: requestedPsw,
      reason,
      waivedBy: input.actorUserId,
      waivedAt: new Date(),
    },
    tx,
  );
  if (!createdWaiver) throw NotFound('Failed to record parcel storage waiver');

  if (!(await isAccountingEnabledForCompanySvc(parcel.companyId, tx))) {
    return null;
  }

  const [receivableAccount, expenseAccount] = await Promise.all([
    getAccountByCodeRepo(parcel.companyId, STORAGE_WAIVER_RECEIVABLE_ACCOUNT_CODE, tx),
    getAccountByCodeRepo(parcel.companyId, STORAGE_WAIVER_EXPENSE_ACCOUNT_CODE, tx),
  ]);

  if (!receivableAccount || !receivableAccount.active) {
    throw Conflict(
      `Accounting account ${STORAGE_WAIVER_RECEIVABLE_ACCOUNT_CODE} is required and must be active to post storage waivers`,
    );
  }
  if (!expenseAccount || !expenseAccount.active) {
    throw Conflict(
      `Accounting account ${STORAGE_WAIVER_EXPENSE_ACCOUNT_CODE} is required and must be active to post storage waivers`,
    );
  }

  const posted = await postJournalEntrySvc(
    {
      companyId: parcel.companyId,
      sourceType: JournalSourceType.PAYMENT,
      sourceId: createdWaiver.id,
      description: `Parcel storage waiver: ${parcel.trackingCode}`,
      memo: reason,
      branchId: parcel.destinationId,
      locationId: parcel.pickupLocationId ?? null,
      recordedByUserId: input.actorUserId,
      approvedByUserId: input.actorUserId,
      postedBy: input.actorUserId,
      lines: [
        {
          accountId: expenseAccount.id,
          debitPsw: requestedPsw,
          description: `Storage waiver expense for ${parcel.trackingCode}`,
          metadata: { parcelId: input.parcelId, waiverId: createdWaiver.id },
        },
        {
          accountId: receivableAccount.id,
          creditPsw: requestedPsw,
          description: `Storage receivable write-off for ${parcel.trackingCode}`,
          metadata: { parcelId: input.parcelId, waiverId: createdWaiver.id },
        },
      ],
    },
    tx,
  );

  const postedAt = new Date();
  await updateParcelStorageWaiverAccountingPostingRepo(
    createdWaiver.id,
    {
      accountingJournalEntryId: posted.entryId,
      accountingPostedAt: postedAt,
    },
    tx,
  );

  return { journalEntryId: posted.entryId, postedAt };
}
