import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  ACTIVE_TAB_TRIGGER_CLASS,
  CustomerCardsTab,
  CustomerCreditsTab,
  CustomerDetailsHeader,
  CustomerPaymentsTab,
  CustomerStatementsTab,
  CustomerTabRangeFilter,
  CustomerTransactionsTab,
  type CustomerDetailsTabKey,
} from '@/features/customers/components/details';
import { useCustomerProfile } from '../../hooks';

export function CustomerDetailsPage() {
  const {
    id,
    customer,
    isLoadingCustomer,
    txPage,
    setTxPage,
    paymentsPage,
    setPaymentsPage,
    activeTab,
    setActiveTab,
    chartsOpen,
    setChartsOpen,
    chartYear,
    setChartYear,
    txRange,
    setTxRange,
    paymentsRange,
    setPaymentsRange,
    statementRange,
    setStatementRange,
    creditsRange,
    setCreditsRange,
    openParcelDetails,
    transactions,
    isLoadingTransactions,
    monthlyTransactions,
    isFetchingMonthlyTransactions,
    payments,
    isLoadingPayments,
    monthlyPayments,
    isFetchingMonthlyPayments,
    statement,
    isFetchingStatement,
    creditSummary,
    creditTransactions,
    statementRowsWithRunningBalance,
    branchNameById,
    cardId,
    setCardId,
    cardNumber,
    setCardNumber,
    cardFrontImageUrl,
    setCardFrontImageUrl,
    cardBackImageUrl,
    setCardBackImageUrl,
    cardOptions,
    customerCards,
    isAddingCard,
    isUpdatingCard,
    handleAddCard,
    handleUpdateCard,
  } = useCustomerProfile();
  if (!id) {
    return (
      <div className="w-full p-4">
        <Card>
          <CardHeader>
            <CardTitle>Invalid customer id</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoadingCustomer || !customer) {
    return (
      <div className="w-full p-4">
        <Card>
          <CardHeader>
            <CardTitle>Loading customer...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <ScrollableWrapper>
      <div className="w-full space-y-4 p-4">
        <CustomerDetailsHeader
          customer={customer}
          chartsOpen={chartsOpen}
          onChartsOpenChange={setChartsOpen}
          chartYear={chartYear}
          onPreviousChartYear={() => setChartYear((prev) => prev - 1)}
          onNextChartYear={() => setChartYear((prev) => prev + 1)}
          monthlyTransactions={monthlyTransactions}
          monthlyPayments={monthlyPayments}
          isFetchingMonthlyTransactions={isFetchingMonthlyTransactions}
          isFetchingMonthlyPayments={isFetchingMonthlyPayments}
        />

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as CustomerDetailsTabKey)}
          className="h-[calc(100vh-12rem)] min-h-[34rem] space-y-4"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <TabsList>
              <TabsTrigger value="transactions" className={ACTIVE_TAB_TRIGGER_CLASS}>
                Transactions
              </TabsTrigger>
              <TabsTrigger value="payments" className={ACTIVE_TAB_TRIGGER_CLASS}>
                Payments
              </TabsTrigger>
              <TabsTrigger value="statements" className={ACTIVE_TAB_TRIGGER_CLASS}>
                Statements
              </TabsTrigger>
              <TabsTrigger value="credits" className={ACTIVE_TAB_TRIGGER_CLASS}>
                Credits
              </TabsTrigger>
              <TabsTrigger value="cards" className={ACTIVE_TAB_TRIGGER_CLASS}>
                Cards
              </TabsTrigger>
            </TabsList>
            <CustomerTabRangeFilter
              activeTab={activeTab}
              transactionsRange={txRange}
              onTransactionsRangeChange={setTxRange}
              paymentsRange={paymentsRange}
              onPaymentsRangeChange={setPaymentsRange}
              statementsRange={statementRange}
              onStatementsRangeChange={setStatementRange}
              creditsRange={creditsRange}
              onCreditsRangeChange={setCreditsRange}
            />
          </div>

          <TabsContent value="transactions" className="h-[calc(100%-2.75rem)] min-h-0">
            <CustomerTransactionsTab
              isLoadingTransactions={isLoadingTransactions}
              transactions={transactions}
              branchNameById={branchNameById}
              txPage={txPage}
              onPrevPage={() => setTxPage((prev) => Math.max(1, prev - 1))}
              onNextPage={() => setTxPage((prev) => prev + 1)}
              onViewParcel={openParcelDetails}
            />
          </TabsContent>

          <TabsContent value="payments" className="h-[calc(100%-2.75rem)] min-h-0">
            <CustomerPaymentsTab
              customerId={id}
              isLoadingPayments={isLoadingPayments}
              payments={payments}
              paymentsPage={paymentsPage}
              onPrevPage={() => setPaymentsPage((prev) => Math.max(1, prev - 1))}
              onNextPage={() => setPaymentsPage((prev) => prev + 1)}
            />
          </TabsContent>

          <TabsContent value="statements" className="h-[calc(100%-2.75rem)] min-h-0">
            <CustomerStatementsTab
              isFetchingStatement={isFetchingStatement}
              statement={statement}
              statementRowsWithRunningBalance={statementRowsWithRunningBalance}
            />
          </TabsContent>

          <TabsContent value="credits" className="h-[calc(100%-2.75rem)] min-h-0">
            <CustomerCreditsTab
              creditSummary={creditSummary}
              creditTransactions={creditTransactions}
            />
          </TabsContent>

          <TabsContent value="cards" className="h-[calc(100%-2.75rem)] min-h-0">
            <CustomerCardsTab
              cardId={cardId}
              onCardIdChange={setCardId}
              cardNumber={cardNumber}
              onCardNumberChange={setCardNumber}
              frontImageUrl={cardFrontImageUrl}
              onFrontImageUrlChange={setCardFrontImageUrl}
              backImageUrl={cardBackImageUrl}
              onBackImageUrlChange={setCardBackImageUrl}
              cardOptions={cardOptions}
              customerCards={customerCards}
              isAddingCard={isAddingCard}
              isUpdatingCard={isUpdatingCard}
              onAddCard={handleAddCard}
              onUpdateCard={handleUpdateCard}
            />
          </TabsContent>
        </Tabs>
      </div>
    </ScrollableWrapper>
  );
}
