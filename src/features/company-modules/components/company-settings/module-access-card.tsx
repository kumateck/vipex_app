import { formatDateTime as sharedFormatDateTime } from '@/lib/dates';
import { Building2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CompanyModuleRow } from '../../api';

function formatDateTime(value: string | null) {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Never';
  return sharedFormatDateTime(value);
}

export function ModuleAccessCard({
  modules,
  isFetching,
  isSaving,
  onToggle,
}: {
  modules: CompanyModuleRow[];
  isFetching: boolean;
  isSaving: boolean;
  onToggle: (moduleCode: string, isEnabled: boolean) => Promise<void>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Module Access
        </CardTitle>
        <CardDescription>
          Accounting uses this company-level setting. When disabled, accounting pages and routes are
          unavailable and operational parcel/payment flows continue normally.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isFetching ? (
          <div className="text-sm text-muted-foreground">Loading company modules...</div>
        ) : (
          modules.map((module) => (
            <div
              key={module.code}
              className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium">{module.name}</h2>
                  <Badge variant={module.isEnabled ? 'default' : 'secondary'}>
                    {module.isEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  {module.isCore ? <Badge variant="outline">Core</Badge> : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  {module.description || 'No description'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Last enabled: {formatDateTime(module.enabledAt)}. Last disabled:{' '}
                  {formatDateTime(module.disabledAt)}.
                </p>
              </div>
              <Button
                type="button"
                variant={module.isEnabled ? 'outline' : 'default'}
                onClick={() => void onToggle(module.code, !module.isEnabled)}
                disabled={isSaving || !module.isActive}
                className="min-w-36 gap-2"
              >
                {module.isEnabled ? (
                  <>
                    <ToggleLeft className="h-4 w-4" />
                    Disable
                  </>
                ) : (
                  <>
                    <ToggleRight className="h-4 w-4" />
                    Enable
                  </>
                )}
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
