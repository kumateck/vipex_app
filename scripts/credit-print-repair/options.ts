const VALUE_FLAGS = new Set([
  '--company',
  '--payment-id',
  '--expected-amount-psw',
  '--actor-user-id',
  '--reason',
]);
const SWITCH_FLAGS = new Set(['--apply', '--confirm-no-cash-received']);
export { REPAIR_MARKER } from '../../src/server/features/maintenance/credit-repair';

export function parseRepairOptions(args: string[]) {
  const code = args[0]?.trim();
  if (!code || !/^[A-Za-z0-9][A-Za-z0-9-]{2,79}$/.test(code)) {
    throw new Error(
      'Usage: bun run scripts/repair-credit-print-payment.ts <booking-code> [--apply --confirm-no-cash-received]',
    );
  }
  const values = new Map<string, string>();
  const switches = new Set<string>();
  for (let index = 1; index < args.length; index++) {
    const flag = args[index]!;
    if (values.has(flag) || switches.has(flag)) throw new Error(`Repeated option: ${flag}`);
    if (SWITCH_FLAGS.has(flag)) {
      switches.add(flag);
    } else if (VALUE_FLAGS.has(flag)) {
      const value = args[++index]?.trim();
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
      values.set(flag, value);
    } else {
      throw new Error(`Unknown option: ${flag}`);
    }
  }
  for (const flag of ['--company', '--payment-id', '--actor-user-id']) {
    if (values.has(flag) && !/^[A-Za-z0-9-]{1,25}$/.test(values.get(flag)!)) {
      throw new Error(`Invalid identifier for ${flag}`);
    }
  }
  const expectedPsw = values.has('--expected-amount-psw')
    ? Number(values.get('--expected-amount-psw'))
    : undefined;
  if (expectedPsw !== undefined && (!Number.isSafeInteger(expectedPsw) || expectedPsw <= 0)) {
    throw new Error('--expected-amount-psw must be a positive whole number');
  }
  const reason =
    values.get('--reason') ??
    'Operator confirmed printing created this cash payment and no cash was received.';
  if (reason.length < 10 || reason.length > 900)
    throw new Error('Repair reason must contain 10–900 characters');
  const apply = switches.has('--apply');
  if (apply && !switches.has('--confirm-no-cash-received')) {
    throw new Error(
      'Apply requires --confirm-no-cash-received after confirming that no cash was received',
    );
  }
  return {
    code,
    companyId: values.get('--company'),
    paymentId: values.get('--payment-id'),
    expectedPsw,
    actorId: values.get('--actor-user-id') ?? null,
    reason,
    apply,
  };
}

export type RepairOptions = ReturnType<typeof parseRepairOptions>;
