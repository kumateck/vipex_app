import { formatDateTime as sharedFormatDateTime } from '@/lib/dates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useGetBranchOperationsSettingsQuery } from '@/features/branches/api/branches.api';
import { useAuthStore } from '@/stores/auth-store';
import { useListPickupQueueCardsQuery } from '../../api/parcel.api';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { CallSenderBadge } from '../call-sender-badge';

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return sharedFormatDateTime(value);
}

function formatCurrency(amountPsw: number) {
  return `GHS ${(amountPsw / 100).toFixed(2)}`;
}

export function ParcelPickupQueueBoardPage({
  paymentBucket,
  title,
  description,
}: {
  paymentBucket: 'SP' | 'TP';
  title: string;
  description: string;
}) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const branchId = user?.branch?.id ?? null;
  const { data: currentBranch } = useGetBranchOperationsSettingsQuery(branchId ?? '', {
    skip: !branchId,
  });
  const isPickupQueueEnabled = currentBranch?.usePickupQueue ?? false;
  const {
    data: queueCards = [],
    isLoading,
    refetch,
  } = useListPickupQueueCardsQuery(
    { branchId: branchId ?? '', paymentBucket },
    { skip: !branchId || !isPickupQueueEnabled, pollingInterval: 5000 },
  );

  return (
    <ScrollableWrapper>
      <div className="w-full space-y-4 p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => void refetch()}
              disabled={isLoading || !isPickupQueueEnabled}
            >
              Refresh
            </Button>
          </CardHeader>
        </Card>

        {!isPickupQueueEnabled ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              This branch has not enabled pickup queue yet.
              <div className="mt-3">
                <Button variant="outline" size="sm" onClick={() => navigate('/branches')}>
                  Open Branch Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {isPickupQueueEnabled && queueCards.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No active queue cards right now.
            </CardContent>
          </Card>
        ) : null}

        {isPickupQueueEnabled ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {queueCards.map((card, index) => (
              <Card key={card.id} className={index === 0 ? 'border-primary shadow-sm' : undefined}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-5xl font-black tracking-tight">
                        {card.queueCode}
                      </CardTitle>
                      <CardDescription className="mt-1 text-xs uppercase tracking-[0.2em]">
                        Queue #{card.queueNumber}
                      </CardDescription>
                      <div className="mt-3 flex items-center gap-1.5">
                        <p className="text-sm font-medium text-muted-foreground">
                          {card.receiverName ?? 'Unknown Receiver'}
                        </p>
                        {card.callSender ? (
                          <CallSenderBadge className="h-5 px-1.5 text-[10px]" />
                        ) : null}
                      </div>
                    </div>
                    <Badge variant={index === 0 ? 'default' : 'secondary'}>
                      {index === 0 ? 'Next to Call' : 'Waiting'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    <strong>Telephone:</strong> {card.receiverPhone ?? '-'}
                  </p>
                  <p>
                    <strong>Tracking:</strong> {card.trackingCode}
                  </p>
                  <p>
                    <strong>Booking:</strong> {card.bookingCode}
                  </p>
                  <p>
                    <strong>Parcel:</strong> {card.parcelDetails}
                  </p>
                  <p>
                    <strong>Total Charge:</strong> {formatCurrency(card.chargePsw)}
                  </p>
                  <p>
                    <strong>Receiver Due:</strong> {formatCurrency(card.plannedToBePaidPsw)}
                  </p>
                  <p>
                    <strong>Queued At:</strong> {formatDateTime(card.queuedAt)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </ScrollableWrapper>
  );
}
