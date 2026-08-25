import { t } from 'elysia';
import {
  UUID,
  NonEmptyString255,
  PaginationMetaSchema,
  PaginationRequestQueryProps,
} from '../../schemas/common';

export const ListBranchesQuery = t.Object({
  ...PaginationRequestQueryProps,
  companyId: t.Optional(UUID), // optional filter
});

export const GetBranchParams = t.Object({
  id: UUID,
});

export const CreateBranchBody = t.Object({
  name: NonEmptyString255,
  companyId: UUID,
  address: t.Optional(t.String({ maxLength: 500 })),
  telephone: t.Optional(t.String({ maxLength: 30 })),
  requirePickupOtp: t.Optional(t.Boolean()),
  requireReceiverOtp: t.Optional(t.Boolean()),
});

export const UpdateBranchBody = t.Object({
  name: t.Optional(NonEmptyString255),
  address: t.Optional(t.String({ maxLength: 500 })),
  telephone: t.Optional(t.String({ maxLength: 30 })),
  requirePickupOtp: t.Optional(t.Boolean()),
  requireReceiverOtp: t.Optional(t.Boolean()),
});

export const BranchDto = t.Object({
  id: UUID,
  name: NonEmptyString255,
  companyId: UUID,
  address: t.Optional(t.String({ maxLength: 500 })),
  telephone: t.Optional(t.String({ maxLength: 30 })),
  requirePickupOtp: t.Boolean(),
  requireReceiverOtp: t.Boolean(),
  createdAt: t.Union([t.String({ format: 'date-time' }), t.Null()]),
});

export const ListBranchesResponse = t.Object({
  data: t.Array(BranchDto),
  meta: PaginationMetaSchema,
});

export const CreateBranchResponse = t.Object({
  id: UUID,
});
