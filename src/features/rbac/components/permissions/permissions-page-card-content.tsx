import { CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MAIN_PERMISSION_TABS,
  type MainPermissionTab,
  type PermissionUiCatalogItem,
} from '@/shared/permissions/ui-metadata';
import { PermissionModuleSections } from './permission-module-sections';
import { PermissionSubdomainSidebar } from './permission-subdomain-sidebar';

type PermissionsPageCardContentProps = {
  roleId: string;
  isLoadingRolePermissions: boolean;
  filteredLength: number;
  activeMainTab: MainPermissionTab;
  activeSubdomain: string;
  byMainTab: Map<MainPermissionTab, PermissionUiCatalogItem[]>;
  subdomainsInActiveTab: { subdomain: string; permissions: PermissionUiCatalogItem[] }[];
  modulesInActiveSubdomain: { module: string; permissions: PermissionUiCatalogItem[] }[];
  activeSubdomainPermissionCount: number;
  canSetRolePermissions: boolean | undefined;
  selectedPermissionKeySet: Set<string>;
  onMainTabChange: (value: MainPermissionTab) => void;
  onSelectSubdomain: (subdomain: string) => void;
  onTogglePermission: (key: string, enabled: boolean) => void;
  onToggleModulePermissions: (permissions: PermissionUiCatalogItem[], enabled: boolean) => void;
};

export function PermissionsPageCardContent({
  roleId,
  isLoadingRolePermissions,
  filteredLength,
  activeMainTab,
  activeSubdomain,
  byMainTab,
  subdomainsInActiveTab,
  modulesInActiveSubdomain,
  activeSubdomainPermissionCount,
  canSetRolePermissions,
  selectedPermissionKeySet,
  onMainTabChange,
  onSelectSubdomain,
  onTogglePermission,
  onToggleModulePermissions,
}: PermissionsPageCardContentProps) {
  return (
    <CardContent>
      {!roleId ? (
        <p className="text-sm text-muted-foreground">Select a role to manage permissions.</p>
      ) : isLoadingRolePermissions ? (
        <p className="text-sm text-muted-foreground">Loading role permissions...</p>
      ) : filteredLength === 0 ? (
        <p className="text-sm text-muted-foreground">No permissions found.</p>
      ) : (
        <Tabs
          value={activeMainTab}
          onValueChange={(value) => onMainTabChange(value as MainPermissionTab)}
          className="space-y-4"
        >
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2">
            {MAIN_PERMISSION_TABS.map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          {MAIN_PERMISSION_TABS.map((tab) => (
            <TabsContent key={tab} value={tab}>
              {(byMainTab.get(tab) ?? []).length === 0 ? (
                <div className="rounded-md border p-3 text-sm text-muted-foreground">
                  No permissions in this section.
                </div>
              ) : (
                <div className="grid gap-3 rounded-md border p-3 md:grid-cols-[240px_1fr]">
                  <PermissionSubdomainSidebar
                    activeSubdomain={activeSubdomain}
                    domain={tab}
                    entries={subdomainsInActiveTab}
                    onSelectSubdomain={onSelectSubdomain}
                  />

                  <PermissionModuleSections
                    activeSubdomain={activeSubdomain}
                    activeSubdomainPermissionCount={activeSubdomainPermissionCount}
                    canSetRolePermissions={canSetRolePermissions}
                    modulesInActiveSubdomain={modulesInActiveSubdomain}
                    selectedPermissionKeySet={selectedPermissionKeySet}
                    onTogglePermission={onTogglePermission}
                    onToggleModulePermissions={onToggleModulePermissions}
                  />
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </CardContent>
  );
}
