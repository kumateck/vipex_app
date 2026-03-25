import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useListPermissionCatalogQuery } from '../../api/rbac.api';

function groupByModule(items: Array<{ key: string; description: string; group: string }>) {
  const grouped = new Map<string, Array<{ key: string; description: string; group: string }>>();
  for (const item of items) {
    const group = grouped.get(item.group) ?? [];
    group.push(item);
    grouped.set(item.group, group);
  }
  return [...grouped.entries()];
}

export function PermissionsPageContent() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useListPermissionCatalogQuery();

  const filtered = useMemo(() => {
    const all = data?.data ?? [];
    const query = search.trim().toLowerCase();
    if (!query) return all;
    return all.filter(
      (permission) =>
        permission.key.toLowerCase().includes(query) ||
        permission.description.toLowerCase().includes(query) ||
        permission.group.toLowerCase().includes(query),
    );
  }, [data, search]);

  const grouped = useMemo(() => groupByModule(filtered), [filtered]);

  return (
    <div className="w-full p-4 space-y-4">
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Permissions catalog</CardTitle>
          <Input placeholder="Search permissions..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading permissions...</p>
          ) : grouped.length === 0 ? (
            <p className="text-sm text-muted-foreground">No permissions found.</p>
          ) : (
            <div className="space-y-4">
              {grouped.map(([group, permissions]) => (
                <div key={group} className="space-y-2 rounded-md border p-3">
                  <h3 className="text-sm font-semibold">{group}</h3>
                  <div className="grid gap-2 md:grid-cols-2">
                    {permissions.map((permission) => (
                      <div key={permission.key} className="rounded border p-2 text-sm">
                        <div className="font-medium">{permission.key}</div>
                        <div className="text-muted-foreground">{permission.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
