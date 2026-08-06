import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useListNotificationProvidersQuery,
  useSetDefaultNotificationProviderMutation,
  useUpdateNotificationProviderMutation,
} from '../../api/notification-hub.api';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function NotificationProvidersListPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  const [page, setPage] = useState(1);
  const [channel, setChannel] = useState('all');
  const [active, setActive] = useState('all');

  const query = useMemo(
    () => ({
      page,
      pageSize: 20,
      search: search.trim() || undefined,
      filters: {
        channel: channel === 'all' ? undefined : channel,
        isActive: active === 'all' ? undefined : active === 'true',
      },
    }),
    [page, search, channel, active],
  );

  const { data, isLoading } = useListNotificationProvidersQuery(query);
  const [updateProvider, { isLoading: isUpdating }] = useUpdateNotificationProviderMutation();
  const [setDefaultProvider, { isLoading: isSettingDefault }] =
    useSetDefaultNotificationProviderMutation();
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const onToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateProvider({ id, body: { isActive: !isActive } }).unwrap();
      toast.success(`Provider ${isActive ? 'deactivated' : 'activated'}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update provider');
    }
  };

  const onSetDefault = async (id: string) => {
    try {
      await setDefaultProvider({ id }).unwrap();
      toast.success('Default provider updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to set default provider');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Notification Providers</CardTitle>
            <Button asChild>
              <Link to="/notification-hub/providers/new">Add provider</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <Input
                value={searchInput}
                onChange={(event) => {
                  setSearchInput(event.target.value);
                  setPage(1);
                }}
                placeholder="Search provider"
                className="md:col-span-2"
              />
              <Select
                value={channel}
                onValueChange={(value) => {
                  setChannel(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All channels</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="momo">MoMo (Payments)</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={active}
                onValueChange={(value) => {
                  setActive(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Provider Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6}>Loading providers...</TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell className="uppercase">{row.channel}</TableCell>
                      <TableCell>{row.providerKey}</TableCell>
                      <TableCell>{row.isActive ? 'Active' : 'Inactive'}</TableCell>
                      <TableCell>{row.isDefault ? 'Yes' : 'No'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/notification-hub/providers/edit/${row.id}`}>Edit</Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onToggleActive(row.id, row.isActive)}
                          disabled={isUpdating || isSettingDefault}
                        >
                          {row.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onSetDefault(row.id)}
                          disabled={row.isDefault || isUpdating || isSettingDefault}
                        >
                          Set Default
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>No providers found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {meta?.page ?? 1} of {meta?.totalPages ?? 1}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((prev) => prev - 1)}
                  disabled={(meta?.page ?? 1) <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={(meta?.page ?? 1) >= (meta?.totalPages ?? 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
