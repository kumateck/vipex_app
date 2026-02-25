import type { ServerListQuery } from '@/services/rtk-query';

export interface User {
  id: string;
  fullname: string;
  telephone: string;
  email: string;
  status: number;
  roleId: string;
  companyId: string;
  branchId: string;
  createdBy: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  roleName?: string | null;
  branchName?: string | null;
  companyName?: string | null;
}

export type UserFilters = {
  companyId?: string | null;
  branchId?: string | null;
  roleId?: string | null;
  status?: number | null;
};

export type UserListQuery = ServerListQuery<UserFilters>;

export interface UserMutationInput {
  fullname: string;
  telephone: string;
  email: string;
  status: number;
  roleId: string;
  branchId: string;
}

export interface UserCreatePayload extends UserMutationInput {
  companyId: string;
  createdBy: string;
}
