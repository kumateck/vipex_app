import { Suspense, lazy } from 'react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import type {
  Customer,
  CustomerPaymentsMonthly,
  CustomerTransactionsMonthly,
} from '@/features/customers/api';
const CustomerChartsContent = lazy(() =>
  import('./customer-charts-content').then((module) => ({
    default: module.CustomerChartsContent,
  })),
);

type CustomerChartsDrawerProps = {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  onPreviousYear: () => void;
  onNextYear: () => void;
  monthlyTransactions: CustomerTransactionsMonthly | undefined;
  monthlyPayments: CustomerPaymentsMonthly | undefined;
  isFetchingMonthlyTransactions: boolean;
  isFetchingMonthlyPayments: boolean;
};

export function CustomerChartsDrawer({
  customer,
  open,
  onOpenChange,
  year,
  onPreviousYear,
  onNextYear,
  monthlyTransactions,
  monthlyPayments,
  isFetchingMonthlyTransactions,
  isFetchingMonthlyPayments,
}: CustomerChartsDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <Button variant="outline">View charts</Button>
      </DrawerTrigger>
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:h-[90vh] data-[vaul-drawer-direction=bottom]:max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Customer Charts</DrawerTitle>
          <DrawerDescription>
            Year-based customer analytics for {customer.fullname}.
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-4 px-4 pb-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Year {year}</p>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onPreviousYear}>
                  Prev Year
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={onNextYear}>
                  Next Year
                </Button>
              </div>
            </div>

            {open ? (
              <Suspense
                fallback={<p className="text-sm text-muted-foreground">Loading charts...</p>}
              >
                <CustomerChartsContent
                  monthlyTransactions={monthlyTransactions}
                  monthlyPayments={monthlyPayments}
                  isFetchingMonthlyTransactions={isFetchingMonthlyTransactions}
                  isFetchingMonthlyPayments={isFetchingMonthlyPayments}
                  year={year}
                />
              </Suspense>
            ) : null}

            <DrawerClose asChild>
              <Button type="button" variant="outline" className="w-full">
                Close
              </Button>
            </DrawerClose>
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
