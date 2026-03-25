import 'dotenv/config';
import { createId } from '@paralleldrive/cuid2';
import { and, eq, or, sql } from 'drizzle-orm';
import { db } from '../src/db/config';
import {
  accountingApprovalPolicies,
  branches,
  chartOfAccounts,
  companies,
  companyBankAccounts,
  expenseCategories,
  pettyCashFunds,
  taxComponents,
  taxProfiles,
  users,
} from '@/db/schemas';
import { AccountClass, ExpenseFundingSource } from '@/db/schemas/enums';

type SeedAccount = {
  code: string;
  name: string;
  accountClass: AccountClass;
  parentCode?: string;
  isPostable?: boolean;
};

const ACCOUNT_DEFINITIONS: SeedAccount[] = [
  {
    code: '1000',
    name: 'Cash and Cash Equivalents',
    accountClass: AccountClass.ASSET,
    isPostable: false,
  },
  {
    code: '1010',
    name: 'Company Bank - Main',
    accountClass: AccountClass.ASSET,
    parentCode: '1000',
  },
  {
    code: '1020',
    name: 'Company Bank - Secondary',
    accountClass: AccountClass.ASSET,
    parentCode: '1000',
  },
  {
    code: '1100',
    name: 'Cash on Hand - Branch Control',
    accountClass: AccountClass.ASSET,
    parentCode: '1000',
  },
  {
    code: '1110',
    name: 'Petty Cash - Branch',
    accountClass: AccountClass.ASSET,
    parentCode: '1000',
  },
  {
    code: '1120',
    name: 'Confirmed Sales Cash - Branch',
    accountClass: AccountClass.ASSET,
    parentCode: '1000',
  },
  { code: '1200', name: 'Staff and Branch Advances', accountClass: AccountClass.ASSET },
  { code: '1300', name: 'Accounts Receivable', accountClass: AccountClass.ASSET },
  { code: '1400', name: 'Inventory', accountClass: AccountClass.ASSET },
  { code: '1500', name: 'Fixed Assets', accountClass: AccountClass.ASSET },
  { code: '2000', name: 'Accounts Payable', accountClass: AccountClass.LIABILITY },
  { code: '2100', name: 'Accrued Expenses', accountClass: AccountClass.LIABILITY },
  { code: '2200', name: 'Taxes Payable', accountClass: AccountClass.LIABILITY },
  { code: '2300', name: 'Inter-Office Clearing', accountClass: AccountClass.LIABILITY },
  { code: '3000', name: 'Owner Capital', accountClass: AccountClass.EQUITY },
  { code: '3100', name: 'Retained Earnings', accountClass: AccountClass.EQUITY },
  { code: '3200', name: 'Current Year Earnings', accountClass: AccountClass.EQUITY },
  { code: '4000', name: 'Parcel Revenue', accountClass: AccountClass.INCOME },
  { code: '4010', name: 'Delivery Revenue', accountClass: AccountClass.INCOME },
  { code: '4020', name: 'Other Income', accountClass: AccountClass.INCOME },
  { code: '4030', name: 'Cash Overage Income', accountClass: AccountClass.INCOME },
  { code: '5000', name: 'Fuel Expense', accountClass: AccountClass.EXPENSE },
  { code: '5010', name: 'Printing', accountClass: AccountClass.EXPENSE },
  { code: '5020', name: 'Stationery', accountClass: AccountClass.EXPENSE },
  { code: '5030', name: 'T&T', accountClass: AccountClass.EXPENSE },
  { code: '5040', name: 'Health & Safety', accountClass: AccountClass.EXPENSE },
  { code: '5050', name: 'Utilities', accountClass: AccountClass.EXPENSE },
  { code: '5060', name: 'Parking Fee', accountClass: AccountClass.EXPENSE },
  { code: '5070', name: 'Car Maintenance', accountClass: AccountClass.EXPENSE },
  { code: '5080', name: 'Repairs & Maintenance', accountClass: AccountClass.EXPENSE },
  { code: '5090', name: 'Donation', accountClass: AccountClass.EXPENSE },
  { code: '5100', name: 'Imprest Expense', accountClass: AccountClass.EXPENSE },
  { code: '5110', name: 'Cleaning & Sanitation', accountClass: AccountClass.EXPENSE },
  { code: '5120', name: 'Legal', accountClass: AccountClass.EXPENSE },
  { code: '5130', name: 'Allowance & Bonus', accountClass: AccountClass.EXPENSE },
  { code: '5140', name: 'Telephone & Communication', accountClass: AccountClass.EXPENSE },
  { code: '5150', name: 'Courier Service', accountClass: AccountClass.EXPENSE },
  { code: '5160', name: 'Rent', accountClass: AccountClass.EXPENSE },
  { code: '5170', name: 'Management Refreshment', accountClass: AccountClass.EXPENSE },
  { code: '5180', name: 'General Expense', accountClass: AccountClass.EXPENSE },
  { code: '5190', name: 'Compensation', accountClass: AccountClass.EXPENSE },
  { code: '5200', name: 'Insurance', accountClass: AccountClass.EXPENSE },
  { code: '5210', name: 'Cash Shortage Expense', accountClass: AccountClass.EXPENSE },
];

