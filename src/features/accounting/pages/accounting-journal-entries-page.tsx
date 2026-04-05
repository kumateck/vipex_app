import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { Textarea } from '@/components/ui/textarea';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useListLocationOptionsQuery } from '@/features/locations/api/locations.api';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';
import {
  useGetManualJournalApprovalPolicyQuery,
  useListAccountsQuery,
  usePostManualJournalEntryMutation,
} from '../api';
import {
  AccountingDisabledState,
  AccountingUnauthorizedState,
  formatMoney,
} from './accounting-shared';

type ManualLineForm = {
  accountId: string;
  debitCedis: string;
  creditCedis: string;
  description: string;
};

function createEmptyLine(): ManualLineForm {
  return { accountId: '', debitCedis: '', creditCedis: '', description: '' };
}

function parseCedisToPesewas(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function AccountingJournalEntriesPage() {
  const user = useAuthStore((state) => state.user);
  const permissions = new Set(user?.permissions ?? []);
  const canRead = permissions.has(PermissionKeys.CanReadAccountingManualEntries);
  const canCreate = permissions.has(PermissionKeys.CanCreateAccountingManualEntries);
  const canApprove = permissions.has(PermissionKeys.CanApproveAccountingManualEntries);

  if (!user?.company?.useAccounting) return <AccountingDisabledState />;
  if (!canRead && !canCreate && !canApprove) {
    return (
      <AccountingUnauthorizedState
        title="Manual Journal Entries Restricted"
        description="Your role does not include permission to create or approve manual journal entries."
      />
    );
  }

  return (
    <AccountingJournalEntriesPageContent
      user={user}
      canCreate={canCreate}
      canApprove={canApprove}
    />
  );
}

function AccountingJournalEntriesPageContent({
  user,
  canCreate,
  canApprove,
}: {
  user: AuthUser;
  canCreate: boolean;
  canApprove: boolean;
}) {
  const companyId = user.company?.id ?? '';
  const defaultBranchId = user.branch?.id ?? '';
  const [branchId, setBranchId] = useState(defaultBranchId);
  const [locationId, setLocationId] = useState(user.location?.id ?? '');
  const [memo, setMemo] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState<ManualLineForm[]>([createEmptyLine(), createEmptyLine()]);

  const { data: branches = [] } = useListBranchOptionsQuery(companyId ? { companyId } : undefined, {
    skip: !companyId,
  });
  const { data: locations = [] } = useListLocationOptionsQuery(
    companyId && branchId ? { companyId, branchId } : undefined,
    { skip: !companyId || !branchId },
  );
  const { data: accounts = [] } = useListAccountsQuery(
    { companyId, active: true },
    { skip: !companyId },
  );
  const { data: policy } = useGetManualJournalApprovalPolicyQuery(
    { companyId },
    { skip: !companyId },
  );
  const [postManualJournalEntry, { isLoading }] = usePostManualJournalEntryMutation();

  const postableAccounts = useMemo(
    () => accounts.filter((account) => account.isPostable),
    [accounts],
  );
  const totals = useMemo(() => {
    const debitPsw = lines.reduce((sum, line) => {
      const debit = parseCedisToPesewas(line.debitCedis);
      return sum + Number(debit ?? 0);
    }, 0);
    const creditPsw = lines.reduce((sum, line) => {
      const credit = parseCedisToPesewas(line.creditCedis);
      return sum + Number(credit ?? 0);
    }, 0);
    return {
      debitPsw,
      creditPsw,
      balanced: debitPsw === creditPsw && debitPsw > 0,
    };
  }, [lines]);

  async function handleSubmit() {
    if (!canCreate && !canApprove) {
      toast.error('You do not have permission to submit manual journal entries');
      return;
    }
    if (!companyId) {
      toast.error('Authenticated company is required');
      return;
    }
    const normalized = lines
      .map((line) => ({
        accountId: line.accountId,
        debitPsw: parseCedisToPesewas(line.debitCedis) ?? 0,
        creditPsw: parseCedisToPesewas(line.creditCedis) ?? 0,
        description: line.description.trim() || null,
      }))
      .filter((line) => line.accountId && (line.debitPsw > 0 || line.creditPsw > 0));

    if (normalized.length < 2) {
      toast.error('Add at least two valid journal lines');
      return;
    }
    if (!totals.balanced) {
      toast.error('Entry is not balanced');
      return;
    }

    try {
      const result = await postManualJournalEntry({
        companyId,
        branchId: branchId || null,
        locationId: locationId || null,
        memo: memo.trim() || null,
        entryDate,
        lines: normalized,
      }).unwrap();
      toast.success(
        result.approvalMode === 'pending_approval'
          ? `Entry queued for approval (${result.manualEntryId})`
          : `Entry auto-authorized and posted (${result.entryId})`,
      );
      setMemo('');
      setLines([createEmptyLine(), createEmptyLine()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to post manual journal entry');
    }
  }

  return (
    <ScrollableWrapper>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Manual Journal Entries</CardTitle>
            <CardDescription>
              Entries below threshold auto-authorize. Entries above threshold require an approver.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={branchId || undefined} onValueChange={setBranchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Select value={locationId || undefined} onValueChange={setLocationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Entry Date</Label>
                <DatePicker
                  date={entryDate ? new Date(`${entryDate}T00:00:00`) : undefined}
                  onDateChange={(date) => setEntryDate(date ? format(date, 'yyyy-MM-dd') : '')}
                  placeholder="Select entry date"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Memo</Label>
              <Textarea
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                placeholder="Manual correction for branch settlement..."
              />
            </div>

            <div className="space-y-3">
              {lines.map((line, index) => (
                <div key={index} className="grid gap-3 rounded-md border p-3 md:grid-cols-12">
                  <div className="md:col-span-4">
                    <Label className="mb-2 block">Account</Label>
                    <Select
                      value={line.accountId || undefined}
                      onValueChange={(value) =>
                        setLines((current) =>
                          current.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, accountId: value } : row,
                          ),
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {postableAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.code} - {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="mb-2 block">Debit (GH₵)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.debitCedis}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, debitCedis: event.target.value } : row,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="mb-2 block">Credit (GH₵)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.creditCedis}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, creditCedis: event.target.value } : row,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Label className="mb-2 block">Description</Label>
                    <Input
                      value={line.description}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, description: event.target.value } : row,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="md:col-span-1 flex items-end">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setLines((current) => current.filter((_, rowIndex) => rowIndex !== index))
                      }
                      disabled={lines.length <= 2}
                    >
                      -
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setLines((current) => [...current, createEmptyLine()])}
              >
                Add Line
              </Button>
              <span className="text-sm text-muted-foreground">
                Debit: {formatMoney(totals.debitPsw)} | Credit: {formatMoney(totals.creditPsw)} |{' '}
                {totals.balanced ? 'Balanced' : 'Unbalanced'}
              </span>
            </div>

            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p>
                Threshold: {policy ? formatMoney(policy.amountLimitPsw) : 'Not configured'}{' '}
                {policy?.configured
                  ? `(${policy.policyCode})`
                  : '(no manual entry policy configured)'}
              </p>
              <p className="text-muted-foreground">
                Auto authorize below threshold:{' '}
                <strong>
                  {policy?.autoAuthorizeBelowThreshold ? 'Enabled' : 'Disabled (queue all)'}
                </strong>
              </p>
              <p className="text-muted-foreground">
                Above threshold always goes for approval:{' '}
                <strong>{canApprove ? 'You can approve from queue' : 'Approver required'}</strong>
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => void handleSubmit()} disabled={isLoading || !totals.balanced}>
                {isLoading ? 'Posting...' : 'Post Entry'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setMemo('');
                  setLines([createEmptyLine(), createEmptyLine()]);
                }}
                disabled={isLoading}
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
