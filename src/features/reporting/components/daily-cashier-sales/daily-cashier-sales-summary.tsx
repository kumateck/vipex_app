import { useDeliveryCashierCollections } from './use-delivery-cashier-collections';
import type { DailyCashierSalesReport } from '@/features/reporting/api/reporting.api';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoneyPsw } from './daily-cashier-sales-utils';

type DailyCashierSalesSummaryProps = {
  report?: DailyCashierSalesReport;
};

export function DailyCashierSalesSummary({ report }: DailyCashierSalesSummaryProps) {
  const collections = useDeliveryCashierCollections(report);
  return (
    <>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        <SummaryCard label="Sessions" value={report?.totals.sessions ?? 0} />
        <SummaryCard
          label="Outstanding To Be Paid"
          value={formatMoneyPsw(report?.totals.toBePaidPsw ?? 0)}
        />
        <SummaryCard label="Gross Sales" value={formatMoneyPsw(report?.totals.grossPsw ?? 0)} />
        <SummaryCard
          label="Sender Sales"
          value={formatMoneyPsw(report?.cashierTypeTotals.senderPsw ?? 0)}
        />
        <SummaryCard
          label="Receiver Sales"
          value={formatMoneyPsw(report?.cashierTypeTotals.receiverPsw ?? 0)}
        />
      </div>
      {collections.visible ? (
        <section className="space-y-2" aria-label="Delivery cashier collections">
          <h2 className="text-sm font-semibold">Delivery cashier collections</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <SummaryCard
              label="Delivery fees received"
              value={formatMoneyPsw(collections.deliveryFeeReceivedPsw)}
            />
            <SummaryCard
              label="To Be Paid received"
              value={formatMoneyPsw(collections.toBePaidReceivedPsw)}
            />
          </div>
        </section>
      ) : null}

      <div className="grid gap-3 md:grid-cols-5">
        <SummaryCard label="Cash" value={formatMoneyPsw(report?.paymentModeTotals.cashPsw ?? 0)} />
        <SummaryCard label="MTN" value={formatMoneyPsw(report?.paymentModeTotals.mtnPsw ?? 0)} />
        <SummaryCard
          label="Telecel"
          value={formatMoneyPsw(report?.paymentModeTotals.telecelPsw ?? 0)}
        />
        <SummaryCard
          label="AirtelTigo"
          value={formatMoneyPsw(report?.paymentModeTotals.airtelPsw ?? 0)}
        />
        <SummaryCard
          label="Credit"
          value={formatMoneyPsw(report?.paymentModeTotals.creditPsw ?? 0)}
        />
      </div>
    </>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle>{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
