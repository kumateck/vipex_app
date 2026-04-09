import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DualListTransfer } from '@/components/ui/dual-list-transfer';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { Separator } from '@/components/ui/separator';
import { useListUserOptionsQuery } from '@/features/users/api/users.api';
import {
  useCreateCommunicationChannelMutation,
  useCreateCommunicationThreadMutation,
} from '../../api/communication.api';

type ThreadTypeCreate = 'direct' | 'group' | 'channel';

function asThreadType(value: string): ThreadTypeCreate {
  if (value === 'direct' || value === 'group' || value === 'channel') return value;
  return 'direct';
}

export function CommunicationChatCreatePage() {
  const navigate = useNavigate();
  const [createTarget, setCreateTarget] = useState<'conversation' | 'channel'>('conversation');
  const [newThreadType, setNewThreadType] = useState<ThreadTypeCreate>('direct');
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadParticipantIds, setNewThreadParticipantIds] = useState<string[]>([]);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [newChannelType, setNewChannelType] = useState<'text' | 'voice'>('text');
  const [newChannelVisibility, setNewChannelVisibility] = useState<'public' | 'private'>('public');
  const [newChannelParticipantIds, setNewChannelParticipantIds] = useState<string[]>([]);
  const { data: userOptions = [] } = useListUserOptionsQuery();
  const [createThread, { isLoading: isCreatingThread }] = useCreateCommunicationThreadMutation();
  const [createChannel, { isLoading: isCreatingChannel }] = useCreateCommunicationChannelMutation();

  const userTransferItems = useMemo(
    () =>
      userOptions.map((option) => ({
        id: option.id,
        label: option.fullname,
        subLabel: option.email,
      })),
    [userOptions],
  );

  const onCreateThread = async () => {
    if (!newThreadParticipantIds.length) {
      toast.error('Select at least one participant.');
      return;
    }

    try {
      const created = await createThread({
        threadType: newThreadType,
        title: newThreadTitle.trim() || null,
        participantUserIds: newThreadParticipantIds,
      }).unwrap();

      toast.success('Thread created.');
      navigate(`/communication/chat/${created.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create thread.');
    }
  };

  const onCreateChannel = async () => {
    if (!newChannelName.trim()) {
      toast.error('Channel name is required.');
      return;
    }
    if (newChannelVisibility === 'private' && !newChannelParticipantIds.length) {
      toast.error('Select participants for a private channel.');
      return;
    }

    try {
      const created = await createChannel({
        name: newChannelName.trim(),
        description: newChannelDescription.trim() || null,
        channelType: newChannelType,
        visibility: newChannelVisibility,
        participantUserIds:
          newChannelVisibility === 'private' ? newChannelParticipantIds : undefined,
        isCallEnabled: newChannelType === 'voice',
      }).unwrap();

      toast.success('Channel created.');
      if (created.channelType === 'text' && created.threadId) {
        navigate(`/communication/chat/${created.threadId}`);
        return;
      }
      navigate('/communication/chat');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create channel.');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold">Create Thread</h1>
            <p className="text-sm text-muted-foreground">
              Start a conversation or create a text/voice channel.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/communication/chat')}>
            Back to Threads
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Thread Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Create</FieldLabel>
                <Select
                  value={createTarget}
                  onValueChange={(value) =>
                    setCreateTarget(value === 'channel' ? 'channel' : 'conversation')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conversation">Conversation</SelectItem>
                    <SelectItem value="channel">Channel</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {createTarget === 'conversation' ? (
                <>
                  <Field>
                    <FieldLabel>Type</FieldLabel>
                    <Select
                      value={newThreadType}
                      onValueChange={(value) => setNewThreadType(asThreadType(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direct">Direct</SelectItem>
                        <SelectItem value="group">Group</SelectItem>
                        <SelectItem value="channel">Channel</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>Title (optional)</FieldLabel>
                    <Input
                      value={newThreadTitle}
                      onChange={(event) => setNewThreadTitle(event.target.value)}
                      placeholder="Thread title"
                    />
                  </Field>

                  <Field className="md:col-span-2">
                    <FieldLabel>Participants</FieldLabel>
                    <DualListTransfer
                      items={userTransferItems}
                      selectedIds={newThreadParticipantIds}
                      onSelectedIdsChange={setNewThreadParticipantIds}
                      leftTitle="Not In"
                      rightTitle="In"
                    />
                  </Field>
                </>
              ) : (
                <>
                  <Field>
                    <FieldLabel>Channel Type</FieldLabel>
                    <Select
                      value={newChannelType}
                      onValueChange={(value) =>
                        setNewChannelType(value === 'voice' ? 'voice' : 'text')
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="voice">Voice</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>Visibility</FieldLabel>
                    <Select
                      value={newChannelVisibility}
                      onValueChange={(value) =>
                        setNewChannelVisibility(value === 'private' ? 'private' : 'public')
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>Name</FieldLabel>
                    <Input
                      value={newChannelName}
                      onChange={(event) => setNewChannelName(event.target.value)}
                      placeholder="Channel name"
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Description (optional)</FieldLabel>
                    <Input
                      value={newChannelDescription}
                      onChange={(event) => setNewChannelDescription(event.target.value)}
                      placeholder="Description"
                    />
                  </Field>

                  {newChannelVisibility === 'private' ? (
                    <Field className="md:col-span-2">
                      <FieldLabel>Participants</FieldLabel>
                      <DualListTransfer
                        items={userTransferItems}
                        selectedIds={newChannelParticipantIds}
                        onSelectedIdsChange={setNewChannelParticipantIds}
                        leftTitle="Not In"
                        rightTitle="In"
                      />
                    </Field>
                  ) : null}
                </>
              )}
            </FieldGroup>

            <Separator />

            <div className="flex gap-2">
              {createTarget === 'conversation' ? (
                <Button
                  onClick={onCreateThread}
                  disabled={!newThreadParticipantIds.length || isCreatingThread}
                >
                  {isCreatingThread ? 'Creating...' : 'Create conversation'}
                </Button>
              ) : (
                <Button
                  onClick={onCreateChannel}
                  disabled={
                    !newChannelName.trim() ||
                    isCreatingChannel ||
                    (newChannelVisibility === 'private' && !newChannelParticipantIds.length)
                  }
                >
                  {isCreatingChannel ? 'Creating...' : 'Create channel'}
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate('/communication/chat')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
