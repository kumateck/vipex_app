import type { DeliveryHandoverInput } from '../types';

export function submitRiderHandover(
  input: DeliveryHandoverInput,
  riderUserId: string,
  submit: (body: DeliveryHandoverInput & { riderUserId: string }) => Promise<{ id: string }>,
) {
  return submit({ ...input, riderUserId });
}
