import { formatDateTimeTZ } from '@/lib/dates';
import type { OutstandingDebtStatement } from '@/shared/customers/outstanding-debt';

const formatter = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' });

export const OUTSTANDING_DEBT_TITLE = 'Outstanding Debt Statement';

export function formatDebtMoney(amountPsw: number) {
  return formatter.format(amountPsw / 100);
}

export function debtSummaryLines(summary: OutstandingDebtStatement['summary']) {
  const lines = [
    {
      label: summary.accountBalancePsw < 0 ? 'Account credit' : 'Total amount due',
      value: formatDebtMoney(Math.abs(summary.accountBalancePsw)),
    },
    { label: 'Open parcel balances', value: formatDebtMoney(summary.parcelOutstandingPsw) },
    { label: 'Outstanding parcels', value: String(summary.parcelCount) },
    {
      label: 'Oldest outstanding parcel',
      value: summary.oldestParcelCreatedAt ? formatDateTimeTZ(summary.oldestParcelCreatedAt) : '—',
    },
  ];
  if (summary.otherCreditActivityPsw !== 0) {
    lines.push({
      label: 'Other credit account activity',
      value: formatDebtMoney(summary.otherCreditActivityPsw),
    });
  }
  return lines;
}
