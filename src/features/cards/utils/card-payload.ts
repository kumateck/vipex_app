import type { CardCreatePayload, CardMutationInput, CardUpdatePayload } from '../types/card.types';

export function toCreateCardPayload(
  input: CardMutationInput,
  context: { companyId: string; createdBy: string },
): CardCreatePayload {
  return {
    name: input.name.trim(),
    companyId: context.companyId,
    createdBy: context.createdBy,
  };
}

export function toUpdateCardPayload(input: CardMutationInput): CardUpdatePayload {
  return {
    name: input.name.trim(),
  };
}
