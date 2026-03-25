import type {
  StatusCreatePayload,
  StatusMutationInput,
  StatusUpdatePayload,
} from '../types/status.types';

export function toCreateStatusPayload(
  input: StatusMutationInput,
  context: { companyId: string; createdBy: string },
): StatusCreatePayload {
  return {
    name: input.name.trim(),
    color: input.color.trim(),
    companyId: context.companyId,
    createdBy: context.createdBy,
  };
}

export function toUpdateStatusPayload(input: StatusMutationInput): StatusUpdatePayload {
  return {
    name: input.name.trim(),
    color: input.color.trim(),
  };
}
