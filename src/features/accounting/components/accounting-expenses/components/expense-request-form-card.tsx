import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { Textarea } from '@/components/ui/textarea';
import { ExpenseFundingSource } from '@/db/schemas/enums';
import { QuickAmountInput } from '../../accounting-shared';
import type { AccountingExpensesViewData } from '../types/accounting-expenses-view-data';

export function ExpenseRequestFormCard({
  amountCedis,
  bankAccounts,
  branchId,
  branchOptions,
  companyBankAccountId,
  effectiveBranchId,
  expenseCategories,
  expenseCategoryId,
  fundingSource,
  isHeadOffice,
  isMutating,
  locationId,
  locationOptions,
  purpose,
  referenceNo,
  setAmountCedis,
  setBranchId,
  setCompanyBankAccountId,
  setExpenseCategoryId,
  setFundingSource,
  setLocationId,
  setPurpose,
  setReferenceNo,
  user,
  handleCreate,
}: Pick<
  AccountingExpensesViewData,
  | 'amountCedis'
  | 'bankAccounts'
  | 'branchId'
  | 'branchOptions'
  | 'companyBankAccountId'
  | 'effectiveBranchId'
  | 'expenseCategories'
  | 'expenseCategoryId'
  | 'fundingSource'
  | 'isHeadOffice'
  | 'isMutating'
  | 'locationId'
  | 'locationOptions'
  | 'purpose'
  | 'referenceNo'
  | 'setAmountCedis'
  | 'setBranchId'
  | 'setCompanyBankAccountId'
  | 'setExpenseCategoryId'
  | 'setFundingSource'
  | 'setLocationId'
  | 'setPurpose'
  | 'setReferenceNo'
  | 'user'
  | 'handleCreate'
>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Expense Request</CardTitle>
        <CardDescription>
          Choose the funding source carefully. Sales cash and company bank expenses should still
          follow approval before posting.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="expense-branch">Branch</Label>
            {isHeadOffice ? (
              <Select
                value={branchId}
                onValueChange={(value) => {
                  setBranchId(value);
                  setLocationId('');
                }}
              >
                <SelectTrigger id="expense-branch">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branchOptions.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={user.branch?.name ?? 'My branch'} disabled />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-location">Location</Label>
            <Select
              value={locationId || 'branch'}
              onValueChange={(value) => setLocationId(value === 'branch' ? '' : value)}
            >
              <SelectTrigger id="expense-location">
                <SelectValue placeholder="Branch level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="branch">Branch Level</SelectItem>
                {locationOptions.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-category">Expense Category</Label>
            <Select value={expenseCategoryId} onValueChange={setExpenseCategoryId}>
              <SelectTrigger id="expense-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-source">Funding Source</Label>
            <Select value={fundingSource} onValueChange={setFundingSource}>
              <SelectTrigger id="expense-source">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={String(ExpenseFundingSource.PETTY_CASH)}>Petty Cash</SelectItem>
                <SelectItem value={String(ExpenseFundingSource.SALES_CASH)}>Sales Cash</SelectItem>
                <SelectItem value={String(ExpenseFundingSource.COMPANY_BANK)}>
                  Company Bank
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <QuickAmountInput
            id="expense-amount"
            label="Amount (GHS)"
            value={amountCedis}
            onChange={setAmountCedis}
          />

          <div className="space-y-2">
            <Label htmlFor="expense-reference">Reference No.</Label>
            <Input
              id="expense-reference"
              value={referenceNo}
              onChange={(event) => setReferenceNo(event.target.value)}
              placeholder="Receipt, requisition, or memo no."
            />
          </div>

          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="expense-bank">Company Bank Account</Label>
            <Select
              value={companyBankAccountId || 'none'}
              onValueChange={(value) => setCompanyBankAccountId(value === 'none' ? '' : value)}
            >
              <SelectTrigger id="expense-bank">
                <SelectValue placeholder="Required when company bank is used" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not selected</SelectItem>
                {bankAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 xl:col-span-4">
            <Label htmlFor="expense-purpose">Purpose</Label>
            <Textarea
              id="expense-purpose"
              rows={3}
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              placeholder="Describe what the expense is for"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => void handleCreate()} disabled={isMutating || !effectiveBranchId}>
            Record Expense
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
