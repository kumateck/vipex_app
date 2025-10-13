import { t } from 'elysia';
import { UUID, NonEmptyString255, PaginationQuery } from '../../schemas/common';

export const ListBranchesQuery = t.Intersect([
  PaginationQuery,
  t.Object({
    companyId: t.Optional(UUID), // optional filter
  }),
]);

export const GetBranchParams = t.Object({
  id: UUID,
});

export const CreateBranchBody = t.Object({
  name: NonEmptyString255,
  companyId: UUID,
  address: t.Optional(t.String({ maxLength: 500 })),
  telephone: t.Optional(t.String({ maxLength: 30 })),
});

export const UpdateBranchBody = t.Object({
  name: t.Optional(NonEmptyString255),
  address: t.Optional(t.String({ maxLength: 500 })),
  telephone: t.Optional(t.String({ maxLength: 30 })),
});

export const BranchDto = t.Object({
  id: UUID,
  name: NonEmptyString255,
  companyId: UUID,
  address: t.Optional(t.String({ maxLength: 500 })),
  telephone: t.Optional(t.String({ maxLength: 30 })),
  createdAt: t.Union([t.String({ format: 'date-time' }), t.Null()]),
});

export const ListBranchesResponse = t.Object({
  data: t.Array(BranchDto),
  nextCursor: t.Union([t.String(), t.Null()]),
});

export const CreateBranchResponse = t.Object({
  id: UUID,
});
