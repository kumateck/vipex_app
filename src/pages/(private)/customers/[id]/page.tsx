import { useMemo, useState } from 'react';
import { endOfDay, startOfDay, subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGetParcelDetailsQuery } from '@/features/operations/parcel/api/parcel.api';
import {
  useAddCustomerCardMutation,
  useGetCustomerByIdQuery,
  useGetCustomerCreditSummaryQuery,
  useGetCustomerPaymentsMonthlyQuery,
  useGetCustomerStatementQuery,
  useGetCustomerTransactionsMonthlyQuery,
  useListCardOptionsQuery,
  useListCustomerCardsQuery,
  useListCustomerCreditOpenItemsQuery,
  useListCustomerCreditTransactionsQuery,
  useListCustomerPaymentsQuery,
  useListCustomerTransactionsQuery,
  usePostCustomerCreditPaymentMutation,
} from '@/features/customers/api';
import {
  ACTIVE_TAB_TRIGGER_CLASS,
  buildStatementRowsWithRunningBalance,
  CustomerCardsTab,
  CustomerCreditsTab,
  CustomerDetailsHeader,
  CustomerPaymentsTab,
  CustomerStatementsTab,
  CustomerTabRangeFilter,
  CustomerTransactionsTab,
  type CustomerDetailsTabKey,
  formatMoney,
  ParcelTransactionDetailsDialog,
} from '@/features/customers/components/details';
import { useParams } from 'react-router-dom';

function createLast30DaysRange(): DateRange {
  const now = new Date();
  return {
    from: startOfDay(subDays(now, 30)),
    to: endOfDay(now),
  };
}

export default function CustomerDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [txPage, setTxPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [activeTab, setActiveTab] = useState<CustomerDetailsTabKey>('transactions');
  const [chartsOpen, setChartsOpen] = useState(false);
  const [chartYear, setChartYear] = useState(new Date().getFullYear());

  const [txRange, setTxRange] = useState<DateRange | undefined>(() => createLast30DaysRange());
  const [paymentsRange, setPaymentsRange] = useState<DateRange | undefined>(() =>
    createLast30DaysRange(),
  );
  const [statementRange, setStatementRange] = useState<DateRange | undefined>(() =>
    createLast30DaysRange(),
  );
  const [creditsRange, setCreditsRange] = useState<DateRange | undefined>(() =>
    createLast30DaysRange(),
  );

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [cardId, setCardId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);

  const { data: customer, isLoading: isLoadingCustomer } = useGetCustomerByIdQuery(id ?? '', {
    skip: !id,
  });

  const { data: cardOptions = [] } = useListCardOptionsQuery();
  const { data: customerCards = [] } = useListCustomerCardsQuery(
    { customerId: id ?? '' },
    { skip: !id },
  );

  const { data: transactions, isLoading: isLoadingTransactions } = useListCustomerTransactionsQuery(
    {
      customerId: id ?? '',
      page: txPage,
      pageSize: 30,
      dateFrom: txRange?.from?.toISOString(),
      dateTo: txRange?.to?.toISOString(),
    },
    { skip: !id },
  );

  const { data: monthlyTransactions, isFetching: isFetchingMonthlyTransactions } =
    useGetCustomerTransactionsMonthlyQuery(
      {
        customerId: id ?? '',
        year: chartYear,
      },
      { skip: !id || !chartsOpen },
    );

  const { data: payments, isLoading: isLoadingPayments } = useListCustomerPaymentsQuery(
    {
      customerId: id ?? '',
      page: paymentsPage,
      pageSize: 30,
      dateFrom: paymentsRange?.from?.toISOString(),
      dateTo: paymentsRange?.to?.toISOString(),
    },
    { skip: !id },
  );

  const { data: monthlyPayments, isFetching: isFetchingMonthlyPayments } =
    useGetCustomerPaymentsMonthlyQuery(
      {
        customerId: id ?? '',
        year: chartYear,
      },
      { skip: !id || !chartsOpen },
    );

  const { data: statement, isFetching: isFetchingStatement } = useGetCustomerStatementQuery(
    {
      customerId: id ?? '',
      dateFrom: statementRange?.from?.toISOString(),
      dateTo: statementRange?.to?.toISOString(),
    },
    { skip: !id },
  );

  const { data: creditSummary } = useGetCustomerCreditSummaryQuery(
    { customerId: id ?? '' },
    { skip: !id },
  );

  const { data: creditTransactions = [] } = useListCustomerCreditTransactionsQuery(
    {
      customerId: id ?? '',
      limit: 200,
      dateFrom: creditsRange?.from?.toISOString(),
      dateTo: creditsRange?.to?.toISOString(),
    },
    { skip: !id },
  );

  const { data: creditOpenItems = [] } = useListCustomerCreditOpenItemsQuery(
    {
      customerId: id ?? '',
      dateFrom: creditsRange?.from?.toISOString(),
      dateTo: creditsRange?.to?.toISOString(),
    },
    { skip: !id },
  );

  const { data: selectedParcelDetails, isFetching: isLoadingParcelDetails } =
    useGetParcelDetailsQuery(selectedParcelId ?? '', { skip: !selectedParcelId });

  const [postCreditPayment, { isLoading: isPostingPayment }] =
    usePostCustomerCreditPaymentMutation();
  const [addCustomerCard, { isLoading: isAddingCard }] = useAddCustomerCardMutation();

  const statementRowsWithRunningBalance = useMemo(
    () => buildStatementRowsWithRunningBalance(statement),
    [statement],
  );

  const handlePayDebt = async () => {
    if (!id) return;

    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    try {
      const result = await postCreditPayment({
        customerId: id,
        amountCedis: amount,
        notes: paymentNotes.trim() || undefined,
      }).unwrap();

      toast.success(
        `Payment recorded. Allocated ${formatMoney(result.allocatedAmountPsw)} across ${result.allocations.length} debt item(s).`,
      );
      setPaymentAmount('');
      setPaymentNotes('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to record payment');
    }
  };

  const handleAddCard = async () => {
    if (!id) return;

    if (!cardId) {
      toast.error('Select a card type');
      return;
    }

    if (!cardNumber.trim()) {
      toast.error('Enter card number');
      return;
    }

    try {
      await addCustomerCard({ customerId: id, cardId, cardNumber: cardNumber.trim() }).unwrap();
      toast.success('Card added');
      setCardNumber('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add card');
    }
  };

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
            txPage={txPage}
            onPrevPage={() => setTxPage((prev) => Math.max(1, prev - 1))}
            onNextPage={() => setTxPage((prev) => prev + 1)}
            onViewParcel={setSelectedParcelId}
          />
        </TabsContent>

        <TabsContent value="payments" className="h-[calc(100%-2.75rem)] min-h-0">
          <CustomerPaymentsTab
            paymentAmount={paymentAmount}
            onPaymentAmountChange={setPaymentAmount}
            paymentNotes={paymentNotes}
            onPaymentNotesChange={setPaymentNotes}
            onPayDebt={handlePayDebt}
            isPostingPayment={isPostingPayment}
            creditOpenItems={creditOpenItems}
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
            cardOptions={cardOptions}
            customerCards={customerCards}
            isAddingCard={isAddingCard}
            onAddCard={handleAddCard}
          />
        </TabsContent>
      </Tabs>

      <ParcelTransactionDetailsDialog
        open={Boolean(selectedParcelId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedParcelId(null);
          }
        }}
        details={selectedParcelDetails}
        isLoading={isLoadingParcelDetails}
      />
    </div>
  );
}
