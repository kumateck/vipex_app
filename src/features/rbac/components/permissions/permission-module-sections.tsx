import { Checkbox } from '@/components/ui/checkbox';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { cn } from '@/lib/utils';
import type { PermissionUiCatalogItem } from '@/shared/permissions/ui-metadata';

type ModuleEntry = {
  module: string;
  permissions: PermissionUiCatalogItem[];
};

type PermissionModuleSectionsProps = {
  activeSubdomain: string;
  activeSubdomainPermissionCount: number;
  canSetRolePermissions: boolean | undefined;
  modulesInActiveSubdomain: ModuleEntry[];
  selectedPermissionKeySet: Set<string>;
  onTogglePermission: (key: string, enabled: boolean) => void;
  onToggleModulePermissions: (permissions: PermissionUiCatalogItem[], enabled: boolean) => void;
};

export function PermissionModuleSections({
  activeSubdomain,
  activeSubdomainPermissionCount,
  canSetRolePermissions,
  modulesInActiveSubdomain,
  selectedPermissionKeySet,
  onTogglePermission,
  onToggleModulePermissions,
}: PermissionModuleSectionsProps) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{activeSubdomain || 'Permissions'}</h3>
      {modulesInActiveSubdomain.length > 0 ? (
        <p className="mb-3 text-xs text-muted-foreground">
          {modulesInActiveSubdomain.length} modules, {activeSubdomainPermissionCount} permissions
        </p>
      ) : null}
      <ScrollableWrapper>
        <div className="space-y-4 pr-1">
          {modulesInActiveSubdomain.map((entry) => {
            const selectedInModuleCount = entry.permissions.filter((permission) =>
              selectedPermissionKeySet.has(permission.key),
            ).length;
            const areAllInModuleSelected =
              entry.permissions.length > 0 && selectedInModuleCount === entry.permissions.length;
            const isSomeInModuleSelected = selectedInModuleCount > 0 && !areAllInModuleSelected;
            const moduleCheckboxState: boolean | 'indeterminate' = areAllInModuleSelected
              ? true
              : isSomeInModuleSelected
                ? 'indeterminate'
                : false;

            return (
              <div key={entry.module} className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold">{entry.module}</h4>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Checkbox
                      checked={moduleCheckboxState}
                      onCheckedChange={(checked) =>
                        onToggleModulePermissions(entry.permissions, checked === true)
                      }
                      disabled={!canSetRolePermissions}
                    />
                    <span>Check all in module</span>
                    <span>
                      ({selectedInModuleCount}/{entry.permissions.length})
                    </span>
                  </label>
                </div>
                <div className="space-y-2">
                  {entry.permissions.map((permission) => {
                    const isSelected = selectedPermissionKeySet.has(permission.key);
                    return (
                      <div
                        key={permission.key}
                        role="button"
                        tabIndex={canSetRolePermissions ? 0 : -1}
                        onClick={() => onTogglePermission(permission.key, !isSelected)}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter' && event.key !== ' ') return;
                          event.preventDefault();
                          onTogglePermission(permission.key, !isSelected);
                        }}
                        className={cn(
                          'flex items-start justify-between gap-3 rounded border p-3 text-sm transition-colors',
                          canSetRolePermissions ? 'cursor-pointer' : '',
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:bg-muted/40',
                        )}
                      >
                        <div>
                          <div className="font-medium">{permission.title}</div>
                          <div className="text-muted-foreground">
                            {permission.description} [{permission.domain} / {permission.subdomain} /{' '}
                            {permission.module}]
                          </div>
                          <div className="font-mono text-xs text-muted-foreground/80">
                            {permission.key}
                          </div>
                        </div>
                        <div onClick={(event) => event.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              onTogglePermission(permission.key, checked === true)
                            }
                            disabled={!canSetRolePermissions}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollableWrapper>
    </div>
  );
}
