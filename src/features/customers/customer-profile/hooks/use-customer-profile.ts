import { useMemo, useState } from 'react';
import { endOfDay, startOfDay, subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { useParams } from 'react-router-dom';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useParcelDetailsViewer } from '@/features/operations/parcel-details';
import {
  useGetCustomerByIdQuery,
  useGetCustomerCreditSummaryQuery,
  useGetCustomerPaymentsMonthlyQuery,
  useGetCustomerStatementQuery,
  useGetCustomerTransactionsMonthlyQuery,
  useListCustomerCreditTransactionsQuery,
  useListCustomerPaymentsQuery,
  useListCustomerTransactionsQuery,
} from '@/features/customers/api';
import {
  buildStatementRowsWithRunningBalance,
  type CustomerDetailsTabKey,
} from '@/features/customers/components/details';
import { useCustomerCards } from './use-customer-cards';
function createLast30DaysRange(): DateRange {
  const now = new Date();
  return {
    from: startOfDay(subDays(now, 30)),
    to: endOfDay(now),
  };
}

export function useCustomerProfile() {
  const { id } = useParams<{ id: string }>();

  const [txPage, setTxPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [activeTab, setActiveTab] = useState<CustomerDetailsTabKey>('transactions');
  const [chartsOpen, setChartsOpen] = useState(false);
  const [chartYear, setChartYear] = useState(() => new Date().getFullYear());

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

  const openParcelDetails = useParcelDetailsViewer((state) => state.open);
  const shouldLoadTransactions = activeTab === 'transactions';
  const shouldLoadPayments = activeTab === 'payments';
  const shouldLoadStatement = activeTab === 'statements';
  const shouldLoadCredits = activeTab === 'credits';
  const cardModel = useCustomerCards(id, activeTab === 'cards');
  const shouldLoadBranches = shouldLoadTransactions;

  const { data: customer, isLoading: isLoadingCustomer } = useGetCustomerByIdQuery(id ?? '', {
    skip: !id,
  });

  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    { companyId: customer?.companyId },
    { skip: !customer?.companyId || !shouldLoadBranches },
  );

  const { data: transactions, isLoading: isLoadingTransactions } = useListCustomerTransactionsQuery(
    {
      customerId: id ?? '',
      page: txPage,
      pageSize: 20,
      dateFrom: txRange?.from?.toISOString(),
      dateTo: txRange?.to?.toISOString(),
    },
    { skip: !id || !shouldLoadTransactions },
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
      pageSize: 20,
      dateFrom: paymentsRange?.from?.toISOString(),
      dateTo: paymentsRange?.to?.toISOString(),
    },
    { skip: !id || !shouldLoadPayments },
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
    { skip: !id || !shouldLoadStatement },
  );

  const { data: creditSummary } = useGetCustomerCreditSummaryQuery(
    { customerId: id ?? '' },
    { skip: !id || !shouldLoadCredits },
  );

  const { data: creditTransactions = [] } = useListCustomerCreditTransactionsQuery(
    {
      customerId: id ?? '',
      limit: 200,
      dateFrom: creditsRange?.from?.toISOString(),
      dateTo: creditsRange?.to?.toISOString(),
    },
    { skip: !id || !shouldLoadCredits },
  );

  const statementRowsWithRunningBalance = useMemo(
    () => buildStatementRowsWithRunningBalance(statement),
    [statement],
  );
  const branchNameById = useMemo(
    () => new Map(branchOptions.map((branch) => [branch.id, branch.name])),
    [branchOptions],
  );

  return {
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
    ...cardModel,
  };
}
