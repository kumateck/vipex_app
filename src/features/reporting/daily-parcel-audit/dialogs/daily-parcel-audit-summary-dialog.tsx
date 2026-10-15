import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatMoneyPsw } from '../utils/daily-parcel-audit.utils';

type Totals = {
  parcels: number;
  delivered: number;
  chargePsw: number;
  senderPaidPsw: number;
  receiverExpectedPsw: number;
  receiverPaidPsw: number;
  receiverCreditedPsw: number;
  receiverOutstandingPsw: number;
};

export function DailyParcelAuditSummaryDialog({
  open,
  onOpenChange,
  totals,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totals: Totals;
  title: string;
}) {
  const items = [
    ['Parcels in view', String(totals.parcels)],
    ['Delivered', String(totals.delivered)],
    ['Pending delivery', String(totals.parcels - totals.delivered)],
    ['Total charge', formatMoneyPsw(totals.chargePsw)],
    ['Sender collected', formatMoneyPsw(totals.senderPaidPsw)],
    ['Receiver expected', formatMoneyPsw(totals.receiverExpectedPsw)],
    ['Receiver collected', formatMoneyPsw(totals.receiverPaidPsw)],
    ['Receiver credited', formatMoneyPsw(totals.receiverCreditedPsw)],
    ['Receiver outstanding', formatMoneyPsw(totals.receiverOutstandingPsw)],
    [
      'Delivery rate',
      totals.parcels ? `${((totals.delivered / totals.parcels) * 100).toFixed(1)}%` : '-',
    ],
    [
      'Receiver cash collection rate',
      totals.receiverExpectedPsw
        ? `${((totals.receiverPaidPsw / totals.receiverExpectedPsw) * 100).toFixed(1)}%`
        : '-',
    ],
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Daily Parcel Audit Summary</DialogTitle>
          <DialogDescription>
            {title}. Values reflect the displayed filters and current records.
          </DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-2 gap-3">
          {items.map(([label, value]) => (
            <div key={label} className="rounded-md border p-3">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-lg font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