const EXPENSE_CATEGORY_MAP = [
  ['FUEL', 'Fuel', '5000'],
  ['PRINTING', 'Printing', '5010'],
  ['STATIONERY', 'Stationery', '5020'],
  ['TT', 'T&T', '5030'],
  ['HEALTH_SAFETY', 'Health & Safety', '5040'],
  ['UTILITIES', 'Utilities', '5050'],
  ['PARKING_FEE', 'Parking Fee', '5060'],
  ['CAR_MAINTENANCE', 'Car Maintenance', '5070'],
  ['REPAIRS_MAINTENANCE', 'Repairs & Maintenance', '5080'],
  ['DONATION', 'Donation', '5090'],
  ['IMPREST', 'Imprest', '5100'],
  ['CLEANING_SANITATION', 'Cleaning & Sanitation', '5110'],
  ['LEGAL', 'Legal', '5120'],
  ['ALLOWANCE_BONUS', 'Allowance & Bonus', '5130'],
  ['TELEPHONE_COMMUNICATION', 'Telephone & Communication', '5140'],
  ['COURIER_SERVICE', 'Courier Service', '5150'],
  ['RENT', 'Rent', '5160'],
  ['MGT_REFRESHMENT', 'Management Refreshment', '5170'],
  ['GENERAL_EXPENSE', 'General Expense', '5180'],
  ['COMPENSATION', 'Compensation', '5190'],
  ['INSURANCE', 'Insurance', '5200'],
] as const;

async function ensureTaxProfile(companyId: string) {
  const [existing] = await db
    .select({ id: taxProfiles.id })
    .from(taxProfiles)
    .where(and(eq(taxProfiles.companyId, companyId), eq(taxProfiles.name, 'Ghana Default')))
    .limit(1);

  let profileId = existing?.id;
  if (!profileId) {
    profileId = createId();
    await db.insert(taxProfiles).values({
      id: profileId,
      companyId,
      name: 'Ghana Default',
      active: true,
    });
  }

  const components = [
    { key: 'VAT', numerator: 3, denominator: 23, sortOrder: 1 },
    { key: 'GETFUND', numerator: 25, denominator: 2300, sortOrder: 2 },
    { key: 'NHIL', numerator: 25, denominator: 2300, sortOrder: 3 },
    { key: 'COVID', numerator: 1, denominator: 100, sortOrder: 4 },
  ];

  for (const component of components) {
    const [existingComponent] = await db
      .select({ id: taxComponents.id })
      .from(taxComponents)
      .where(and(eq(taxComponents.profileId, profileId), eq(taxComponents.key, component.key)))
      .limit(1);

    if (!existingComponent) {
      await db.insert(taxComponents).values({
        id: createId(),
        profileId,
        key: component.key,
        numerator: component.numerator,
        denominator: component.denominator,
        inclusive: true,
        sortOrder: component.sortOrder,
        active: true,
      });
    }
  }
}

