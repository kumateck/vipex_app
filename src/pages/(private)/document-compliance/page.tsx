import { ModuleWorkspacePage } from '@/features/company-modules/pages/module-workspace-page';

export default function DocumentCompliancePage() {
  return (
    <ModuleWorkspacePage
      moduleCode="document_compliance"
      title="Document & Compliance"
      description="Centralize KYC, contracts, and retention policies with audit-ready document trails."
      nextMilestones={[
        'KYC and contract document repository',
        'Retention and archival policy automation',
        'Audit traceability for document actions',
      ]}
    />
  );
}
