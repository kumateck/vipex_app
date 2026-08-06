import { useState } from 'react';
import type { CommunicationChannel } from '../../../api/communication.api';
import {
  changePresenceStatus,
  joinVoiceChannelAndNavigate,
} from '../services/communication-chat-actions';
import type { PresenceStatus } from '../types/communication-chat.types';

type UseCommunicationChatActionsParams = {
  setPresence: (status: PresenceStatus) => void;
  setPresenceRequest: (args: { status: PresenceStatus }) => { unwrap: () => Promise<unknown> };
  joinVoiceChannel: (args: { channelId: string }) => {
    unwrap: () => Promise<{ call: { id: string } }>;
  };
  markChannelRead: (args: { id: string }) => { unwrap: () => Promise<unknown> };
  navigate: (path: string) => void;
};

export function useCommunicationChatActions({
  setPresence,
  setPresenceRequest,
  joinVoiceChannel,
  markChannelRead,
  navigate,
}: UseCommunicationChatActionsParams) {
  const [presenceStatus, setPresenceStatus] = useState<PresenceStatus>('online');
  const [joiningVoiceChannelId, setJoiningVoiceChannelId] = useState<string | null>(null);

  const onChangePresence = async (value: string) => {
    await changePresenceStatus({
      value,
      setPresenceStatus,
      setPresence,
      setPresenceRequest,
    });
  };

  const onJoinVoiceChannel = async (channel: CommunicationChannel) => {
    await joinVoiceChannelAndNavigate({
      channel,
      setJoiningVoiceChannelId,
      joinVoiceChannel,
      markChannelRead,
      navigate,
    });
  };

  return {
    presenceStatus,
    joiningVoiceChannelId,
    onChangePresence,
    onJoinVoiceChannel,
  };
}
