import { formatDateTime as formatDateTimeShared } from '@/lib/dates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetModuleWorkspaceOverviewQuery } from '../api/module-workspace.api';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

type ModuleWorkspacePageProps = {
  moduleCode: string;
  title: string;
  description: string;
  nextMilestones: string[];
};

export function ModuleWorkspacePage({
  moduleCode,
  title,
  description,
  nextMilestones,
}: ModuleWorkspacePageProps) {
  const { data, isLoading, isError } = useGetModuleWorkspaceOverviewQuery(moduleCode);

  const metricCards = [
    { label: 'Branches', value: data?.metrics.totalBranches ?? 0 },
    { label: 'Customers', value: data?.metrics.totalCustomers ?? 0 },
    { label: 'Employees', value: data?.metrics.totalEmployees ?? 0 },
    { label: 'Parcels', value: data?.metrics.totalParcels ?? 0 },
    { label: 'Payments', value: data?.metrics.totalPayments ?? 0 },
  ];

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {metricCards.map((metric) => (
            <Card key={metric.label}>
              <CardHeader className="pb-2">
                <CardDescription>{metric.label}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{metric.value.toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading module overview...</p>
            ) : isError ? (
              <p className="text-sm text-destructive">
                Could not load module overview. Ensure this module is enabled for your company.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Overview refreshed at {formatDateTimeShared(data!.snapshotAt)}.
              </p>
            )}
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              {(data?.checkpoints?.length ? data.checkpoints : nextMilestones).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
