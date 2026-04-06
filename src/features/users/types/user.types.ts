import type { CashierType, UserType } from '@/shared/access/constants';
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
  locationId?: string | null;
  locationName?: string | null;
  userType: UserType;
  cashierType?: CashierType | null;
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
  locationId?: string | null;
  roleId?: string | null;
  userType?: UserType | null;
  cashierType?: CashierType | null;
  status?: number | null;
  statuses?: string | null;
};

export type UserListQuery = ServerListQuery<UserFilters>;

export interface UserMutationInput {
  fullname: string;
  telephone: string;
  email: string;
  status: number;
  roleId: string;
  branchId: string;
  locationId?: string | null;
  userType: UserType;
  cashierType?: CashierType | null;
  sendInvite?: boolean;
}

export type UserCreatePayload = UserMutationInput;
