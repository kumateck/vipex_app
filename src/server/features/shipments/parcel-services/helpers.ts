import { ParcelReconciliationActionType, ParcelReconciliationCaseType } from '@/db/schemas';
import { db } from '@/db/config';
import { BadRequest } from '../../../utils/http-error';

export const STORAGE_DAY_MS = 24 * 60 * 60 * 1000;

export const STORAGE_PAYMENT_NOTE_PREFIX = 'STORAGE_CHARGE';

export type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const err = error as { code?: unknown; cause?: unknown };
  if (typeof err.code === 'string') return err.code;
  if (err.cause && typeof err.cause === 'object') {
    const cause = err.cause as { code?: unknown };
    if (typeof cause.code === 'string') return cause.code;
  }
  return undefined;
}

export function isSchemaCompatibilityError(error: unknown): boolean {
  const code = getErrorCode(error);
  return code === '42P01' || code === '42703';
}

export function getAuditMetadataNote(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const candidate = (metadata as Record<string, unknown>).notes;
  return typeof candidate === 'string' && candidate.trim() ? candidate.trim() : null;
}

export function isNonEmptyText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function assertCaseType(value: number): ParcelReconciliationCaseType {
  if (Object.values(ParcelReconciliationCaseType).includes(value)) {
    return value as ParcelReconciliationCaseType;
  }
  throw BadRequest('Unsupported reconciliation case type');
}

export function assertActionType(value: number): ParcelReconciliationActionType {
  if (Object.values(ParcelReconciliationActionType).includes(value)) {
    return value as ParcelReconciliationActionType;
  }
  throw BadRequest('Unsupported reconciliation action type');
}

export function isAmountCorrectionCaseType(caseType: ParcelReconciliationCaseType) {
  return (
    caseType === ParcelReconciliationCaseType.WRONG_AMOUNT ||
    caseType === ParcelReconciliationCaseType.DATA_ENTRY_ERROR
  );
}

export function isOriginalSessionAmountCorrection(actionType: number | null | undefined) {
  return actionType === ParcelReconciliationActionType.CORRECT_AMOUNT_IN_ORIGINAL_SESSION;
}
