import { t } from 'elysia';
import { UUID, NonEmptyString255, PaginationQuery } from '../../schemas/common';

export const StatusDto = t.Object({
  id: UUID,
  companyId: UUID,
  name: NonEmptyString255,
  color: NonEmptyString255,
  isDeleted: t.Boolean(),
  createdBy: UUID,
  createdAt: t.Union([t.String({ format: 'date-time' }), t.Null()]),
  updatedAt: t.Union([t.String({ format: 'date-time' }), t.Null()]),
});

export const ListStatusesQuery = t.Intersect([
  PaginationQuery,
  t.Object({
    companyId: t.Optional(UUID),
    includeDeleted: t.Optional(t.Boolean()),
  }),
]);

export const GetStatusParams = t.Object({
  id: UUID,
});

export const CreateStatusBody = t.Object({
  companyId: UUID,
  name: NonEmptyString255,
  color: NonEmptyString255,
  createdBy: UUID,
});

export const UpdateStatusBody = t.Object({
  name: t.Optional(NonEmptyString255),
  color: t.Optional(NonEmptyString255),
});

export const ListStatusesResponse = t.Object({
  data: t.Array(StatusDto),
  nextCursor: t.Union([t.String(), t.Null()]),
});

export const CreateStatusResponse = t.Object({
  id: UUID,
});

export const DeleteStatusResponse = t.Object({
  success: t.Boolean(),
});

export const RestoreStatusResponse = t.Object({
  success: t.Boolean(),
});
