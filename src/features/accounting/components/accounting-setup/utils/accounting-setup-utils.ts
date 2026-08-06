import { AccountClass, ExpenseFundingSource } from '@/db/schemas/enums';
import type {
  AccountMutationInput,
  ApprovalPolicyMutationInput,
  CompanyBankAccountMutationInput,
  ExpenseCategoryMutationInput,
  TaxComponentMutationInput,
  TaxProfileMutationInput,
} from '../../../api';
import type { PolicyCodeOption } from '../types/accounting-setup.types';

export const NO_PARENT = '__none__';
export const ALL_FUNDING_SOURCES = '__all__';
export const ALL_TAX_PROFILES = '__all__';

export const ACCOUNT_CLASS_OPTIONS = [
  { value: String(AccountClass.ASSET), label: 'Asset' },
  { value: String(AccountClass.LIABILITY), label: 'Liability' },
  { value: String(AccountClass.EQUITY), label: 'Equity' },
  { value: String(AccountClass.INCOME), label: 'Income' },
  { value: String(AccountClass.EXPENSE), label: 'Expense' },
];

export const FUNDING_SOURCE_OPTIONS = [
  { value: ALL_FUNDING_SOURCES, label: 'All funding sources' },
  { value: String(ExpenseFundingSource.PETTY_CASH), label: 'Petty Cash' },
  { value: String(ExpenseFundingSource.SALES_CASH), label: 'Sales Cash' },
  { value: String(ExpenseFundingSource.COMPANY_BANK), label: 'Company Bank' },
];

const MANUAL_JOURNAL_POLICY_CODES = new Set([
  'MANUAL_JOURNAL',
  'MANUAL_JOURNAL_ENTRY',
  'MANUAL_ENTRY',
]);

export const APPROVAL_POLICY_CODE_OPTIONS: PolicyCodeOption[] = [
  {
    value: 'MANUAL_JOURNAL',
    label: 'Manual Journal Entries',
    defaultName: 'Manual journal posting approval',
    description: 'Uses threshold + auto-authorize toggle; above-threshold always queues.',
    defaultFundingScope: ALL_FUNDING_SOURCES,
  },
  {
    value: 'EXPENSE_REQUEST',
    label: 'Expense Request Approval',
    defaultName: 'Expense request approval policy',
    description: 'Controls expense approval limits and escalation behavior.',
    defaultFundingScope: ALL_FUNDING_SOURCES,
  },
  {
    value: 'PETTY_CASH_REPLENISHMENT',
    label: 'Petty Cash Replenishment',
    defaultName: 'Petty cash replenishment approval',
    description: 'Used for petty cash top-up approvals.',
    defaultFundingScope: String(ExpenseFundingSource.PETTY_CASH),
  },
  {
    value: 'CASH_TO_BANK_TRANSFER',
    label: 'Cash To Bank Transfer',
    defaultName: 'Cash to bank transfer approval',
    description: 'Used for branch cash lodgement controls.',
    defaultFundingScope: String(ExpenseFundingSource.SALES_CASH),
  },
  {
    value: 'DAILY_CASH_CONFIRMATION',
    label: 'Daily Cash Confirmation',
    defaultName: 'Daily cash confirmation approval',
    description: 'Used for daily cash confirmation and posting controls.',
    defaultFundingScope: String(ExpenseFundingSource.SALES_CASH),
  },
  {
    value: 'TAX_FILING',
    label: 'Tax Filing',
    defaultName: 'Tax filing approval policy',
    description: 'Used for filing review/closure approval flow.',
    defaultFundingScope: ALL_FUNDING_SOURCES,
  },
  {
    value: 'PAYMENT_REVERSAL',
    label: 'Payment Reversal',
    defaultName: 'Payment reversal approval policy',
    description: 'Used for high-risk payment reversal actions.',
    defaultFundingScope: ALL_FUNDING_SOURCES,
  },
  {
    value: 'PARCEL_DELETE',
    label: 'Parcel Delete Approval',
    defaultName: 'Parcel deletion approval policy',
    description: 'Used for soft-delete parcel approval controls.',
    defaultFundingScope: ALL_FUNDING_SOURCES,
  },
];

