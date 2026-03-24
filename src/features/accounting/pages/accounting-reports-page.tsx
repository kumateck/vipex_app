import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import { AccountingDisabledState, AccountingUnauthorizedState } from './accounting-shared';

type ReportRoute = {
  title: string;
  description: string;
  to: string;
};

const FINANCIAL_REPORT_ROUTES: ReportRoute[] = [
  {
    title: 'Trial Balance',
    description: 'Review account debit and credit balances for a selected period.',
    to: '/reports/financial/trial-balance',
  },
  {
    title: 'Account Statement',
    description: 'Inspect running transactions and balances for a selected account.',
    to: '/reports/financial/account-statement',
  },
  {
    title: 'Income Statement',
    description: 'Track income, expenses, and net performance over time.',
    to: '/reports/financial/income-statement',
  },
  {
    title: 'Profit & Loss',
    description: 'Review profitability for the selected reporting period.',
    to: '/reports/financial/profit-loss',
  },
  {
    title: 'Balance Sheet',
    description: 'View assets, liabilities, and equity at a selected date.',
    to: '/reports/financial/balance-sheet',
  },
  {
    title: 'Cash Flow',
    description: 'Analyze operating, investing, and financing cash movement.',
    to: '/reports/financial/cash-flow',
  },
  {
    title: 'General Ledger',
    description: 'Inspect posted ledger lines and balances across time.',
    to: '/reports/financial/general-ledger',
  },
  {
    title: 'Journal Listing',
    description: 'Review posted journal lines from accounting activity.',
    to: '/reports/financial/journal-listing',
  },
  {
    title: 'Account Activity',
    description: 'Track account-level movement and running balances.',
    to: '/reports/financial/account-activity',
  },
];

const BRANCH_REPORT_ROUTES: ReportRoute[] = [
  {
    title: 'Monthly Branch Summary',
    description: 'Compare branch-level totals and net contribution by period.',
    to: '/reports/branch/monthly-summary',
  },
];

export function AccountingReportsPage() {
  const user = useAuthStore((state) => state.user);

  if (!user?.company?.useAccounting) {
    return <AccountingDisabledState />;
  }

  if (!user.permissions?.includes(PermissionKeys.CanReadAccounting)) {
    return (
      <AccountingUnauthorizedState
        title="Accounting Reports Restricted"
        description="Your role does not include permission to view accounting reports and accounting master data."
      />
    );
  }

  return <AccountingReportsPageContent />;
}

function ReportGrid({ reports }: { reports: ReportRoute[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {reports.map((report) => (
        <Card key={report.to}>
          <CardHeader>
            <CardTitle>{report.title}</CardTitle>
            <CardDescription>{report.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to={report.to}>Open report</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AccountingReportsPageContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Accounting Reports</h1>
        <p className="text-sm text-muted-foreground">
          These reports are generated from posted journal lines, so they stay aligned with confirmed
          accounting activity rather than raw operational entries.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Reports</CardTitle>
          <CardDescription>
            Open each report using its dedicated route from the reports center navigation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportGrid reports={FINANCIAL_REPORT_ROUTES} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branch & Performance</CardTitle>
          <CardDescription>
            Open branch-level accounting summaries from their dedicated report routes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportGrid reports={BRANCH_REPORT_ROUTES} />
        </CardContent>
      </Card>
    </div>
  );
}
