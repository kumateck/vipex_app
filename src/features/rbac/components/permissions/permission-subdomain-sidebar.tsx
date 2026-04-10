import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { cn } from '@/lib/utils';

type SubdomainEntry = {
  subdomain: string;
  permissions: unknown[];
};

type PermissionSubdomainSidebarProps = {
  activeSubdomain: string;
  domain: string;
  entries: SubdomainEntry[];
  onSelectSubdomain: (subdomain: string) => void;
};

export function PermissionSubdomainSidebar({
  activeSubdomain,
  domain,
  entries,
  onSelectSubdomain,
}: PermissionSubdomainSidebarProps) {
  return (
    <div className="border-r pr-3">
      <h3 className="mb-2 text-sm font-semibold">{domain} Subdomains</h3>
      <ScrollableWrapper>
        <div className="space-y-2 pr-1">
          {entries.map((entry) => (
            <button
              key={entry.subdomain}
              type="button"
              onClick={() => onSelectSubdomain(entry.subdomain)}
              className={cn(
                'w-full rounded-md border px-3 py-2 text-left text-sm transition-colors',
                activeSubdomain === entry.subdomain
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'hover:bg-muted',
              )}
            >
              <div className="font-medium">{entry.subdomain}</div>
              <div className="text-xs text-muted-foreground">
                {entry.permissions.length} permissions
              </div>
            </button>
          ))}
        </div>
      </ScrollableWrapper>
    </div>
  );
}
