import type { AuthUser } from '@/server/plugins/auth';
import {
  blockCustomerWalletAccountSvc,
  listCustomerWalletAccountsSvc,
  postCustomerWalletPaymentSvc,
  unblockCustomerWalletAccountSvc,
  type ListCustomerWalletAccountsQuery,
} from './service';

export async function listCustomerWalletAccountsCtrl(
  user: AuthUser,
  query: ListCustomerWalletAccountsQuery,
) {
  return listCustomerWalletAccountsSvc(user.companyId!, query);
}

export async function listCustomerWalletApprovalsCtrl(
  user: AuthUser,
  query: ListCustomerWalletAccountsQuery,
) {
  return listCustomerWalletAccountsSvc(user.companyId!, {
    ...query,
    filters: {
      ...(query.filters ?? {}),
      approvalOnly: true,
    },
  });
}

export async function postCustomerWalletPaymentCtrl(
  user: AuthUser,
  customerId: string,
  body: { amountCedis: number | string; notes?: string | null; referenceId?: string | null },
) {
  return postCustomerWalletPaymentSvc({
    companyId: user.companyId!,
    customerId,
    actorUserId: user.sub,
    amountCedis: body.amountCedis,
    notes: body.notes ?? null,
    referenceId: body.referenceId ?? null,
  });
}

export async function blockCustomerWalletAccountCtrl(user: AuthUser, customerId: string) {
  return blockCustomerWalletAccountSvc({
    companyId: user.companyId!,
    customerId,
    actorUserId: user.sub,
  });
}

export async function unblockCustomerWalletAccountCtrl(user: AuthUser, customerId: string) {
  return unblockCustomerWalletAccountSvc({
    companyId: user.companyId!,
    customerId,
    actorUserId: user.sub,
  });
}
