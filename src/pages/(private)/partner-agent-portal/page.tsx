import { ModuleWorkspacePage } from '@/features/company-modules/pages/module-workspace-page';

export default function PartnerAgentPortalPage() {
  return (
    <ModuleWorkspacePage
      moduleCode="partner_agent_portal"
      title="API Partner / Agent Portal"
      description="Enable external partners to book, track, and settle with secured integration points."
      nextMilestones={[
        'Agent booking and tracking workspace',
        'Partner settlement and remittance views',
        'Webhook and API key management controls',
      ]}
    />
  );
}
