import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  useGetInventoryMonitoringSummaryQuery,
  useRunInventoryDailyAutomationMutation,
} from '@/features/inventory/api';
import { useAuthStore } from '@/stores/auth-store';

export function InventoryMonitoringPage() {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const { data, isLoading, refetch } = useGetInventoryMonitoringSummaryQuery(
    { companyId: companyId ?? '', daysAhead: 30, issueLookbackDays: 90 },
    { skip: !companyId },
  );
  const [runDaily, { isLoading: running }] = useRunInventoryDailyAutomationMutation();

  const onRunDaily = async () => {
    if (!companyId) return;
    try {
      await runDaily({ companyId, daysAhead: 30, sendEmailAlerts: true }).unwrap();
      toast.success('Inventory daily automation executed');
      await refetch();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to run automation');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Inventory Monitoring</CardTitle>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/inventory/stock-lots/analytics">Lot Analytics</Link>
              </Button>
              <Button onClick={onRunDaily} disabled={running || !companyId}>
                Run Daily Job
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading monitoring summary...</p>
            ) : data ? (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
                <div className="border rounded p-3">
                  Open reservation exceptions:{' '}
                  <strong>{data.reservationExceptions.openCount}</strong>
                </div>
                <div className="border rounded p-3">
                  Short reservations: <strong>{data.reservationExceptions.shortCount}</strong>
                </div>
                <div className="border rounded p-3">
                  Near expiry lots: <strong>{data.lotRisk.nearExpiryCount}</strong>
                </div>
                <div className="border rounded p-3">
                  Expired lots: <strong>{data.lotRisk.expiredCount}</strong>
                </div>
                <div className="border rounded p-3">
                  At-risk qty: <strong>{data.lotRisk.atRiskQuantity}</strong>
                </div>
                <div className="border rounded p-3">
                  FEFO compliance: <strong>{data.lotRisk.fefoComplianceRatePct}%</strong>
                </div>
                <div className="border rounded p-3">
                  Draft counts: <strong>{data.stockCountSessions.draft}</strong>
                </div>
                <div className="border rounded p-3">
                  Submitted counts: <strong>{data.stockCountSessions.submitted}</strong>
                </div>
              </div>
            ) : (
              <p>No monitoring data.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
