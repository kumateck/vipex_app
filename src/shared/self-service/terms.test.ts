import { describe, expect, test } from 'bun:test';
import { SELF_SERVICE_TERMS_VERSION, hasAcceptedCurrentSelfServiceTerms } from './terms';

describe('self-service terms acceptance', () => {
  test('accepts an explicit agreement to the current terms version', () => {
    expect(
      hasAcceptedCurrentSelfServiceTerms({
        termsAccepted: true,
        termsVersion: SELF_SERVICE_TERMS_VERSION,
      }),
    ).toBe(true);
  });

  test.each([
    { termsAccepted: false, termsVersion: SELF_SERVICE_TERMS_VERSION },
    { termsAccepted: undefined, termsVersion: SELF_SERVICE_TERMS_VERSION },
    { termsAccepted: true, termsVersion: 'outdated' },
  ])('rejects missing, false, or outdated consent', (input) => {
    expect(hasAcceptedCurrentSelfServiceTerms(input)).toBe(false);
  });
});
