import { db } from '@/db/config';
import { JournalSourceType } from '@/db/schemas/enums';
import { BadRequest, NotFound } from '@/server/utils/http-error';
import {
  createJournalBatchRepo,
  createJournalEntryRepo,
  createJournalLinesRepo,
} from './repository';

type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export type JournalLineInput = {
  accountId: string;
  debitPsw?: number;
  creditPsw?: number;
  branchId?: string | null;
  locationId?: string | null;
  recordedByUserId?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
};

function validateBalanced(lines: JournalLineInput[]) {
  if (lines.length < 2) throw BadRequest('Journal entry requires at least two lines');
  const totalDebit = lines.reduce((sum, line) => sum + Number(line.debitPsw ?? 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + Number(line.creditPsw ?? 0), 0);
  if (totalDebit <= 0 || totalCredit <= 0) {
    throw BadRequest('Journal entry must have positive debits and credits');
  }
  if (totalDebit !== totalCredit) {
    throw BadRequest('Journal entry is not balanced');
  }
}

export async function postJournalEntrySvc(
  input: {
    companyId: string;
    sourceType: JournalSourceType;
    sourceId?: string | null;
    batchDate?: Date;
    entryDate?: Date;
    description?: string | null;
    memo?: string | null;
    branchId?: string | null;
    locationId?: string | null;
    recordedByUserId?: string | null;
    approvedByUserId?: string | null;
    postedBy?: string | null;
    lines: JournalLineInput[];
  },
  executor: DbExecutor = db,
) {
  validateBalanced(input.lines);

  const batch = await createJournalBatchRepo(
    {
      companyId: input.companyId,
      sourceType: input.sourceType,
      sourceId: input.sourceId ?? null,
      batchDate: input.batchDate ?? new Date(),
      description: input.description ?? null,
      postedBy: input.postedBy ?? null,
      postedAt: new Date(),
      createdBy: input.recordedByUserId ?? null,
    },
    executor,
  );

  if (!batch) throw NotFound('Failed to create journal batch');

  const entry = await createJournalEntryRepo(
    {
      companyId: input.companyId,
      batchId: batch.id,
      sourceType: input.sourceType,
      sourceId: input.sourceId ?? null,
      entryDate: input.entryDate ?? new Date(),
      memo: input.memo ?? null,
      branchId: input.branchId ?? null,
      locationId: input.locationId ?? null,
      recordedByUserId: input.recordedByUserId ?? null,
      approvedByUserId: input.approvedByUserId ?? null,
    },
    executor,
  );

  if (!entry) throw NotFound('Failed to create journal entry');

  await createJournalLinesRepo(
    input.lines.map((line) => ({
      companyId: input.companyId,
      entryId: entry.id,
      accountId: line.accountId,
      branchId: line.branchId ?? input.branchId ?? null,
      locationId: line.locationId ?? input.locationId ?? null,
      recordedByUserId: line.recordedByUserId ?? input.recordedByUserId ?? null,
      debitPsw: Number(line.debitPsw ?? 0),
      creditPsw: Number(line.creditPsw ?? 0),
      description: line.description ?? null,
      metadata: line.metadata ?? null,
    })),
    executor,
  );

  return { batchId: batch.id, entryId: entry.id };
}
