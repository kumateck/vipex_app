import { describe, expect, test } from 'bun:test';
import { parseRepairOptions } from '../../scripts/credit-print-repair';

describe('credit print repair command options', () => {
  test('requires only a booking code for a dry run', () => {
    const options = parseRepairOptions(['AO4858124I']);
    expect(options.code).toBe('AO4858124I');
    expect(options.apply).toBe(false);
    expect(options.companyId).toBeUndefined();
    expect(options.paymentId).toBeUndefined();
    expect(options.expectedPsw).toBeUndefined();
    expect(options.actorId).toBeNull();
  });
  test('apply needs no internal identifiers but requires no-cash confirmation', () => {
    expect(() => parseRepairOptions(['AO4858124I', '--apply'])).toThrow('confirm-no-cash-received');
    expect(parseRepairOptions(['AO4858124I', '--apply', '--confirm-no-cash-received']).apply).toBe(
      true,
    );
  });
  const invalidArgs = [
    [],
    ['--apply'],
    ['AO4858124I', '--company'],
    ['AO4858124I', '--aply'],
    ['AO4858124I', '--expected-amount-psw', '0'],
    ['AO4858124I', '--expected-amount-psw', '1.5'],
    ['AO4858124I', '--apply', '--apply'],
    ['AO4858124I', '--reason', 'short'],
  ];
  test.each(invalidArgs.map((args) => ({ args })))('rejects malformed arguments %j', ({ args }) => {
    expect(() => parseRepairOptions(args)).toThrow();
  });
});
