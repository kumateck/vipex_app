import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SelfServiceDraftStatus } from '@/db/schemas/enums';
import {
  useClaimSelfServiceDraftMutation,
  useListSelfServiceDraftsQuery,
} from '../api/self-service-agent.api';

export function SelfServiceQueuePage() {
  const { data: drafts = [], isLoading } = useListSelfServiceDraftsQuery();
  const [claimDraft, { isLoading: isClaiming }] = useClaimSelfServiceDraftMutation();
  const navigate = useNavigate();

  const handleOpen = async (draftId: string, status: number) => {
    try {
      if (status === SelfServiceDraftStatus.PENDING) {
        await claimDraft(draftId).unwrap();
      }
      navigate(`/parcels/self-service/${draftId}`);
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to open this booking draft');
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Self-Service Bookings</CardTitle>
          <CardDescription>
            Parcels submitted by customers through the self-service link, waiting to be completed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-6 w-6" />
            </div>
          ) : drafts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No pending self-service bookings for your branch.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sender</TableHead>
                  <TableHead>Receiver</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drafts.map((draft) => (
                  <TableRow key={draft.id}>
                    <TableCell>
                      <div className="font-medium">{draft.senderFullname}</div>
                      <div className="text-xs text-muted-foreground">{draft.senderPhone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{draft.receiverFullname}</div>
                      <div className="text-xs text-muted-foreground">{draft.receiverPhone}</div>
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate">{draft.parcelContent}</TableCell>
                    <TableCell>GH₵{(draft.parcelValuePsw / 100).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          draft.status === SelfServiceDraftStatus.CLAIMED ? 'secondary' : 'outline'
                        }
                      >
                        {draft.status === SelfServiceDraftStatus.CLAIMED ? 'Claimed' : 'New'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(draft.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        disabled={isClaiming}
                        onClick={() => handleOpen(draft.id, draft.status)}
                      >
                        Complete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
