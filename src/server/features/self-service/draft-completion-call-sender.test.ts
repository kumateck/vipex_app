import { describe, expect, test } from 'bun:test';
import { resolveCompletedCallSender } from './draft-completion-call-sender';

describe('self-service completion CS choice', () => {
  test('keeps the customer choice when an older officer client omits CS', () => {
    expect(resolveCompletedCallSender(true)).toBe(true);
    expect(resolveCompletedCallSender(false)).toBe(false);
  });

  test('allows the officer to add or clear CS explicitly', () => {
    expect(resolveCompletedCallSender(false, true)).toBe(true);
    expect(resolveCompletedCallSender(true, false)).toBe(false);
  });
});
