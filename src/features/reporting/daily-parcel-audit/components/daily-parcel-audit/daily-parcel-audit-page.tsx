import { lazy, Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDailyParcelAudit } from '../../hooks/use-daily-parcel-audit';
import { DailyParcelAuditSummaryDialog } from '../../dialogs/daily-parcel-audit-summary-dialog';
import { formatMoneyPsw } from '../../utils/daily-parcel-audit.utils';
import { DailyParcelAuditFilters } from './daily-parcel-audit-filters';
import { DailyParcelAuditPrint } from './daily-parcel-audit-print';
import { DailyParcelAuditTable } from './daily-parcel-audit-table';

const DailyParcelAuditAnalytics = lazy(() =>
  import('./daily-parcel-audit-analytics').then((module) => ({
    default: module.DailyParcelAuditAnalytics,
  })),
);

export function DailyParcelAuditPage() {
  const audit = useDailyParcelAudit();
  const [summaryOpen, setSummaryOpen] = useState(false);
  return (
    <div className="w-full space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Daily Parcel Audit</h1>
          <p className="text-sm text-muted-foreground">
            Parcels created on the selected day. Payment and delivery reflect current records.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={audit.load} disabled={!audit.canLoad || audit.isFetching}>
            {audit.isFetching ? 'Loading…' : 'Load report'}
          </Button>
          <Button variant="outline" disabled={!audit.report} onClick={() => setSummaryOpen(true)}>
            View summary
          </Button>
          <Button variant="outline" disabled={!audit.report} onClick={audit.downloadCsv}>
            Export CSV
          </Button>
          <Button variant="outline" disabled={!audit.report} onClick={() => void audit.print()}>
            Print
          </Button>
        </div>
      </div>
      <ScrollableWrapper>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report filters</CardTitle>
              <CardDescription>
                Branch users are limited to their own branch; head office may select any branch.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DailyParcelAuditFilters
                date={audit.date}
                onDateChange={audit.setDate}
                branchId={audit.selectedBranchId}
                onBranchChange={audit.setSelectedBranchId}
                isHeadOffice={audit.isHeadOffice}
                branchName={audit.user?.branch?.name ?? 'My branch'}
                branches={audit.branches}
                view={audit.view}
                onViewChange={audit.setView}
                paymentStatus={audit.paymentStatus}
                onPaymentStatusChange={audit.setPaymentStatus}
                deliveryStatus={audit.deliveryStatus}
                onDeliveryStatusChange={audit.setDeliveryStatus}
              />
            </CardContent>
          </Card>
          {audit.isError ? (
            <p role="alert" className="text-sm text-destructive">
              Could not load the audit report. Please try again.
            </p>
          ) : null}
          {audit.report ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {audit.view === 'receiver' ? 'Receiver to Pay' : 'Sender-paid'} ·{' '}
                  {audit.report.filters.date}
                </CardTitle>
                <CardDescription>
                  {audit.branchName} · {audit.rows.length} parcels in view
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <SummaryTile label="Parcels" value={String(audit.totals.parcels)} />
                  <SummaryTile label="Delivered" value={String(audit.totals.delivered)} />
                  <SummaryTile
                    label="Receiver collected"
                    value={formatMoneyPsw(audit.totals.receiverPaidPsw)}
                  />
                  <SummaryTile
                    label="Receiver outstanding"
                    value={formatMoneyPsw(audit.totals.receiverOutstandingPsw)}
                  />
                </div>
                <Tabs defaultValue="details">
                  <TabsList aria-label="Report display">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  </TabsList>
                  <TabsContent value="details">
                    <DailyParcelAuditTable rows={audit.rows} view={audit.view} />
                  </TabsContent>
                  <TabsContent value="analytics">
                    <Suspense
                      fallback={<p className="text-sm text-muted-foreground">Loading charts…</p>}
                    >
                      <DailyParcelAuditAnalytics rows={audit.rows} view={audit.view} />
                    </Suspense>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground">Select a date and load the report.</p>
          )}
        </div>
      </ScrollableWrapper>
      <DailyParcelAuditSummaryDialog
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        totals={audit.totals}
        title={`${audit.view === 'receiver' ? 'Receiver to Pay' : 'Sender-paid'} · ${audit.report?.filters.date ?? audit.date}`}
      />
      {audit.report ? (
        <DailyParcelAuditPrint
          printRef={audit.printRef}
          companyName={audit.user?.company?.name ?? 'Company'}
          generatedAt={audit.report.generatedAt}
          date={audit.report.filters.date}
          branchName={audit.branchName}
          view={audit.view}
          rows={audit.rows}
        />
      ) : null}
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
