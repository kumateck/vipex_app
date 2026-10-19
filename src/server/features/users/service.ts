import { BadRequest, Forbidden, NotFound } from '../../utils/http-error';
import { BRANCH_TYPES, USER_TYPES } from '@/shared/access/constants';
import { BranchType, CashierType } from '@/db/schemas/enums';
import { getCashierTypeUpdate, normalizeCashierTypeByUserType } from './cashier-type';
import { sendPasswordSetupInvite } from './service.invite';
import {
  createUserRepo,
  getBranchScopeRepo,
  getLocationScopeRepo,
  getUserRepo,
  findUserByCompanyEmailRepo,
  listUserOptionsRepo,
  listUsersRepo,
  updateUserRepo,
  type ListUserParams,
} from './repository';

function normalizeUserEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function listUsersSvc(p: ListUserParams) {
  return listUsersRepo(p);
}
export async function listUserOptionsSvc(p: {
  companyId?: string | null;
  branchId?: string | null;
  locationId?: string | null;
  roleId?: string | null;
  userType?: number | null;
  status?: number | null;
  search?: string | null;
}) {
  return listUserOptionsRepo(p);
}
export async function getUserSvc(id: string) {
  const u = await getUserRepo(id);
  if (!u) throw NotFound('User not found');
  return u;
}

export async function createUserSvc(input: {
  fullname: string;
  telephone: string;
  email: string;
  employeeId?: string | null;
  status?: number;
  roleId: string;
  companyId: string;
  branchId: string;
  locationId?: string | null;
  userType: number;
  cashierType?: CashierType | null;
  createdBy: string;
  sendInvite?: boolean;
  actor: {
    companyId?: string | null;
    branchId?: string | null;
    branchType?: number | null;
    locationId?: string | null;
  };
}) {
  if (!input.fullname || !input.email || !input.telephone)
    throw BadRequest('Missing required fields');
  const normalizedEmail = normalizeUserEmail(input.email);
  if (!normalizedEmail) throw BadRequest('Email is required');

  if (!USER_TYPES.includes(input.userType as (typeof USER_TYPES)[number])) {
    throw BadRequest('Invalid user type');
  }

  const cashierType = normalizeCashierTypeByUserType(input.userType, input.cashierType);

  const targetBranch = await getBranchScopeRepo(input.branchId);
  if (!targetBranch) {
    throw BadRequest('Target branch does not exist');
  }

  if (targetBranch.companyId !== input.companyId) {
    throw Forbidden('Cannot create user outside your company');
  }

  if (!input.actor.companyId || input.actor.companyId !== input.companyId) {
    throw Forbidden('Authenticated actor company context mismatch');
  }

  const actorBranchType = input.actor.branchType;
  if (
    actorBranchType === null ||
    actorBranchType === undefined ||
    !BRANCH_TYPES.includes(actorBranchType as (typeof BRANCH_TYPES)[number])
  ) {
    throw Forbidden('Authenticated actor branch type is missing');
  }

  const isHeadOffice = actorBranchType === BranchType.HEADOFFICE;
  if (!isHeadOffice) {
    if (!input.actor.branchId || input.actor.branchId !== input.branchId) {
      throw Forbidden('You can only create users in your branch');
    }
  }

  if (input.locationId) {
    const targetLocation = await getLocationScopeRepo(input.locationId);
    if (!targetLocation) {
      throw BadRequest('Target location does not exist');
    }
    if (
      targetLocation.companyId !== input.companyId ||
      targetLocation.branchId !== input.branchId
    ) {
      throw Forbidden('Target location must belong to the selected branch');
    }
  }

  if (!isHeadOffice && input.actor.locationId) {
    if (!input.locationId || input.locationId !== input.actor.locationId) {
      throw Forbidden('You can only create users in your assigned location');
    }
  }

  const existingUser = await findUserByCompanyEmailRepo({
    companyId: input.companyId,
    email: normalizedEmail,
  });
  if (existingUser) {
    throw BadRequest('A user with this email already exists in this company');
  }

  const { sendInvite = true, actor: _actor, ...insertable } = input;
  const created = await createUserRepo({
    ...insertable,
    email: normalizedEmail,
    cashierType,
  });
  if (created?.id && sendInvite) {
    await sendPasswordSetupInvite(created.id, normalizedEmail);
  }
  return { id: created?.id };
}
export async function updateUserSvc(
  id: string,
  patch: {
    fullname?: string;
    telephone?: string;
    email?: string;
    status?: number;
    roleId?: string;
    branchId?: string;
    locationId?: string | null;
    userType?: number;
    cashierType?: CashierType | null;
  },
) {
  const cur = await getUserRepo(id);
  if (!cur) throw NotFound('User not found');
  const nextPatch = { ...patch };
  const normalizedEmail =
    nextPatch.email !== undefined ? normalizeUserEmail(nextPatch.email) : undefined;
  if (
    nextPatch.userType !== null &&
    nextPatch.userType !== undefined &&
    !USER_TYPES.includes(nextPatch.userType as (typeof USER_TYPES)[number])
  ) {
    throw BadRequest('Invalid user type');
  }

  Object.assign(nextPatch, getCashierTypeUpdate(cur, nextPatch));

  const nextBranchId = nextPatch.branchId ?? cur.branchId;
  if (nextPatch.branchId) {
    const targetBranch = await getBranchScopeRepo(nextPatch.branchId);
    if (!targetBranch) {
      throw BadRequest('Target branch does not exist');
    }
    if (targetBranch.companyId !== cur.companyId) {
      throw Forbidden('Cannot move user outside their company');
    }
  }

  if (nextPatch.locationId !== undefined) {
    if (nextPatch.locationId !== null) {
      const targetLocation = await getLocationScopeRepo(nextPatch.locationId);
      if (!targetLocation) {
        throw BadRequest('Target location does not exist');
      }
      if (targetLocation.companyId !== cur.companyId || targetLocation.branchId !== nextBranchId) {
        throw Forbidden('Target location must belong to the selected branch');
      }
    }
  } else if (nextPatch.branchId && cur.locationId) {
    const currentLocation = await getLocationScopeRepo(cur.locationId);
    if (currentLocation && currentLocation.branchId !== nextBranchId) {
      nextPatch.locationId = null;
    }
  }

  if (normalizedEmail !== undefined) {
    if (!normalizedEmail) {
      throw BadRequest('Email is required');
    }
    const existingUser = await findUserByCompanyEmailRepo({
      companyId: cur.companyId,
      email: normalizedEmail,
      excludeUserId: id,
    });
    if (existingUser) {
      throw BadRequest('A user with this email already exists in this company');
    }
    nextPatch.email = normalizedEmail;
  }

  const updated = await updateUserRepo(id, nextPatch);
  if (!updated) throw NotFound('User not found');
  return { id: updated.id };
}
