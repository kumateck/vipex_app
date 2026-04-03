import { ModuleWorkspacePage } from '@/features/company-modules/pages/module-workspace-page';

export default function SlaClaimsPage() {
  return (
    <ModuleWorkspacePage
      moduleCode="sla_claims"
      title="Service Level & Claims"
      description="Monitor delivery SLA breaches and process damaged or lost parcel claims."
      nextMilestones={[
        'Late-delivery breach detection with thresholds',
        'Claims intake and validation workflow',
        'Compensation approval and payout tracking',
      ]}
    />
  );
}
