import { ModuleWorkspacePage } from '@/features/company-modules/pages/module-workspace-page';

export default function DispatchOptimizationPage() {
  return (
    <ModuleWorkspacePage
      moduleCode="dispatch_optimization"
      title="Advanced Dispatch Optimization"
      description="Improve dispatch throughput with route batching, rider balancing, and ETA assist."
      nextMilestones={[
        'Route batching and dispatch wave planning',
        'Rider load balancing by location and SLA',
        'ETA prediction and alerting for exceptions',
      ]}
    />
  );
}