export function toPolicyCodeLabel(code: string) {
  return code
    .split('_')
    .filter(Boolean)
    .map((segment) => `${segment.slice(0, 1)}${segment.slice(1).toLowerCase()}`)
    .join(' ');
}

export function accountClassLabel(accountClass: number) {
  switch (accountClass) {
    case AccountClass.ASSET:
      return 'Asset';
    case AccountClass.LIABILITY:
      return 'Liability';
    case AccountClass.EQUITY:
      return 'Equity';
    case AccountClass.INCOME:
      return 'Income';
    case AccountClass.EXPENSE:
      return 'Expense';
    default:
      return `Class ${accountClass}`;
  }
}

export function parseDateInputValue(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function toDateInputValue(date?: Date) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createEmptyAccountForm(companyId: string): AccountMutationInput {
  return {
    companyId,
    code: '',
    name: '',
    label: '',
    accountClass: AccountClass.ASSET,
    parentAccountId: null,
    isPostable: true,
    active: true,
    syncLinkedCategory: true,
  };
}

export function createEmptyExpenseCategoryForm(companyId: string): ExpenseCategoryMutationInput {
  return {
    companyId,
    code: '',
    name: '',
    accountId: '',
    active: true,
  };
}

export function createEmptyApprovalPolicyForm(companyId: string) {
  return {
    companyId,
    policyCode: '',
    name: '',
    amountLimitCedis: '',
    autoAuthorizeBelowThreshold: true,
    requiresHeadOfficeApproval: false,
    appliesToFundingSource: ALL_FUNDING_SOURCES,
    active: true,
  };
}

export function createEmptyBankAccountForm(companyId: string): CompanyBankAccountMutationInput {
  return {
    companyId,
    accountId: '',
    name: '',
    bankName: '',
    branchName: '',
    accountNumberMasked: '',
    active: true,
  };
}

export function createEmptyTaxProfileForm(companyId: string): TaxProfileMutationInput {
  return {
    companyId,
    name: '',
    active: true,
  };
}

export function todayDateValue() {
  return new Date().toISOString().slice(0, 10);
}

export function createEmptyTaxComponentForm(
  companyId: string,
  profileId = '',
): TaxComponentMutationInput {
  return {
    companyId,
    profileId,
    key: '',
    numerator: 0,
    denominator: 1,
    inclusive: true,
    sortOrder: 0,
    startsAt: todayDateValue(),
    endsAt: null,
    active: true,
  };
}

export function parseMoneyToPesewas(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

export function isManualJournalPolicyCode(policyCode: string) {
  return MANUAL_JOURNAL_POLICY_CODES.has(policyCode.trim().toUpperCase());
}

export function getPolicyTemplate(policyCode: string) {
  const normalized = policyCode.trim().toUpperCase();
  return APPROVAL_POLICY_CODE_OPTIONS.find((option) => option.value === normalized);
}

export function normalizePolicyInputToCode(input: string) {
  return input.trim().toUpperCase().replace(/\s+/g, '_');
}

export function toApprovalPolicyPayload(form: {
  companyId: string;
  policyCode: string;
  name: string;
  amountLimitCedis: string;
  autoAuthorizeBelowThreshold: boolean;
  requiresHeadOfficeApproval: boolean;
  appliesToFundingSource: string;
  active: boolean;
}): ApprovalPolicyMutationInput | null {
  const amountLimitPsw = parseMoneyToPesewas(form.amountLimitCedis);
  if (amountLimitPsw == null) return null;

  const normalizedPolicyCode = form.policyCode.trim().toUpperCase();
  const isManualJournalPolicy = isManualJournalPolicyCode(normalizedPolicyCode);

  return {
    companyId: form.companyId,
    policyCode: normalizedPolicyCode,
    name: form.name.trim(),
    amountLimitPsw,
    autoAuthorizeBelowThreshold: form.autoAuthorizeBelowThreshold,
    requiresHeadOfficeApproval: form.requiresHeadOfficeApproval,
    appliesToFundingSource: isManualJournalPolicy
      ? null
      : form.appliesToFundingSource === ALL_FUNDING_SOURCES
        ? null
        : Number(form.appliesToFundingSource),
    active: form.active,
  };
}
