import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CustomerType,
  type Customer,
  type CustomerPaymentsMonthly,
  type CustomerTransactionsMonthly,
} from '@/features/customers/api';
import { CustomerChartsDrawer } from './customer-charts-drawer';

type CustomerDetailsHeaderProps = {
  customer: Customer;
  chartsOpen: boolean;
  onChartsOpenChange: (open: boolean) => void;
  chartYear: number;
  onPreviousChartYear: () => void;
  onNextChartYear: () => void;
  monthlyTransactions: CustomerTransactionsMonthly | undefined;
  monthlyPayments: CustomerPaymentsMonthly | undefined;
  isFetchingMonthlyTransactions: boolean;
  isFetchingMonthlyPayments: boolean;
};

export function CustomerDetailsHeader({
  customer,
  chartsOpen,
  onChartsOpenChange,
  chartYear,
  onPreviousChartYear,
  onNextChartYear,
  monthlyTransactions,
  monthlyPayments,
  isFetchingMonthlyTransactions,
  isFetchingMonthlyPayments,
}: CustomerDetailsHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold">{customer.fullname}</h1>
        <p className="text-sm text-muted-foreground">
          {customer.telephone || '-'} {customer.email ? `• ${customer.email}` : ''}
        </p>
        <div className="mt-2 flex gap-2">
          <Badge variant="outline">
            {customer.customerType === CustomerType.Business ? 'Business' : 'Individual'}
          </Badge>
          {customer.creditEligible ? (
            <Badge>Credit Eligible</Badge>
          ) : (
            <Badge variant="secondary">No Credit</Badge>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <CustomerChartsDrawer
          customer={customer}
          open={chartsOpen}
          onOpenChange={onChartsOpenChange}
          year={chartYear}
          onPreviousYear={onPreviousChartYear}
          onNextYear={onNextChartYear}
          monthlyTransactions={monthlyTransactions}
          monthlyPayments={monthlyPayments}
          isFetchingMonthlyTransactions={isFetchingMonthlyTransactions}
          isFetchingMonthlyPayments={isFetchingMonthlyPayments}
        />

        <Button asChild>
          <Link to={`/customers/edit/${customer.id}`}>Edit</Link>
        </Button>
      </div>
    </div>
  );
}
