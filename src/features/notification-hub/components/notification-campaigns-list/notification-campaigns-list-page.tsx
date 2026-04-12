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
  useListNotificationCampaignsQuery,
  useSendNotificationCampaignMutation,
  useSubmitNotificationCampaignMutation,
} from '../../api/notification-hub.api';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

function campaignStatusLabel(status: number) {
  if (status === 0) return 'Draft';
  if (status === 1) return 'Submitted';
  if (status === 2) return 'Approved';
  if (status === 3) return 'Rejected';
  if (status === 4) return 'Sent';
  return `Status ${status}`;
}

export function NotificationCampaignsListPage() {
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
  const [status, setStatus] = useState('all');

  const query = useMemo(
    () => ({
      page,
      pageSize: 20,
      search: search.trim() || undefined,
      filters: {
        channel: channel === 'all' ? undefined : channel,
        status: status === 'all' ? undefined : Number(status),
      },
    }),
    [page, search, channel, status],
  );

  const { data, isLoading } = useListNotificationCampaignsQuery(query);
  const [submitCampaign, { isLoading: isSubmitting }] = useSubmitNotificationCampaignMutation();
  const [sendCampaign, { isLoading: isSending }] = useSendNotificationCampaignMutation();
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const onSubmitCampaign = async (id: string) => {
    try {
      await submitCampaign({ id }).unwrap();
      toast.success('Campaign submitted for approval');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit campaign');
    }
  };

  const onSendCampaign = async (id: string) => {
    try {
      const result = await sendCampaign({ id }).unwrap();
      toast.success(`Campaign sent (${result.sentCount} sent, ${result.failedCount} failed)`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send campaign');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Notification Campaigns</CardTitle>
            <Button asChild>
              <Link to="/notification-hub/campaigns/new">Create campaign</Link>
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
                placeholder="Search campaign"
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
                value={status}
                onValueChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="0">Draft</SelectItem>
                  <SelectItem value="1">Submitted</SelectItem>
                  <SelectItem value="2">Approved</SelectItem>
                  <SelectItem value="3">Rejected</SelectItem>
                  <SelectItem value="4">Sent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6}>Loading campaigns...</TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell className="uppercase">{row.channel}</TableCell>
                      <TableCell>{row.audienceType}</TableCell>
                      <TableCell>{row.templateName ?? '-'}</TableCell>
                      <TableCell>{campaignStatusLabel(row.status)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {row.status === 0 || row.status === 3 ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onSubmitCampaign(row.id)}
                            disabled={isSubmitting || isSending}
                          >
                            Submit
                          </Button>
                        ) : null}
                        {row.status === 2 ? (
                          <Button
                            size="sm"
                            onClick={() => onSendCampaign(row.id)}
                            disabled={isSubmitting || isSending}
                          >
                            Send
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>No campaigns found.</TableCell>
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
