import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { DateRange } from 'react-day-picker';
import {
  CashConfirmationStatus,
  ExpenseFundingSource,
  ExpenseRequestStatus,
  TaxFilingPeriodStatus,
  TaxFilingStatus,
} from '@/db/schemas/enums';

export function formatMoney(pesewas: number | null | undefined) {
  const amount = Number(pesewas ?? 0) / 100;
  return `GHS ${amount.toFixed(2)}`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

export function todayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function cashConfirmationStatusLabel(status: number) {
  switch (status) {
    case CashConfirmationStatus.DRAFT:
      return 'Draft';
    case CashConfirmationStatus.CONFIRMED:
      return 'Confirmed';
    case CashConfirmationStatus.POSTED:
      return 'Posted';
    default:
      return `Status ${status}`;
  }
}

export function expenseStatusLabel(status: number) {
  switch (status) {
    case ExpenseRequestStatus.RECORDED:
      return 'Recorded';
    case ExpenseRequestStatus.SUBMITTED:
      return 'Submitted';
    case ExpenseRequestStatus.APPROVED:
      return 'Approved';
    case ExpenseRequestStatus.REJECTED:
      return 'Rejected';
    case ExpenseRequestStatus.PAID:
      return 'Paid';
    case ExpenseRequestStatus.POSTED:
      return 'Posted';
    default:
      return `Status ${status}`;
  }
}

export function fundingSourceLabel(source: number) {
  switch (source) {
    case ExpenseFundingSource.PETTY_CASH:
      return 'Petty Cash';
    case ExpenseFundingSource.SALES_CASH:
      return 'Sales Cash';
    case ExpenseFundingSource.COMPANY_BANK:
      return 'Company Bank';
    default:
      return `Source ${source}`;
  }
}

export function taxFilingStatusLabel(status: number) {
  switch (status) {
    case TaxFilingStatus.UNFILED:
      return 'Unfiled';
    case TaxFilingStatus.READY_FOR_FILING:
      return 'Ready';
    case TaxFilingStatus.FILED:
      return 'Filed';
    case TaxFilingStatus.EXCLUDED:
      return 'Excluded';
    default:
      return `Status ${status}`;
  }
}

export function filingPeriodStatusLabel(status: number) {
  switch (status) {
    case TaxFilingPeriodStatus.OPEN:
      return 'Open';
    case TaxFilingPeriodStatus.UNDER_REVIEW:
      return 'Under Review';
    case TaxFilingPeriodStatus.SUBMITTED:
      return 'Submitted';
    case TaxFilingPeriodStatus.CLOSED:
      return 'Closed';
    default:
      return `Status ${status}`;
  }
}

export function StatusBadge({
  label,
  tone = 'outline',
}: {
  label: string;
  tone?: 'default' | 'secondary' | 'outline';
}) {
  return <Badge variant={tone}>{label}</Badge>;
}

export function AccountingDisabledState() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Accounting Disabled</CardTitle>
          <CardDescription>This company has not enabled the accounting module.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Accounting pages, ledger posting, tax filing, and accounting reports are unavailable until
          accounting is enabled for the company. Current parcel, cashier, payment, and delivery
          flows continue without accounting.
        </CardContent>
      </Card>
    </div>
  );
}

export function AccountingUnauthorizedState(props: { title?: string; description?: string }) {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>{props.title ?? 'Accounting Access Required'}</CardTitle>
          <CardDescription>
            {props.description ??
              'Your role does not currently include the permission needed for this accounting screen.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Ask an administrator to update your role permissions if you should be able to view or
          manage this area.
        </CardContent>
      </Card>
    </div>
  );
}

export function ReasonDialog(props: {
  open: boolean;
  title: string;
  label: string;
  description?: string;
  confirmLabel: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (value: string) => Promise<void> | void;
}) {
  const [value, setValue] = useState('');

  async function handleConfirm() {
    const trimmed = value.trim();
    if (!trimmed) return;
    await props.onConfirm(trimmed);
    setValue('');
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setValue('');
      props.onClose();
    }
  }

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {props.description ? (
            <p className="text-sm text-muted-foreground">{props.description}</p>
          ) : null}
          <div className="space-y-2">
            <Label>{props.label}</Label>
            <Textarea value={value} onChange={(event) => setValue(event.target.value)} rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={props.loading || !value.trim()}>
            {props.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DateRangeFields(props: {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
}) {
  const value: DateRange | undefined = {
    from: props.dateFrom ? new Date(`${props.dateFrom}T00:00:00`) : undefined,
    to: props.dateTo ? new Date(`${props.dateTo}T00:00:00`) : undefined,
  };

  const toDateInputValue = (date?: Date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="space-y-2">
      <Label>Date Range</Label>
      <DateRangePicker
        value={value}
        onChange={(next) => {
          props.onDateFromChange(toDateInputValue(next?.from));
          props.onDateToChange(toDateInputValue(next?.to));
        }}
      />
    </div>
  );
}

export function QuickAmountInput(props: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      <Input
        id={props.id}
        type="number"
        min="0"
        step="0.01"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </div>
  );
}
