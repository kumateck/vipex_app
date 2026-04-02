import { ModuleWorkspacePage } from '@/features/company-modules/pages/module-workspace-page';

export default function BiExecutiveDashboardPage() {
  return (
    <ModuleWorkspacePage
      moduleCode="bi_executive_dashboard"
      title="BI & Executive Dashboard"
      description="Track cross-branch KPIs and profitability with executive-ready analytics views."
      nextMilestones={[
        'Cross-branch KPI scorecards and trend lines',
        'Route and service-level profitability views',
        'Tax and settlement analytics summaries',
      ]}
    />
  );
}
