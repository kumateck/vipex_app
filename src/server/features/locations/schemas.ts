import { t } from 'elysia';
import {
  UUID,
  NonEmptyString255,
  PaginationMetaSchema,
  PaginationRequestQueryProps,
} from '../../schemas/common';

export const ListLocationsQuery = t.Object({
  ...PaginationRequestQueryProps,
  companyId: t.Optional(UUID),
  branchId: t.Optional(UUID),
  includeDeleted: t.Optional(t.Boolean()),
});

export const GetLocationParams = t.Object({
  id: UUID,
});

export const CreateLocationBody = t.Object({
  name: NonEmptyString255,
  companyId: UUID,
  // Make branchId required to enforce branch-wise uniqueness and FK
  branchId: UUID,
  address: t.Optional(t.String({ maxLength: 500 })),
  telephone: t.Optional(t.String({ maxLength: 30 })),
});

export const UpdateLocationBody = t.Object({
  name: t.Optional(NonEmptyString255),
  branchId: t.Optional(UUID),
  address: t.Optional(t.String({ maxLength: 500 })),
  telephone: t.Optional(t.String({ maxLength: 30 })),
});

export const LocationDto = t.Object({
  id: UUID,
  name: NonEmptyString255,
  companyId: UUID,
  branchId: UUID,
  branch: t.Union([
    t.Object({
      id: UUID,
      name: NonEmptyString255,
    }),
    t.Null(),
  ]),
  isDeleted: t.Boolean(),
  createdBy: UUID,
  createdAt: t.Union([t.String({ format: 'date-time' }), t.Null()]),
  updatedAt: t.Union([t.String({ format: 'date-time' }), t.Null()]),
});

export const ListLocationsResponse = t.Object({
  data: t.Array(LocationDto),
  meta: PaginationMetaSchema,
});

export const CreateLocationResponse = t.Object({
  id: UUID,
});
