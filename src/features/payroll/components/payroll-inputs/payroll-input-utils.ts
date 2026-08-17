import { ApprovalStatus } from '@/db/schemas/enums';

export function formatMoneyPsw(amountPsw: number, currencyCode = 'GHS') {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amountPsw ?? 0) / 100);
}

export function formatMinutes(minutes: number) {
  const totalMinutes = Number(minutes ?? 0);
  const hours = Math.floor(totalMinutes / 60);
  return `${hours}h ${totalMinutes % 60}m`;
}

export function approvalStatusLabel(status: number, hasManager: boolean) {
  if (!hasManager && status === ApprovalStatus.APPROVED) return 'Auto-approved';
  if (status === ApprovalStatus.APPROVED) return 'Approved';
  if (status === ApprovalStatus.REJECTED) return 'Rejected';
  return 'Pending';
}
