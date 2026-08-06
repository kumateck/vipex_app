import { Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useCompanyModuleSettings } from '../../hooks';
import { ModuleAccessCard } from './module-access-card';

export function CompanySettingsPage() {
  const moduleSettings = useCompanyModuleSettings();

  return (
    <div className="space-y-6 px-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Company Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage company-wide module availability and access controls.
          </p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Shield className="h-3.5 w-3.5" />
          Head Office Control
        </Badge>
      </div>

      <ScrollableWrapper>
        <div className="space-y-6">
          <ModuleAccessCard
            modules={moduleSettings.modules}
            isFetching={moduleSettings.isFetching}
            isSaving={moduleSettings.isSaving}
            onToggle={moduleSettings.handleToggle}
          />
        </div>
      </ScrollableWrapper>
    </div>
  );
}
