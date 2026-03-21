import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCloseSessionMutation,
  useGetCurrentActiveSessionQuery,
  useGetCurrentActiveSessionSummaryQuery,
  useListSessionTypesQuery,
  useOpenSessionMutation,
} from '@/features/cashiers/api/cashiers.api';
import { useAuthStore } from '@/stores/auth-store';
import { UserType } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';

function formatCedisFromPsw(valuePsw: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valuePsw / 100);
}

export function CashierSessionControls() {
  const authUser = useAuthStore((state) => state.user);
  const location = useLocation();
  const [isOpenDialog, setIsOpenDialog] = useState(false);
  const [sessionTypeId, setSessionTypeId] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');

  const permissions = useMemo(() => new Set(authUser?.permissions ?? []), [authUser?.permissions]);
  const isCashierUser = authUser?.userType === UserType.CASHIER;

  const canReadSessions = permissions.has(PermissionKeys.CanReadCashierSessions);
  const canOpenSessions = permissions.has(PermissionKeys.CanOpenCashierSessions);
  const canCloseSessions = permissions.has(PermissionKeys.CanCloseCashierSessions);
  const roleName = authUser?.role?.name?.toLowerCase() ?? '';
  const isReceiverRoute = location.pathname.startsWith('/parcels/receiver-cashier');
  const cashierMode: 'sender' | 'receiver' | 'delivery' = isReceiverRoute
    ? 'receiver'
    : roleName.includes('receiver')
      ? 'receiver'
      : permissions.has(PermissionKeys.CanCompleteDoorstepDelivery)
        ? 'delivery'
        : permissions.has(PermissionKeys.CanCompleteOfficePickup)
          ? 'receiver'
          : 'sender';

  const { data: activeSession, isLoading: isLoadingActiveSession } =
    useGetCurrentActiveSessionQuery(undefined, {
      skip: !isCashierUser || !canReadSessions,
    });
  const { data: summary } = useGetCurrentActiveSessionSummaryQuery(
    { mode: cashierMode },
    {
      skip: !isCashierUser || !canReadSessions,
    },
  );
  const { data: sessionTypes, isLoading: isLoadingSessionTypes } = useListSessionTypesQuery(
    undefined,
    {
      skip: !isCashierUser || !canOpenSessions || !!activeSession,
    },
  );

  const [openSession, { isLoading: isOpeningSession }] = useOpenSessionMutation();
  const [closeSession, { isLoading: isClosingSession }] = useCloseSessionMutation();

  if (!isCashierUser || !canReadSessions) return null;

  const handleOpenSession = async () => {
    if (!sessionTypeId) {
      toast.error('Please select a session type');
      return;
    }

    try {
      await openSession({
        sessionTypeId,
        startTime: new Date().toISOString(),
        openingBalanceCedis: openingBalance ? Number(openingBalance) : 0,
      }).unwrap();
      toast.success('Session opened');
      setIsOpenDialog(false);
      setSessionTypeId('');
      setOpeningBalance('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to open session');
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession?.id) return;

    const value = window.prompt('Closing balance (cedis)', '0');
    if (value == null) return;
    const closingBalanceCedis = Number(value);
    if (Number.isNaN(closingBalanceCedis)) {
      toast.error('Invalid balance value');
      return;
    }

    try {
      await closeSession({
        id: activeSession.id,
        body: {
          endTime: new Date().toISOString(),
          closingBalanceCedis,
        },
      }).unwrap();
      toast.success('Session closed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to close session');
    }
  };

  if (isLoadingActiveSession) {
    return <span className="text-xs text-muted-foreground">Loading session...</span>;
  }

  if (!activeSession) {
    if (!canOpenSessions) return null;

    return (
      <>
        <Button size="sm" onClick={() => setIsOpenDialog(true)}>
          Open Session
        </Button>

        <Dialog open={isOpenDialog} onOpenChange={setIsOpenDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Open Cashier Session</DialogTitle>
              <DialogDescription>Select a session type and opening balance.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Session Type</Label>
                <Select value={sessionTypeId} onValueChange={setSessionTypeId}>
                  <SelectTrigger disabled={isLoadingSessionTypes}>
                    <SelectValue
                      placeholder={isLoadingSessionTypes ? 'Loading...' : 'Select type'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(sessionTypes ?? []).map((sessionType) => (
                      <SelectItem key={sessionType.id} value={sessionType.id}>
                        {sessionType.sessionType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Opening Balance (GHS)</Label>
                <Input
                  placeholder="0.00"
                  value={openingBalance}
                  onChange={(event) => setOpeningBalance(event.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsOpenDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleOpenSession} disabled={isOpeningSession}>
                {isOpeningSession ? 'Opening...' : 'Open Session'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {cashierMode === 'receiver' ? (
        <Badge variant="secondary">
          Receiver Payments: {formatCedisFromPsw(summary?.totalToBePaidCollectedPsw ?? 0)}
        </Badge>
      ) : (
        <>
          <Badge variant="secondary">
            Amount Paid: {formatCedisFromPsw(summary?.amountPaidPsw ?? 0)}
          </Badge>
          <Badge variant="outline">
            To Be Paid: {formatCedisFromPsw(summary?.toBePaidPsw ?? 0)}
          </Badge>
        </>
      )}
      {canCloseSessions ? (
        <Button
          size="sm"
          variant="destructive"
          onClick={handleCloseSession}
          disabled={isClosingSession}
        >
          {isClosingSession ? 'Closing...' : 'Close Session'}
        </Button>
      ) : null}
    </div>
  );
}
