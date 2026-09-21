import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
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
  useListNotificationTemplatesQuery,
  useUpdateNotificationTemplateMutation,
} from '../../api/notification-hub.api';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function NotificationTemplatesListPage() {
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

  const { data, isLoading } = useListNotificationTemplatesQuery(query);
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateNotificationTemplateMutation();
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const onToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateTemplate({ id, body: { isActive: !isActive } }).unwrap();
      toast.success(`Template ${isActive ? 'deactivated' : 'activated'}`);
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to update template');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Notification Templates</CardTitle>
            <Button asChild>
              <Link to="/notification-hub/templates/new">Add template</Link>
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
                placeholder="Search template"
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
                  <TableHead>Code</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6}>Loading templates...</TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.code}</TableCell>
                      <TableCell className="uppercase">{row.channel}</TableCell>
                      <TableCell>{row.subject ?? '-'}</TableCell>
                      <TableCell>{row.isActive ? 'Active' : 'Inactive'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/notification-hub/templates/edit/${row.id}`}>Edit</Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onToggleActive(row.id, row.isActive)}
                          disabled={isUpdating}
                        >
                          {row.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>No templates found.</TableCell>
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
