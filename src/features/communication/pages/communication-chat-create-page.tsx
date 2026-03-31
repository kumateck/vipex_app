import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useListUserOptionsQuery } from '@/features/users/api/users.api';
import { useCreateCommunicationThreadMutation } from '../api/communication.api';

type ThreadTypeCreate = 'direct' | 'group' | 'channel';

function asThreadType(value: string): ThreadTypeCreate {
  if (value === 'direct' || value === 'group' || value === 'channel') return value;
  return 'direct';
}

export function CommunicationChatCreatePage() {
  const navigate = useNavigate();
  const [newThreadType, setNewThreadType] = useState<ThreadTypeCreate>('direct');
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadParticipantIds, setNewThreadParticipantIds] = useState<string[]>([]);
  const { data: userOptions = [] } = useListUserOptionsQuery();
  const [createThread, { isLoading: isCreatingThread }] = useCreateCommunicationThreadMutation();

  const onToggleParticipant = (userId: string, checked: boolean) => {
    setNewThreadParticipantIds((prev) => {
      if (checked) {
        if (prev.includes(userId)) return prev;
        return [...prev, userId];
      }
      return prev.filter((item) => item !== userId);
    });
  };

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

  return (
    <ScrollableWrapper>
      <div className="w-full space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold">Create Thread</h1>
            <p className="text-sm text-muted-foreground">
              Start a direct, group, or channel thread in a dedicated page.
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
                <div className="max-h-[55vh] space-y-2 overflow-y-auto rounded-md border p-2">
                  {userOptions.length ? (
                    userOptions.map((option) => {
                      const checked = newThreadParticipantIds.includes(option.id);
                      return (
                        <label
                          key={option.id}
                          className="flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 hover:bg-muted/40"
                        >
                          <span className="min-w-0 text-sm">
                            <span className="block truncate font-medium">{option.fullname}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {option.email}
                            </span>
                          </span>
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              onToggleParticipant(option.id, value === true)
                            }
                          />
                        </label>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">No users found.</p>
                  )}
                </div>
              </Field>
            </FieldGroup>

            <Separator />

            <div className="flex gap-2">
              <Button
                onClick={onCreateThread}
                disabled={!newThreadParticipantIds.length || isCreatingThread}
              >
                {isCreatingThread ? 'Creating...' : 'Create thread'}
              </Button>
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
