import { Button } from '@/components/ui/button';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DailyCashierSalesFilters } from './daily-cashier-sales-filters';
import { DailyCashierSalesPrintDocument } from './daily-cashier-sales-print-document';
import { DailyCashierSalesResultFilter } from './daily-cashier-sales-result-filter';
import { DailyCashierSalesSummary } from './daily-cashier-sales-summary';
import { DailyCashierSalesToBePaidTable } from './daily-cashier-sales-tobepaid-table';
import { DailyCashierSalesTransactionsTable } from './daily-cashier-sales-transactions-table';
import { useDailyCashierSales } from './use-daily-cashier-sales';

export function DailyCashierSalesPage() {
  const sales = useDailyCashierSales();
  const printableRowCount =
    sales.activeReportTab === 'tobepaid'
      ? (sales.report?.toBePaidRows.length ?? 0)
      : (sales.report?.transactions.length ?? 0);

  return (
    <div className="w-full space-y-4 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Daily Cashier Sales</h1>
          <p className="text-sm text-muted-foreground">
            Daily sales by session with sender, receiver, and delivery cashier breakdown.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={sales.handleLoadReport}
            disabled={
              sales.isFetching || !sales.hasPendingFilterChanges || !sales.hasRequiredFilters
            }
          >
            Load report
          </Button>
          <Button
            onClick={() => void sales.handlePrintReport()}
            disabled={!sales.report || printableRowCount === 0}
            variant="outline"
          >
            Print report
          </Button>
        </div>
      </div>

      <ScrollableWrapper>
        <div className="space-y-4">
          <DailyCashierSalesFilters
            date={sales.date}
            setDate={sales.setDate}
            branchId={sales.branchId}
            setBranchId={sales.setBranchId}
            locationId={sales.locationId}
            setLocationId={sales.setLocationId}
            cashierType={sales.cashierType}
            setCashierType={sales.setCashierType}
            cashierUserId={sales.cashierUserId}
            setCashierUserId={sales.setCashierUserId}
            canSelectCashier={sales.canSelectCashier}
            isHeadOffice={sales.isHeadOffice}
            effectiveBranchId={sales.effectiveBranchId}
            branchName={sales.user?.branch?.name ?? 'My branch'}
            locationName={sales.user?.location?.name ?? sales.user?.locationName ?? 'My location'}
            userFullname={sales.user?.fullname ?? 'My sales'}
            branchOptions={sales.branchOptions}
            locationOptions={sales.locationOptions}
            cashierOptions={sales.cashierOptions}
            isCashierOptionsFetching={sales.isCashierOptionsFetching}
          />
          {sales.report ? (
            <DailyCashierSalesResultFilter
              value={sales.moduleFilter}
              onChange={sales.setModuleFilter}
            />
          ) : null}
          <DailyCashierSalesSummary report={sales.report} />
          <Tabs
            value={sales.activeReportTab}
            onValueChange={(value) =>
              sales.setActiveReportTab(value as typeof sales.activeReportTab)
            }
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="tobepaid">To Be Paid</TabsTrigger>
            </TabsList>
            <TabsContent value="payments">
              <DailyCashierSalesTransactionsTable
                report={sales.report}
                isFetching={sales.isFetching}
                isUninitialized={sales.isUninitialized}
              />
            </TabsContent>
            <TabsContent value="tobepaid">
              <DailyCashierSalesToBePaidTable
                report={sales.report}
                isFetching={sales.isFetching}
                isUninitialized={sales.isUninitialized}
              />
            </TabsContent>
          </Tabs>
        </div>
      </ScrollableWrapper>

      <DailyCashierSalesPrintDocument
        printRef={sales.printRef}
        companyName={sales.user?.company?.name ?? 'Company'}
        generatedAt={sales.report?.generatedAt ?? new Date().toISOString()}
        filters={sales.filters}
        report={sales.report}
        activeTab={sales.activeReportTab}
      />
    </div>
  );
}
