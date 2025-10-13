import {
  t,
  UUID,
  Email,
  Telephone,
  NonEmptyString255,
  PaginationQuery,
  SmallInt,
} from '../../schemas/common';

// Request schemas
export const ListUsersQuery = PaginationQuery;

export const GetUserParams = t.Object({
  id: UUID,
});

export const CreateUserBody = t.Object({
  fullname: NonEmptyString255,
  email: Email,
  telephone: Telephone,
  // password: t.String({ minLength: 8, maxLength: 128 }),
  companyId: UUID,
  branchId: UUID,
  roleId: UUID,
  // In real auth, createdBy comes from auth context; for now accept it in body
  createdBy: UUID,
  // No password here – invites will handle password setup
  // Optional flag to control emailing (defaults true)
  sendInvite: t.Optional(t.Boolean()),
});

// Response DTOs
export const UserDto = t.Object({
  id: UUID,
  fullname: NonEmptyString255,
  email: Email,
  telephone: Telephone,
  status: SmallInt,
  companyId: UUID,
  branchId: UUID,
  createdAt: t.Union([t.String({ format: 'date-time' }), t.Null()]),
});

export const ListUsersResponse = t.Object({
  data: t.Array(UserDto),
  nextCursor: t.Union([t.String(), t.Null()]),
});

export const CreateUserResponse = t.Object({
  id: UUID,
});

// Types inferred from schemas (Elysia attaches .static)
export type TCreateUserBody = typeof CreateUserBody.static;
export type TGetUserParams = typeof GetUserParams.static;
export type TListUsersQuery = typeof ListUsersQuery.static;
