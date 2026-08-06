import { AccountingReportRoute } from './components/accounting-report-route';
import { type AccountingRouteReportKey } from './types/accounting-report-route.types';

export type { AccountingRouteReportKey } from './types/accounting-report-route.types';

export function AccountingReportRoutePage({ report }: { report: AccountingRouteReportKey }) {
  return <AccountingReportRoute report={report} />;
}
