import { PermissionKeys } from '@/shared/permissions/constants';
import { BadRequest, Forbidden, NotFound } from '@/server/utils/http-error';
import type {
  BranchSwitchChoice,
  BranchSwitchOptions,
  SessionBranch,
  SessionLocation,
} from '@/shared/auth/branch-switch';
import {
  getBranchSwitchAccountRepo,
  listBranchSwitchChoicesRepo,
  type BranchSwitchAccount,
} from './branch-session.repository';
import { listRolePermissionKeysRepo } from './repository';

export type BranchSessionScope = {
  branch: SessionBranch;
  location: SessionLocation | null;
};

async function requireSwitchAccount(userId: string) {
  const account = await getBranchSwitchAccountRepo(userId);
  if (!account) throw Forbidden('You do not have permission to switch branches');
  return account;
}

export async function listSessionBranchOptions(
  userId: string,
  current: BranchSwitchChoice,
): Promise<BranchSwitchOptions> {
  const account = await requireSwitchAccount(userId);
  const rows = await listBranchSwitchChoicesRepo(account);
  const options = new Map<string, BranchSwitchOptions['branches'][number]>();
  for (const { branch, location } of rows) {
    let option = options.get(branch.id);
    if (!option) {
      option = { ...branch, locations: [] };
      options.set(branch.id, option);
    }
    if (location) option.locations.push(location);
  }
  return { current, branches: [...options.values()] };
}

async function findScope(account: BranchSwitchAccount, choice: BranchSwitchChoice) {
  const rows = await listBranchSwitchChoicesRepo(account, choice.branchId);
  return {
    branchExists: rows.length > 0,
    scope: rows.find(({ location }) => (location?.id ?? null) === choice.locationId),
  };
}

export async function resolveBranchSwitch(userId: string, choice: BranchSwitchChoice) {
  const account = await requireSwitchAccount(userId);
  const { branchExists, scope } = await findScope(account, choice);
  if (!branchExists) throw NotFound('Branch is unavailable for switching');
  if (!scope) throw BadRequest('Select an available location in the chosen branch');
  return { account, scope };
}

export async function getSwitchedSessionScope(userId: string, choice: BranchSwitchChoice) {
  const account = await getBranchSwitchAccountRepo(userId);
  if (!account) return null;
  const [{ scope }, permissions] = await Promise.all([
    findScope(account, choice),
    listRolePermissionKeysRepo(account.roleId, account.companyId),
  ]);
  return scope && permissions.includes(PermissionKeys.CanSwitchBranch)
    ? { account, scope, permissions }
    : null;
}
