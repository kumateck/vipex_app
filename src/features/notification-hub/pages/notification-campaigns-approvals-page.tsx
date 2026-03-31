import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useApproveNotificationCampaignMutation,
  useListNotificationCampaignsQuery,
  useRejectNotificationCampaignMutation,
} from '../api/notification-hub.api';

export function NotificationCampaignsApprovalsPage() {
  const [search, setSearch] = useState('');
  const query = useMemo(
    () => ({
      page: 1,
      pageSize: 100,
      search: search.trim() || undefined,
      filters: { pendingOnly: true },
    }),
    [search],
  );
  const { data, isLoading } = useListNotificationCampaignsQuery(query);
  const [approveCampaign, { isLoading: isApproving }] = useApproveNotificationCampaignMutation();
  const [rejectCampaign, { isLoading: isRejecting }] = useRejectNotificationCampaignMutation();
  const rows = data?.data ?? [];

  const onApprove = async (id: string) => {
    try {
      await approveCampaign({ id }).unwrap();
      toast.success('Campaign approved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve campaign');
    }
  };

  const onReject = async (id: string) => {
    const reason = window.prompt('Rejection note');
    if (!reason?.trim()) return;
    try {
      await rejectCampaign({ id, note: reason.trim() }).unwrap();
      toast.success('Campaign rejected');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reject campaign');
    }
  };

  return (
    <div className="w-full p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Campaign Approvals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search submitted campaigns"
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>Loading approvals...</TableCell>
                </TableRow>
              ) : rows.length ? (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell className="uppercase">{row.channel}</TableCell>
                    <TableCell>{row.audienceType}</TableCell>
                    <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        onClick={() => onApprove(row.id)}
                        disabled={isApproving || isRejecting}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onReject(row.id)}
                        disabled={isApproving || isRejecting}
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5}>No campaigns pending approval.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
