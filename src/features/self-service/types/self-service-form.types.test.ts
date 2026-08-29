import { describe, expect, test } from 'bun:test';
import {
  SELF_SERVICE_STAGE_FIELDS,
  createInitialSelfServiceFormValues,
} from './self-service-form.types';

describe('self-service terms form state', () => {
  test('starts unticked and validates consent during review', () => {
    expect(createInitialSelfServiceFormValues().acceptedTerms).toBe(false);
    expect(SELF_SERVICE_STAGE_FIELDS.review).toContain('acceptedTerms');
  });
});
