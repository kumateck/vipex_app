import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useCloseSessionMutation, useListSessionsQuery, useListSessionTypesQuery, useOpenSessionMutation } from '../../api/cashiers.api';
import type { CashierSessionListQuery } from '../../types/cashier.types';
import { CashierOpenSessionCard } from './cashier-open-session-card';
import { CashierSessionsTable } from './cashier-sessions-table';

export function CashierSessionsPageContent() {
  const authUser = useAuthStore((state) => state.user);
  const cashierId = authUser?.id ?? '';
  const branchId = authUser?.branch?.id ?? '';
  const [sessionTypeId, setSessionTypeId] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [query, setQuery] = useState<CashierSessionListQuery>({
    page: 1,
    pageSize: 20,
    filters: { branchId: branchId || null },
  });

  const { data: sessionTypes, isLoading: isLoadingTypes } = useListSessionTypesQuery();
  const { data, isLoading } = useListSessionsQuery(query, { skip: !branchId });
  const [openSession, { isLoading: isOpening }] = useOpenSessionMutation();
  const [closeSession, { isLoading: isClosing }] = useCloseSessionMutation();

  const handleRequestChange = useCallback((request: CashierSessionListQuery) => setQuery(request), []);

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

  const handleCloseSession = useCallback(
    async (sessionId: string) => {
      const value = window.prompt('Closing balance (cedis)', '0');
      if (value == null) return;
      const closingBalanceCedis = Number(value);
      if (Number.isNaN(closingBalanceCedis)) {
        toast.error('Invalid balance value');
        return;
      }

      try {
        await closeSession({
          id: sessionId,
          body: {
            endTime: new Date().toISOString(),
            closingBalanceCedis,
          },
        }).unwrap();
        toast.success('Session closed');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to close session');
      }
    },
    [closeSession],
  );

  return (
    <div className="w-full p-4 space-y-4">
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
      <CashierSessionsTable
        data={data?.data ?? []}
        meta={data?.meta}
        loading={isLoading}
        branchId={branchId || null}
        onRequestChange={handleRequestChange}
        onCloseSession={handleCloseSession}
      />
    </div>
  );
}
