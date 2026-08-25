import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { DeliveryChangeRequest } from '../../types';
import { formatDeliveryChangeMoney } from '../../utils';

type Props = {
  requests: DeliveryChangeRequest[];
  isLoading: boolean;
  onReview: (request: DeliveryChangeRequest) => void;
};

export function PendingDeliveryChangeRequestsCard({ requests, isLoading, onReview }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Rider Address and Fee Changes</CardTitle>
        <CardDescription>
          Approve a request to update the active delivery before the rider confirms handover.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking</TableHead>
              <TableHead>Rider</TableHead>
              <TableHead>Requested Address</TableHead>
              <TableHead>Requested Fee</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6}>Loading requests...</TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>No pending requests.</TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request.deliveryId}>
                  <TableCell>{request.bookingCode}</TableCell>
                  <TableCell>{request.riderName ?? '-'}</TableCell>
                  <TableCell>{request.requestedDropoffAddress ?? '-'}</TableCell>
                  <TableCell>{formatDeliveryChangeMoney(request.requestedChargePsw)}</TableCell>
                  <TableCell>{request.reason ?? '-'}</TableCell>
                  <TableCell>
                    <Button size="sm" onClick={() => onReview(request)}>
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
