import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function DashboardKpiCard({
  label,
  value,
  loading = false,
}: {
  label: string;
  value: string | number;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{loading ? 'Loading...' : value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
