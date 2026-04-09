import { toast } from 'sonner';
import type { CommunicationChannel } from '../../../api/communication.api';
import type { PresenceStatus } from '../types/communication-chat.types';

export async function changePresenceStatus(params: {
  value: string;
  setPresenceStatus: (value: PresenceStatus) => void;
  setPresence: (status: PresenceStatus) => void;
  setPresenceRequest: (args: { status: PresenceStatus }) => { unwrap: () => Promise<unknown> };
}) {
  const nextStatus = (
    ['online', 'away', 'busy', 'offline'].includes(params.value) ? params.value : 'online'
  ) as PresenceStatus;
  params.setPresenceStatus(nextStatus);
  params.setPresence(nextStatus);
  try {
    await params.setPresenceRequest({ status: nextStatus }).unwrap();
  } catch {
    return;
  }
}

export async function joinVoiceChannelAndNavigate(params: {
  channel: CommunicationChannel;
  setJoiningVoiceChannelId: (value: string | null) => void;
  joinVoiceChannel: (args: { channelId: string }) => {
    unwrap: () => Promise<{ call: { id: string } }>;
  };
  markChannelRead: (args: { id: string }) => { unwrap: () => Promise<unknown> };
  navigate: (path: string) => void;
}) {
  params.setJoiningVoiceChannelId(params.channel.id);
  try {
    const joined = await params.joinVoiceChannel({ channelId: params.channel.id }).unwrap();
    await params.markChannelRead({ id: params.channel.id }).unwrap();
    params.navigate(`/communication/calls/${joined.call.id}`);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to join voice channel.');
  } finally {
    params.setJoiningVoiceChannelId(null);
  }
}

export async function saveChannelMembers(params: {
  managingChannelId: string;
  initialParticipantUserIds: string[];
  channelMemberIds: string[];
  addParticipants: (args: { id: string; participantUserIds: string[] }) => {
    unwrap: () => Promise<unknown>;
  };
  removeParticipant: (args: { id: string; userId: string }) => { unwrap: () => Promise<unknown> };
  onSuccess: () => void;
}) {
  const initialIds = new Set(params.initialParticipantUserIds);
  const nextIds = new Set(params.channelMemberIds);
  const toAdd = [...nextIds].filter((id) => !initialIds.has(id));
  const toRemove = [...initialIds].filter((id) => !nextIds.has(id));

  try {
    if (toAdd.length) {
      await params
        .addParticipants({ id: params.managingChannelId, participantUserIds: toAdd })
        .unwrap();
    }

    for (const userId of toRemove) {
      await params.removeParticipant({ id: params.managingChannelId, userId }).unwrap();
    }

    toast.success('Channel members updated');
    params.onSuccess();
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to update channel members');
  }
}
