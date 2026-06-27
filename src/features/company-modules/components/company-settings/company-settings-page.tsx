import { formatDateTime as sharedFormatDateTime } from '@/lib/dates';
import { toast } from 'sonner';
import { Building2, Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useAuthStore } from '@/stores/auth-store';
import { useListCompanyModulesQuery, useSetCompanyModuleStateMutation } from '../../api';

function formatDateTime(value: string | null) {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Never';
  return sharedFormatDateTime(value);
}

export function CompanySettingsPage() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const { data: modules = [], isFetching, refetch } = useListCompanyModulesQuery();
  const [setCompanyModuleState, { isLoading: isSaving }] = useSetCompanyModuleStateMutation();

  async function handleToggle(moduleCode: string, isEnabled: boolean) {
    try {
      await setCompanyModuleState({ moduleCode, isEnabled }).unwrap();
      if (moduleCode === 'accounting' && user?.company) {
        updateUser({
          company: {
            ...user.company,
            useAccounting: isEnabled,
          },
        });
      }
      toast.success(`${moduleCode} ${isEnabled ? 'enabled' : 'disabled'}`);
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update company module');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Company Settings</h1>
          <p className="text-sm text-muted-foreground">
            Enable or disable company modules. Disabling a module removes its screens and blocks its
            backend routes without affecting unrelated workflows.
          </p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Shield className="h-3.5 w-3.5" />
          Head Office Control
        </Badge>
      </div>

      <ScrollableWrapper>
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Module Access
              </CardTitle>
              <CardDescription>
                Accounting uses this company-level setting. When disabled, accounting pages and
                routes are unavailable and operational parcel/payment flows continue normally.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isFetching ? (
                <div className="text-sm text-muted-foreground">Loading company modules...</div>
              ) : (
                modules.map((module) => {
                  const busy = isSaving;
                  return (
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
                        onClick={() => void handleToggle(module.code, !module.isEnabled)}
                        disabled={busy || !module.isActive}
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
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollableWrapper>
    </div>
  );
}
