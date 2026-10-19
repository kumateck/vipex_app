import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useListUserOptionsQuery } from '@/features/users/api/users.api';
import {
  useCreateCommunicationCallMutation,
  useListCommunicationCallsQuery,
  useListCommunicationThreadsQuery,
  useUpdateCommunicationCallStatusMutation,
} from '../../api/communication.api';
import { useCommunicationSocket } from '../../hooks/use-communication-socket';
import {
  CALL_STATUSES,
  CALL_TYPES,
  formatDateTime,
  prettyValue,
} from './communication-calls-utils';

export function CommunicationCallsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createCallType, setCreateCallType] = useState<(typeof CALL_TYPES)[number]>('audio');
  const [createThreadId, setCreateThreadId] = useState<string>('__none__');
  const [createRoomName, setCreateRoomName] = useState('');

  const listQueryParams = useMemo(
    () => ({ status: statusFilter === 'all' ? undefined : statusFilter }),
    [statusFilter],
  );

  const {
    data: callSessions = [],
    isLoading,
    refetch,
  } = useListCommunicationCallsQuery(listQueryParams);
  const { data: threads = [] } = useListCommunicationThreadsQuery();
  const { data: userOptions = [] } = useListUserOptionsQuery();
  const [createCall, { isLoading: isCreating }] = useCreateCommunicationCallMutation();
  const [updateCallStatus, { isLoading: isUpdatingStatus }] =
    useUpdateCommunicationCallStatusMutation();
  const { isConnected: isSocketConnected } = useCommunicationSocket({
    onCallCreated: () => {
      refetch();
    },
    onCallUpdated: () => {
      refetch();
    },
  });

  const threadLabelById = useMemo(
    () =>
      new Map(
        threads.map((thread) => [
          thread.id,
          thread.title || `${prettyValue(thread.threadType)} thread`,
        ]),
      ),
    [threads],
  );

  const userLabelById = useMemo(
    () =>
      new Map(
        userOptions.map((option) => [option.id, option.fullname || option.email || 'Unknown user']),
      ),
    [userOptions],
  );

  const onCreateCall = async () => {
    try {
      await createCall({
        callType: createCallType,
        threadId: createThreadId === '__none__' ? null : createThreadId,
        livekitRoomName: createRoomName.trim() || null,
      }).unwrap();
      toast.success('Call session created.');
      setCreateRoomName('');
      setCreateThreadId('__none__');
      refetch();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to create call session.');
    }
  };

  const onChangeStatus = async (
    id: string,
    status: 'pending' | 'ringing' | 'active' | 'ended' | 'cancelled',
  ) => {
    try {
      await updateCallStatus({ id, status }).unwrap();
      toast.success(`Call marked as ${prettyValue(status)}.`);
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to update call status.');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold">Calls</h1>
            <p className="text-sm text-muted-foreground">
              Monitor voice/video call sessions and create new LiveKit call sessions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isSocketConnected ? 'default' : 'outline'}>
              {isSocketConnected ? 'Socket live' : 'Socket offline'}
            </Badge>
            <Button variant="outline" onClick={() => refetch()}>
              Refresh calls
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Call Session</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup className="grid gap-4 md:grid-cols-4">
              <Field>
                <FieldLabel>Call type</FieldLabel>
                <Select
                  value={createCallType}
                  onValueChange={(value) => setCreateCallType(value as (typeof CALL_TYPES)[number])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CALL_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {prettyValue(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Thread (optional)</FieldLabel>
                <Select value={createThreadId} onValueChange={setCreateThreadId}>
                  <SelectTrigger>
                    <SelectValue placeholder="No thread" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No thread</SelectItem>
                    {threads.map((thread) => (
                      <SelectItem key={thread.id} value={thread.id}>
                        {thread.title || `${prettyValue(thread.threadType)} thread`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field className="md:col-span-2">
                <FieldLabel>LiveKit room name (optional)</FieldLabel>
                <Input
                  value={createRoomName}
                  onChange={(event) => setCreateRoomName(event.target.value)}
                  placeholder="e.g. support-room-2026-03-31"
                />
              </Field>
            </FieldGroup>

            <div className="mt-4">
              <Button onClick={onCreateCall} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create call session'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Call Sessions</CardTitle>
            <div className="w-[220px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  {CALL_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {prettyValue(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Thread</TableHead>
                  <TableHead>Initiator</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Ended</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9}>Loading calls...</TableCell>
                  </TableRow>
                ) : callSessions.length ? (
                  callSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>{prettyValue(session.callType)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{prettyValue(session.status)}</Badge>
                      </TableCell>
                      <TableCell>{session.livekitRoomName || '-'}</TableCell>
                      <TableCell>
                        {session.threadId
                          ? (threadLabelById.get(session.threadId) ?? 'Unknown thread')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {session.initiatorUserId
                          ? (userLabelById.get(session.initiatorUserId) ?? 'Unknown user')
                          : '-'}
                      </TableCell>
                      <TableCell>{formatDateTime(session.startedAt)}</TableCell>
                      <TableCell>{formatDateTime(session.endedAt)}</TableCell>
                      <TableCell>{formatDateTime(session.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Select
                            value={session.status}
                            onValueChange={(value) =>
                              onChangeStatus(
                                session.id,
                                value as 'pending' | 'ringing' | 'active' | 'ended' | 'cancelled',
                              )
                            }
                            disabled={isUpdatingStatus}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="ringing">Ringing</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="ended">Ended</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/communication/calls/${session.id}`}>Open room</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9}>No calls found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
