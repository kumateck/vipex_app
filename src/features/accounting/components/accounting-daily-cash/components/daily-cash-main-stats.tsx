import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CashConfirmationStatus } from '@/db/schemas/enums';
import { formatDate, formatMoney } from '../../accounting-shared';
import type { AccountingDailyCashViewData } from '../types/accounting-daily-cash-view-data';

export function DailyCashMainStats({
  confirmations,
  expectedSummary,
  totalCountedPsw,
  totalExpectedPsw,
}: Pick<
  AccountingDailyCashViewData,
  'confirmations' | 'expectedSummary' | 'totalCountedPsw' | 'totalExpectedPsw'
>) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Expected</CardDescription>
            <CardTitle>{formatMoney(totalExpectedPsw)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Counted</CardDescription>
            <CardTitle>{formatMoney(totalCountedPsw)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Open Confirmations</CardDescription>
            <CardTitle>
              {confirmations.filter((row) => row.status !== CashConfirmationStatus.POSTED).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Expected Physical Cash</CardDescription>
            <CardTitle>{formatMoney(expectedSummary?.cashSalesPsw ?? 0)}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Cash-only collections from recorded payments for the selected day.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Non-Cash Collections</CardDescription>
            <CardTitle>{formatMoney(expectedSummary?.nonCashSalesPsw ?? 0)}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Mobile money and other non-cash receipts are shown separately for review.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Sales In View</CardDescription>
            <CardTitle>{formatMoney(expectedSummary?.totalSalesPsw ?? 0)}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Combined cash and non-cash receipts for the selected filters.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Payment Count</CardDescription>
            <CardTitle>{expectedSummary?.transactionCount ?? 0}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Sender, receiver, and delivery collections included in the day summary.
          </CardContent>
        </Card>
      </div>

      {expectedSummary?.session ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Session Status</CardDescription>
              <CardTitle>{expectedSummary.session.status}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-muted-foreground">
              Started {formatDate(expectedSummary.session.scheduledStartTime)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Expected Closing Balance</CardDescription>
              <CardTitle>
                {formatMoney(expectedSummary.session.expectedClosingBalancePsw ?? 0)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Reported Closing Balance</CardDescription>
              <CardTitle>{formatMoney(expectedSummary.session.closingBalancePsw ?? 0)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Session Variance</CardDescription>
              <CardTitle>{formatMoney(expectedSummary.session.variancePsw ?? 0)}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      ) : null}
    </>
  );
}
