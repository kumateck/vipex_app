import { signAccessToken } from '@/server/utils/jwt';

type CreateTestAccessTokenInput = {
  userId: string;
  email: string;
  permissions: string[];
  employeeId?: string | null;
  roleId?: string | null;
  companyId?: string | null;
  branchId?: string | null;
  branchType?: number | null;
  locationId?: string | null;
  userType?: number | null;
  cashierType?: number | null;
};

export async function createTestAccessToken(input: CreateTestAccessTokenInput) {
  void input.permissions;

  return signAccessToken({
    sub: input.userId,
    email: input.email,
    employeeId: input.employeeId ?? null,
    roleId: input.roleId ?? null,
    companyId: input.companyId ?? null,
    branchId: input.branchId ?? null,
    branchType: input.branchType ?? null,
    locationId: input.locationId ?? null,
    userType: input.userType ?? null,
    cashierType: input.cashierType ?? null,
  });
}
