import { useEffect, useMemo, useState } from 'react';
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
} from '@/components/ui/select-searchable';
import {
  useCloseSessionMutation,
  useGetCurrentActiveSessionQuery,
  useGetCurrentActiveSessionSummaryQuery,
  useListSessionTypesQuery,
  useOpenSessionMutation,
} from '@/features/cashiers/api/cashiers.api';
import { useAuthStore } from '@/stores/auth-store';
import { CashierType, UserType } from '@/db/schemas/enums';
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
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [sessionTypeId, setSessionTypeId] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('0');

  const permissions = useMemo(() => new Set(authUser?.permissions ?? []), [authUser?.permissions]);
  const isCashierUser =
    authUser?.userType === UserType.CASHIER ||
    (authUser?.cashierType !== null && authUser?.cashierType !== undefined);

  const canReadSessions = permissions.has(PermissionKeys.CanReadCashierSessions);
  const canOpenSessions = permissions.has(PermissionKeys.CanOpenCashierSessions);
  const canCloseSessions = permissions.has(PermissionKeys.CanCloseCashierSessions);
  const canAccessSessionControls = canReadSessions || canOpenSessions || canCloseSessions;
  const cashierType = authUser?.cashierType ?? null;
  const isReceiverRoute = location.pathname.startsWith('/parcels/receiver-cashier');
  const isDeliveryRoute = location.pathname.startsWith('/parcels/delivery-cashier');
  const routeMode: 'sender' | 'receiver' | 'delivery' = isDeliveryRoute
    ? 'delivery'
    : isReceiverRoute
      ? 'receiver'
      : 'sender';
  const fullCashierMode: 'sender' | 'receiver' = isReceiverRoute ? 'receiver' : 'sender';
  const cashierMode: 'sender' | 'receiver' | 'delivery' =
    cashierType === CashierType.SENDING
      ? 'sender'
      : cashierType === CashierType.TOBEPAID
        ? 'receiver'
        : cashierType === CashierType.DELIVERY
          ? 'delivery'
          : cashierType === CashierType.FULL
            ? fullCashierMode
            : permissions.has(PermissionKeys.CanCompleteDoorstepDelivery)
              ? 'delivery'
              : permissions.has(PermissionKeys.CanCompleteOfficePickup)
                ? 'receiver'
                : routeMode;
  const isFullCashier = cashierType === CashierType.FULL;

  const { data: activeSession, isLoading: isLoadingActiveSession } =
    useGetCurrentActiveSessionQuery(undefined, {
      skip: !isCashierUser || !canAccessSessionControls,
    });
  const summaryMode: 'sender' | 'receiver' | 'delivery' | 'full' = isFullCashier
    ? 'full'
    : cashierMode;
  const closeMode: 'sender' | 'receiver' | 'delivery' | 'full' = isFullCashier
    ? 'full'
    : cashierMode;

  const { data: summary } = useGetCurrentActiveSessionSummaryQuery(
    { mode: summaryMode },
    {
      skip: !isCashierUser || !canReadSessions,
    },
  );
  const { data: senderSummary } = useGetCurrentActiveSessionSummaryQuery(
    { mode: 'sender' },
    {
      skip: !isCashierUser || !canReadSessions || !isFullCashier,
    },
  );
  const { data: receiverSummary } = useGetCurrentActiveSessionSummaryQuery(
    { mode: 'receiver' },
    {
      skip: !isCashierUser || !canReadSessions || !isFullCashier,
    },
  );
  const { data: closeSummary } = useGetCurrentActiveSessionSummaryQuery(
    { mode: closeMode },
    {
      skip: !isCashierUser || !canReadSessions,
    },
  );

  useEffect(() => {
    if (!isCloseDialogOpen) return;
    const expectedPsw =
      closeMode === 'receiver'
        ? (closeSummary?.totalToBePaidCollectedPsw ?? 0)
        : closeMode === 'delivery'
          ? (closeSummary?.totalDeliveryFeeCollectedPsw ?? 0) +
            (closeSummary?.totalToBePaidCollectedPsw ?? 0)
          : closeMode === 'full'
            ? (closeSummary?.totalFullCashierExpectedPsw ?? 0)
            : (closeSummary?.amountPaidPsw ?? 0);
    setClosingBalance((expectedPsw / 100).toFixed(2));
  }, [closeMode, closeSummary, isCloseDialogOpen]);

  const { data: sessionTypes, isLoading: isLoadingSessionTypes } = useListSessionTypesQuery(
    undefined,
    {
      skip: !isCashierUser || !canOpenSessions || !!activeSession,
    },
  );

  const [openSession, { isLoading: isOpeningSession }] = useOpenSessionMutation();
  const [closeSession, { isLoading: isClosingSession }] = useCloseSessionMutation();

  if (!isCashierUser || !canAccessSessionControls) return null;

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

    const closingBalanceCedis = Number(closingBalance);
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
      setIsCloseDialogOpen(false);
      setClosingBalance('0');
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
      {isFullCashier ? (
        <>
          <Badge variant="secondary">
            Amount Paid: {formatCedisFromPsw(senderSummary?.amountPaidPsw ?? 0)}
          </Badge>
          <Badge variant="outline">
            To Be Paid: {formatCedisFromPsw(senderSummary?.toBePaidPsw ?? 0)}
          </Badge>
          <Badge variant="outline">
            Receiver Payments: {formatCedisFromPsw(receiverSummary?.totalToBePaidCollectedPsw ?? 0)}
          </Badge>
        </>
      ) : cashierMode === 'receiver' ? (
        <Badge variant="secondary">
          Receiver Payments: {formatCedisFromPsw(summary?.totalToBePaidCollectedPsw ?? 0)}
        </Badge>
      ) : cashierMode === 'delivery' ? (
        <>
          <Badge variant="secondary">
            Delivery Fee: {formatCedisFromPsw(summary?.totalDeliveryFeeCollectedPsw ?? 0)}
          </Badge>
          <Badge variant="outline">
            Receiver Payments: {formatCedisFromPsw(summary?.totalToBePaidCollectedPsw ?? 0)}
          </Badge>
        </>
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
        <>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setIsCloseDialogOpen(true)}
            disabled={isClosingSession}
          >
            {isClosingSession ? 'Closing...' : 'Close Session'}
          </Button>
          <Dialog
            open={isCloseDialogOpen}
            onOpenChange={(open) => {
              setIsCloseDialogOpen(open);
              if (!open) setClosingBalance('0');
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Close Cashier Session</DialogTitle>
                <DialogDescription>
                  System preloads the expected total received for this cashier type. Confirm to end
                  the session.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="sidebar-closing-balance">Expected Total Received (GHS)</Label>
                <Input
                  id="sidebar-closing-balance"
                  inputMode="decimal"
                  value={closingBalance}
                  readOnly
                />
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsCloseDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCloseSession}
                  disabled={isClosingSession}
                >
                  {isClosingSession ? 'Closing...' : 'Close Session'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  );
}
