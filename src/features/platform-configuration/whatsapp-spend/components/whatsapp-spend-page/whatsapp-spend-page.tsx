import { useCallback, useState } from 'react';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { BillingRatesDialog } from '../../dialogs';
import { useSpendExport, useWhatsAppSpendReport } from '../../hooks';
import { MetaCostCard } from './meta-cost-card';
import { SpendByEventTable } from './spend-by-event-table';
import { SpendDailyTable } from './spend-daily-table';
import { SpendSummaryCards } from './spend-summary-cards';
import { SpendToolbar } from './spend-toolbar';

export function WhatsAppSpendPage() {
  const spend = useWhatsAppSpendReport();
  const exporter = useSpendExport(spend.report);
  const [isEditingRates, setIsEditingRates] = useState(false);
  const openRates = useCallback(() => setIsEditingRates(true), []);
  const closeRates = useCallback(() => setIsEditingRates(false), []);
  const report = spend.report;
  const currency = report?.prices.currency ?? 'USD';

  return (
    <div className="w-full space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">WhatsApp Spend</h1>
        <p className="text-sm text-muted-foreground">
          {report
            ? `Billable WhatsApp messages from ${report.period.from} to ${report.period.to}.`
            : 'Billable WhatsApp messages for a period.'}
        </p>
      </div>

      <SpendToolbar
        range={spend.range}
        onRangeChange={spend.setRange}
        onPreset={spend.applyPreset}
        onExport={exporter.exportCsv}
        onPrint={exporter.print}
        canExport={exporter.canExport}
        onEditRates={spend.canManageBilling && report ? openRates : undefined}
      />

      {spend.error ? (
        <p className="text-sm text-destructive">
          {getErrorMessage(spend.error, 'Could not load the WhatsApp spend report')}
        </p>
      ) : null}
      {spend.isLoading && !report ? (
        <p className="text-sm text-muted-foreground">Loading WhatsApp spend...</p>
      ) : null}

      {report ? (
        <>
          {!report.prices.isConfigured ? (
            <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground print:hidden">
              Billing prices are not set yet, so amounts show as 0.
              {spend.canManageBilling ? ' Use "Billing prices" to set them.' : ''}
            </p>
          ) : null}
          {report.totals.unpriced ? (
            <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground print:hidden">
              {report.totals.unpriced.toLocaleString()} billable messages were sent before your
              first price start date and are billed at 0.
            </p>
          ) : null}
          <SpendSummaryCards totals={report.totals} currency={currency} />
          {report.metaCost ? (
            <MetaCostCard
              metaCost={report.metaCost}
              margin={report.margin}
              amountDue={report.totals.amount}
              freeMessages={report.totals.free ?? 0}
              currency={currency}
            />
          ) : null}
          <SpendByEventTable rows={report.byEvent} totals={report.totals} currency={currency} />
          <SpendDailyTable rows={report.daily} currency={currency} />
        </>
      ) : null}

      {isEditingRates && report ? (
        <BillingRatesDialog prices={report.prices} onClose={closeRates} />
      ) : null}
    </div>
  );
}