async function main() {
  const allCompanies = await db.select({ id: companies.id }).from(companies);
  if (allCompanies.length === 0) {
    console.error('No companies found. Run the base seed first.');
    process.exit(1);
  }

  for (const company of allCompanies) {
    const [creator] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.companyId, company.id))
      .limit(1);

    const createdBy = creator?.id ?? null;
    const accountIds = new Map<string, string>();

    for (const account of ACCOUNT_DEFINITIONS) {
      const [existing] = await db
        .select({ id: chartOfAccounts.id })
        .from(chartOfAccounts)
        .where(
          and(
            eq(chartOfAccounts.companyId, company.id),
            or(
              eq(chartOfAccounts.code, account.code),
              sql`lower(${chartOfAccounts.name}) = lower(${account.name})`,
            ),
          ),
        )
        .limit(1);

      let id = existing?.id;
      if (!id) {
        id = createId();
        await db.insert(chartOfAccounts).values({
          id,
          companyId: company.id,
          code: account.code,
          name: account.name,
          accountClass: account.accountClass,
          parentAccountId: account.parentCode ? (accountIds.get(account.parentCode) ?? null) : null,
          isPostable: account.isPostable ?? true,
          active: true,
          createdBy,
        });
        console.log(`Created account ${account.code} for company ${company.id}`);
      } else {
        console.log(`Reusing existing account ${account.code} (${account.name}) for ${company.id}`);
      }
      accountIds.set(account.code, id);
    }

    const bankDefinitions = [
      { name: 'Main Company Bank', accountCode: '1010' },
      { name: 'Secondary Company Bank', accountCode: '1020' },
    ];

    for (const bank of bankDefinitions) {
      const [existing] = await db
        .select({ id: companyBankAccounts.id })
        .from(companyBankAccounts)
        .where(
          and(
            eq(companyBankAccounts.companyId, company.id),
            eq(companyBankAccounts.name, bank.name),
          ),
        )
        .limit(1);

      if (!existing) {
        await db.insert(companyBankAccounts).values({
          id: createId(),
          companyId: company.id,
          accountId: accountIds.get(bank.accountCode)!,
          name: bank.name,
          bankName: null,
          branchName: null,
          accountNumberMasked: null,
          active: true,
          createdBy,
        });
      }
    }

    for (const [code, name, accountCode] of EXPENSE_CATEGORY_MAP) {
      const [existing] = await db
        .select({ id: expenseCategories.id })
        .from(expenseCategories)
        .where(
          and(
            eq(expenseCategories.companyId, company.id),
            or(
              eq(expenseCategories.code, code),
              sql`lower(${expenseCategories.name}) = lower(${name})`,
            ),
          ),
        )
        .limit(1);

      if (!existing) {
        await db.insert(expenseCategories).values({
          id: createId(),
          companyId: company.id,
          code,
          name,
          accountId: accountIds.get(accountCode)!,
          active: true,
          createdBy,
        });
      }
    }

    const policyDefinitions = [
      {
        policyCode: 'PETTY_CASH_BRANCH_LIMIT',
        name: 'Branch petty cash limit',
        amountLimitPsw: 2_000_00,
        requiresHeadOfficeApproval: false,
        appliesToFundingSource: ExpenseFundingSource.PETTY_CASH,
      },
      {
        policyCode: 'SALES_CASH_APPROVAL_REQUIRED',
        name: 'Sales cash use requires approval',
        amountLimitPsw: 0,
        requiresHeadOfficeApproval: true,
        appliesToFundingSource: ExpenseFundingSource.SALES_CASH,
      },
      {
        policyCode: 'COMPANY_BANK_HEAD_OFFICE',
        name: 'Company bank disbursement requires head office approval',
        amountLimitPsw: 0,
        requiresHeadOfficeApproval: true,
        appliesToFundingSource: ExpenseFundingSource.COMPANY_BANK,
      },
    ] as const;

    for (const policy of policyDefinitions) {
      const [existing] = await db
        .select({ id: accountingApprovalPolicies.id })
        .from(accountingApprovalPolicies)
        .where(
          and(
            eq(accountingApprovalPolicies.companyId, company.id),
            eq(accountingApprovalPolicies.policyCode, policy.policyCode),
          ),
        )
        .limit(1);

      if (!existing) {
        await db.insert(accountingApprovalPolicies).values({
          id: createId(),
          companyId: company.id,
          policyCode: policy.policyCode,
          name: policy.name,
          amountLimitPsw: policy.amountLimitPsw,
          requiresHeadOfficeApproval: policy.requiresHeadOfficeApproval,
          appliesToFundingSource: policy.appliesToFundingSource,
          active: true,
          createdBy,
        });
      }
    }

    const companyBranches = await db
      .select({ id: branches.id })
      .from(branches)
      .where(eq(branches.companyId, company.id));

    for (const branch of companyBranches) {
      const [existing] = await db
        .select({ id: pettyCashFunds.id })
        .from(pettyCashFunds)
        .where(
          and(eq(pettyCashFunds.companyId, company.id), eq(pettyCashFunds.branchId, branch.id)),
        )
        .limit(1);

      if (!existing) {
        await db.insert(pettyCashFunds).values({
          id: createId(),
          companyId: company.id,
          branchId: branch.id,
          accountId: accountIds.get('1110')!,
          targetFloatPsw: 2_000_00,
          active: true,
          createdBy,
        });
      }
    }

    await ensureTaxProfile(company.id);
  }

  console.log(
    'Seeded accounting chart, categories, policies, bank accounts, petty cash funds, and tax profile defaults.',
  );
}

main().catch((err) => {
  console.error('Accounting seed error:', err);
  process.exit(1);
});
