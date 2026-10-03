import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import type {
  DailyParcelAuditStatus,
  DailyParcelAuditView,
  DailyParcelDeliveryStatus,
} from '../../types/daily-parcel-audit.types';

type Props = {
  date: string;
  onDateChange: (date: string) => void;
  branchId: string;
  onBranchChange: (id: string) => void;
  isHeadOffice: boolean;
  branchName: string;
  branches: Array<{ id: string; name: string }>;
  view: DailyParcelAuditView;
  onViewChange: (view: DailyParcelAuditView) => void;
  paymentStatus: DailyParcelAuditStatus;
  onPaymentStatusChange: (status: DailyParcelAuditStatus) => void;
  deliveryStatus: DailyParcelDeliveryStatus;
  onDeliveryStatusChange: (status: DailyParcelDeliveryStatus) => void;
};

export function DailyParcelAuditFilters(props: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-5">
      <div className="space-y-2">
        <Label>Parcel creation date</Label>
        <DatePicker
          date={props.date ? new Date(`${props.date}T00:00:00`) : undefined}
          onDateChange={(value) => props.onDateChange(value ? formatLocalDate(value) : '')}
          placeholder="Select date"
        />
      </div>
      <div className="space-y-2">
        <Label>Source branch</Label>
        {props.isHeadOffice ? (
          <Select value={props.branchId} onValueChange={props.onBranchChange}>
            <SelectTrigger>
              <SelectValue placeholder="All branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All branches</SelectItem>
              {props.branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="rounded-md border px-3 py-2 text-sm">{props.branchName}</div>
        )}
      </div>
      <div className="space-y-2">
        <Label>Payment view</Label>
        <Select
          value={props.view}
          onValueChange={(value) => props.onViewChange(value as DailyParcelAuditView)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="receiver">Receiver to pay</SelectItem>
            <SelectItem value="sender">Sender-paid</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{props.view === 'receiver' ? 'Receiver payment' : 'Delivery'}</Label>
        {props.view === 'receiver' ? (
          <Select
            value={props.paymentStatus}
            onValueChange={(value) => props.onPaymentStatusChange(value as DailyParcelAuditStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All payment states</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="credited">Credited</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Select
            value={props.deliveryStatus}
            onValueChange={(value) =>
              props.onDeliveryStatusChange(value as DailyParcelDeliveryStatus)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All delivery states</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="pending">Pending delivery</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      {props.view === 'receiver' ? (
        <div className="space-y-2">
          <Label>Delivery</Label>
          <Select
            value={props.deliveryStatus}
            onValueChange={(value) =>
              props.onDeliveryStatusChange(value as DailyParcelDeliveryStatus)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All delivery states</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="pending">Pending delivery</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </div>
  );
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
