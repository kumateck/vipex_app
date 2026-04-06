import {
  BranchType as BranchTypeEnum,
  CashierType as CashierTypeEnum,
  UserType as UserTypeEnum,
} from '@/db/schemas/enums';

export type BranchType = BranchTypeEnum;
export type UserType = UserTypeEnum;
export type CashierType = CashierTypeEnum;

export const BRANCH_TYPES = [BranchTypeEnum.HEADOFFICE, BranchTypeEnum.AGENCY] as const;
export const USER_TYPES = [UserTypeEnum.STAFF, UserTypeEnum.CASHIER, UserTypeEnum.RIDER] as const;
export const CASHIER_TYPES = [
  CashierTypeEnum.SENDING,
  CashierTypeEnum.TOBEPAID,
  CashierTypeEnum.DELIVERY,
  CashierTypeEnum.FULL,
] as const;

export const BRANCH_TYPE_LABELS: Record<BranchType, string> = {
  [BranchTypeEnum.HEADOFFICE]: 'Head Office',
  [BranchTypeEnum.AGENCY]: 'Agency',
};

export const USER_TYPE_LABELS: Record<UserType, string> = {
  [UserTypeEnum.STAFF]: 'Staff',
  [UserTypeEnum.CASHIER]: 'Cashier',
  [UserTypeEnum.RIDER]: 'Rider',
};

export const CASHIER_TYPE_LABELS: Record<CashierType, string> = {
  [CashierTypeEnum.SENDING]: 'Sender cashier',
  [CashierTypeEnum.TOBEPAID]: 'Receiver cashier',
  [CashierTypeEnum.DELIVERY]: 'Delivery cashier',
  [CashierTypeEnum.FULL]: 'Full cashier',
};
