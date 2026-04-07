import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { BranchType, CashierType } from '@/db/schemas/enums';
import {
  useCloseSessionMutation,
  useGetCurrentActiveSessionSummaryQuery,
  useListSessionsQuery,
  useListSessionTypesQuery,
  useOpenSessionMutation,
} from '../../api/cashiers.api';
import type { CashierSessionListQuery } from '../../types/cashier.types';
import { CashierOpenSessionCard } from './cashier-open-session-card';
import { CashierSessionsTable } from './cashier-sessions-table';
import { Button } from '@/components/ui/button';
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
import { DatePicker } from '@/components/ui/date-picker';

type CashierSessionsView = 'all' | 'active' | 'history' | 'open' | 'close';

interface CashierSessionsPageContentProps {
  view?: CashierSessionsView;
}

function getDateRange(dateInput: Date): { dateFrom: string; dateTo: string } {
  const date = new Date(dateInput);
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
}

export function CashierSessionsPageContent({ view = 'all' }: CashierSessionsPageContentProps) {
  const authUser = useAuthStore((state) => state.user);
  const cashierId = authUser?.id ?? '';
  const branchId = authUser?.branch?.id ?? '';
  const isHeadOffice = authUser?.branch?.type === BranchType.HEADOFFICE;
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { dateFrom, dateTo } = getDateRange(selectedDate);
  const activeOnly = view === 'active' || view === 'close' ? true : null;
  const scopedBranchId = isHeadOffice ? null : branchId || null;

  const [sessionTypeId, setSessionTypeId] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [sessionIdToClose, setSessionIdToClose] = useState<string | null>(null);
  const [closingBalance, setClosingBalance] = useState('0');
  const [query, setQuery] = useState<CashierSessionListQuery>({
    page: 1,
    pageSize: 20,
    dateFrom,
    dateTo,
    filters: { branchId: scopedBranchId, activeOnly },
  });

  const { data: sessionTypes, isLoading: isLoadingTypes } = useListSessionTypesQuery();
  const closeMode: 'sender' | 'receiver' | 'delivery' | 'full' =
    authUser?.cashierType === CashierType.FULL
      ? 'full'
      : authUser?.cashierType === CashierType.DELIVERY
        ? 'delivery'
        : authUser?.cashierType === CashierType.TOBEPAID
          ? 'receiver'
          : 'sender';
  const { data: closeSummary } = useGetCurrentActiveSessionSummaryQuery(
    { mode: closeMode },
    { skip: !authUser },
  );
  const { data, isLoading } = useListSessionsQuery(query, { skip: !authUser });
  const [openSession, { isLoading: isOpening }] = useOpenSessionMutation();
  const [closeSession, { isLoading: isClosing }] = useCloseSessionMutation();

  useEffect(() => {
    if (!sessionIdToClose) return;
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
  }, [closeMode, closeSummary, sessionIdToClose]);

  const handleRequestChange = useCallback(
    (request: CashierSessionListQuery) =>
      setQuery({
        ...request,
        dateFrom,
        dateTo,
        filters: { ...(request.filters ?? {}), branchId: scopedBranchId, activeOnly },
      }),
    [activeOnly, dateFrom, dateTo, scopedBranchId],
  );

  const handleDateChange = (nextDate: Date | undefined) => {
    if (!nextDate) return;
    setSelectedDate(nextDate);
    const range = getDateRange(nextDate);
    setQuery((prev) => ({
      ...prev,
      page: 1,
      dateFrom: range.dateFrom,
      dateTo: range.dateTo,
      filters: { ...(prev.filters ?? {}), branchId: scopedBranchId, activeOnly },
    }));
  };

  const handleOpenSession = async () => {
    if (!cashierId || !branchId || !sessionTypeId) {
      toast.error('Cashier, branch and session type are required');
      return;
    }

    try {
      await openSession({
        sessionTypeId,
        startTime: new Date().toISOString(),
        openingBalanceCedis: openingBalance ? Number(openingBalance) : 0,
      }).unwrap();
      toast.success('Session opened');
      setOpeningBalance('');
      setSessionTypeId('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to open session');
    }
  };

  const handleCloseSession = useCallback(async () => {
    if (!sessionIdToClose) return;
    const closingBalanceCedis = Number(closingBalance);
    if (Number.isNaN(closingBalanceCedis)) {
      toast.error('Invalid balance value');
      return;
    }

    try {
      await closeSession({
        id: sessionIdToClose,
        body: {
          endTime: new Date().toISOString(),
          closingBalanceCedis,
        },
      }).unwrap();
      toast.success('Session closed');
      setSessionIdToClose(null);
      setClosingBalance('0');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to close session');
    }
  }, [closeSession, closingBalance, sessionIdToClose]);

  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex items-end gap-3">
        <div className="space-y-1">
          <Label>Session Date</Label>
          <DatePicker date={selectedDate} onDateChange={handleDateChange} />
        </div>
      </div>
      {(view === 'all' || view === 'open') && (
        <CashierOpenSessionCard
          sessionTypeId={sessionTypeId}
          onSessionTypeChange={setSessionTypeId}
          openingBalance={openingBalance}
          onOpeningBalanceChange={setOpeningBalance}
          sessionTypes={sessionTypes ?? []}
          loadingSessionTypes={isLoadingTypes}
          submitting={isOpening || isClosing}
          onSubmit={handleOpenSession}
        />
      )}
      <CashierSessionsTable
        data={(data?.data ?? []).filter((session) => {
          if (view === 'history') return session.status !== 'ACTIVE';
          if (view === 'active' || view === 'close') return session.status === 'ACTIVE';
          return true;
        })}
        meta={data?.meta}
        loading={isLoading}
        branchId={scopedBranchId}
        onRequestChange={handleRequestChange}
        onCloseSession={(sessionId) => setSessionIdToClose(sessionId)}
      />
      <Dialog
        open={Boolean(sessionIdToClose)}
        onOpenChange={(open) => {
          if (open) return;
          setSessionIdToClose(null);
          setClosingBalance('0');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Cashier Session</DialogTitle>
            <DialogDescription>
              System preloads the expected total received for this cashier type. Confirm to end the
              session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="sessions-page-closing-balance">Expected Total Received (GHS)</Label>
            <Input
              id="sessions-page-closing-balance"
              inputMode="decimal"
              value={closingBalance}
              readOnly
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setSessionIdToClose(null);
                setClosingBalance('0');
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCloseSession} disabled={isClosing}>
              {isClosing ? 'Closing...' : 'Close Session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
