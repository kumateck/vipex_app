import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AuthUser } from '@/stores/auth-store';
import {
  useListAccountsQuery,
  useListApprovalPoliciesQuery,
  useListCompanyBankAccountsQuery,
  useListExpenseCategoriesQuery,
  useListTaxProfilesQuery,
} from '../../../api';
import type { SetupAccess } from '../types/accounting-setup.types';
import { AccountingSetupAccountsTab } from './accounting-setup-accounts-tab';
import { AccountingSetupBankAccountsTab } from './accounting-setup-bank-accounts-tab';
import { AccountingSetupCategoriesTab } from './accounting-setup-categories-tab';
import { AccountingSetupPoliciesTab } from './accounting-setup-policies-tab';
import { AccountingSetupTaxComponentsTab } from './accounting-setup-tax-components-tab';
import { AccountingSetupTaxProfilesTab } from './accounting-setup-tax-profiles-tab';

type SetupContentAccess = {
  accountsAccess: SetupAccess;
  categoriesAccess: SetupAccess;
  policiesAccess: SetupAccess;
  bankAccountsAccess: SetupAccess;
  taxProfilesAccess: SetupAccess;
  taxComponentsAccess: SetupAccess;
};

export function AccountingSetupContent({
  user,
  access,
}: {
  user: AuthUser;
  access: SetupContentAccess;
}) {
  const companyId = user.company?.id ?? '';
  const [activeTab, setActiveTab] = useState('accounts');
  const [selectedTaxProfileId, setSelectedTaxProfileId] = useState('');

  const { data: accounts = [] } = useListAccountsQuery(
    { companyId },
    { skip: !companyId || !access.accountsAccess.canRead },
  );
  const { data: expenseCategories = [] } = useListExpenseCategoriesQuery(
    { companyId },
    { skip: !companyId || !access.categoriesAccess.canRead },
  );
  const { data: approvalPolicies = [] } = useListApprovalPoliciesQuery(
    { companyId },
    { skip: !companyId || !access.policiesAccess.canRead },
  );
  const { data: companyBankAccounts = [] } = useListCompanyBankAccountsQuery(
    { companyId },
    { skip: !companyId || !access.bankAccountsAccess.canRead },
  );
  const { data: taxProfiles = [] } = useListTaxProfilesQuery(
    { companyId },
    {
      skip:
        !companyId || (!access.taxProfilesAccess.canRead && !access.taxComponentsAccess.canRead),
    },
  );

  const availableTabs = useMemo(
    () =>
      [
        access.accountsAccess.canRead ? 'accounts' : null,
        access.categoriesAccess.canRead ? 'categories' : null,
        access.policiesAccess.canRead ? 'policies' : null,
        access.bankAccountsAccess.canRead ? 'bank-accounts' : null,
        access.taxProfilesAccess.canRead ? 'tax-profiles' : null,
        access.taxComponentsAccess.canRead ? 'tax-components' : null,
      ].filter((value): value is string => Boolean(value)),
    [
      access.accountsAccess.canRead,
      access.bankAccountsAccess.canRead,
      access.categoriesAccess.canRead,
      access.policiesAccess.canRead,
      access.taxComponentsAccess.canRead,
      access.taxProfilesAccess.canRead,
    ],
  );

  useEffect(() => {
    if (availableTabs.length === 0) return;
    if (!availableTabs.includes(activeTab)) {
      const firstTab = availableTabs[0];
      if (firstTab) setActiveTab(firstTab);
    }
  }, [activeTab, availableTabs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Accounting Setup</h1>
          <p className="text-sm text-muted-foreground">
            Manage the accounting master data used by ledger posting, expense workflows, tax
            capture, and reporting. These settings are company-wide and only apply when accounting
            is enabled for the company.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{accounts.length} accounts</Badge>
          <Badge variant="outline">{expenseCategories.length} expense categories</Badge>
          <Badge variant="outline">{approvalPolicies.length} approval policies</Badge>
          <Badge variant="outline">{companyBankAccounts.length} bank accounts</Badge>
          <Badge variant="outline">{taxProfiles.length} tax profiles</Badge>
        </div>
      </div>

      <ScrollableWrapper>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full gap-1 md:grid-cols-6">
            {access.accountsAccess.canRead ? (
              <TabsTrigger value="accounts">Accounts</TabsTrigger>
            ) : null}
            {access.categoriesAccess.canRead ? (
              <TabsTrigger value="categories">Categories</TabsTrigger>
            ) : null}
            {access.policiesAccess.canRead ? (
              <TabsTrigger value="policies">Policies</TabsTrigger>
            ) : null}
            {access.bankAccountsAccess.canRead ? (
              <TabsTrigger value="bank-accounts">Bank Accounts</TabsTrigger>
            ) : null}
            {access.taxProfilesAccess.canRead ? (
              <TabsTrigger value="tax-profiles">Tax Profiles</TabsTrigger>
            ) : null}
            {access.taxComponentsAccess.canRead ? (
              <TabsTrigger value="tax-components">Tax Components</TabsTrigger>
            ) : null}
          </TabsList>

          <TabsContent value="accounts" className="space-y-4">
            <AccountingSetupAccountsTab
              companyId={companyId}
              access={access.accountsAccess}
              user={user}
            />
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <AccountingSetupCategoriesTab
              companyId={companyId}
              access={access.categoriesAccess}
              user={user}
            />
          </TabsContent>

          <TabsContent value="policies" className="space-y-4">
            <AccountingSetupPoliciesTab
              companyId={companyId}
              access={access.policiesAccess}
              user={user}
            />
          </TabsContent>

          <TabsContent value="bank-accounts" className="space-y-4">
            <AccountingSetupBankAccountsTab
              companyId={companyId}
              access={access.bankAccountsAccess}
              user={user}
            />
          </TabsContent>

          <TabsContent value="tax-profiles" className="space-y-4">
            <AccountingSetupTaxProfilesTab
              companyId={companyId}
              access={access.taxProfilesAccess}
              user={user}
              onSelectProfile={setSelectedTaxProfileId}
            />
          </TabsContent>

          <TabsContent value="tax-components" className="space-y-4">
            <AccountingSetupTaxComponentsTab
              companyId={companyId}
              access={access.taxComponentsAccess}
              user={user}
              selectedTaxProfileId={selectedTaxProfileId}
              setSelectedTaxProfileId={setSelectedTaxProfileId}
            />
          </TabsContent>
        </Tabs>
      </ScrollableWrapper>
    </div>
  );
}
