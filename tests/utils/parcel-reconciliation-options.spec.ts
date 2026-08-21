import { describe, expect, it } from 'bun:test';
import { ParcelReconciliationActionType, ParcelReconciliationCaseType } from '@/db/schemas/enums';
import {
  getActionOptionsForCaseType,
  getDefaultActionTypeForCaseType,
} from '@/features/operations/parcel/components/parcel-reconciliation/utils';

describe('parcel reconciliation action options', () => {
  it.each([
    ParcelReconciliationCaseType.WRONG_AMOUNT,
    ParcelReconciliationCaseType.DATA_ENTRY_ERROR,
  ])('defaults amount/data errors to an original-shift correction', (caseType) => {
    expect(getDefaultActionTypeForCaseType(caseType)).toBe(
      ParcelReconciliationActionType.CORRECT_AMOUNT_IN_ORIGINAL_SESSION,
    );
  });

  it('does not offer direct amount correction for unrelated cases', () => {
    const actions = getActionOptionsForCaseType(ParcelReconciliationCaseType.SHORTAGE);
    expect(
      actions.some(
        ({ value }) => value === ParcelReconciliationActionType.CORRECT_AMOUNT_IN_ORIGINAL_SESSION,
      ),
    ).toBeFalse();
  });
});
