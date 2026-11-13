import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTimeTZ } from '@/lib/date';
import type { OtpApprovalQueueItem } from '@/shared/shipments/receiver-otp-exception';

type Props = {
  items: OtpApprovalQueueItem[];
  onSelect: (parcel: OtpApprovalQueueItem, trigger: HTMLButtonElement) => void;
};

export const OtpApprovalTable = memo(function OtpApprovalTable({ items, onSelect }: Props) {
  return (
    <div className="rounded-md border">
      <Table aria-label="Parcels awaiting OTP confirmation">
        <TableHeader>
          <TableRow>
            <TableHead>Parcel</TableHead>
            <TableHead>OTP recipient</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead>Requested</TableHead>
            <TableHead>OTP status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((parcel) => (
            <TableRow key={parcel.id}>
              <TableCell>
                <div className="font-medium">{parcel.bookingCode}</div>
                <div className="text-xs text-muted-foreground">{parcel.trackingCode}</div>
              </TableCell>
              <TableCell>
                {parcel.otpTarget === 'second'
                  ? parcel.secondReceiverNameSnapshot || 'Second receiver'
                  : parcel.receiverNameSnapshot || 'Main receiver'}
              </TableCell>
              <TableCell>{parcel.destinationName}</TableCell>
              <TableCell>{formatDateTimeTZ(parcel.otpRequestedAt)}</TableCell>
              <TableCell>
                <Badge variant={parcel.otpExpired ? 'outline' : 'secondary'}>
                  {parcel.otpExpired ? 'Expired' : 'Awaiting verification'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={`Authorize without OTP for ${parcel.bookingCode}`}
                  onClick={(event) => onSelect(parcel, event.currentTarget)}
                >
                  Authorize without OTP
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});
