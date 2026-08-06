import {
  t,
  UUID,
  Email,
  Telephone,
  NonEmptyString255,
  PaginationMetaSchema,
  PaginationRequestQuery,
  SmallInt,
} from '../../schemas/common';
import { CASHIER_TYPES, USER_TYPES } from '@/shared/access/constants';

// Request schemas
export const ListUsersQuery = PaginationRequestQuery;

export const GetUserParams = t.Object({
  id: UUID,
});

export const CreateUserBody = t.Object({
  fullname: NonEmptyString255,
  email: Email,
  telephone: Telephone,
  // password: t.String({ minLength: 8, maxLength: 128 }),
  branchId: UUID,
  locationId: t.Optional(t.Union([UUID, t.Null()])),
  roleId: UUID,
  userType: t.Union(USER_TYPES.map((value) => t.Literal(value))),
  cashierType: t.Optional(t.Union([...CASHIER_TYPES.map((value) => t.Literal(value)), t.Null()])),
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
  locationId: t.Optional(t.Union([UUID, t.Null()])),
  userType: t.Union(USER_TYPES.map((value) => t.Literal(value))),
  cashierType: t.Optional(t.Union([...CASHIER_TYPES.map((value) => t.Literal(value)), t.Null()])),
  createdAt: t.Union([t.String({ format: 'date-time' }), t.Null()]),
});

export const ListUsersResponse = t.Object({
  data: t.Array(UserDto),
  meta: PaginationMetaSchema,
});

export const CreateUserResponse = t.Object({
  id: UUID,
});

// Types inferred from schemas (Elysia attaches .static)
export type TCreateUserBody = typeof CreateUserBody.static;
export type TGetUserParams = typeof GetUserParams.static;
export type TListUsersQuery = typeof ListUsersQuery.static;
