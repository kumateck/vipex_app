import { describe, expect, it } from 'bun:test';
import { BranchType } from '@/db/schemas/enums';
import { sanitizeBranchMutationInput } from './branch-payload';

const BASE_INPUT = {
  name: 'Accra',
  type: BranchType.AGENCY,
  telephone: null,
  address: null,
  email: null,
};

describe('branch OTP settings payload', () => {
  it('defaults both OTP requirements to enabled', () => {
    const result = sanitizeBranchMutationInput(BASE_INPUT);
    expect(result.requirePickupOtp).toBeTrue();
    expect(result.requireReceiverOtp).toBeTrue();
  });

  it('preserves an intentional branch-level OTP bypass', () => {
    const result = sanitizeBranchMutationInput({
      ...BASE_INPUT,
      requirePickupOtp: false,
      requireReceiverOtp: false,
    });
    expect(result.requirePickupOtp).toBeFalse();
    expect(result.requireReceiverOtp).toBeFalse();
  });
});
