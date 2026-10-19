import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { toast } from 'sonner';
import type { Dispatch, SetStateAction } from 'react';

export function createCommunicationSidebarActions(input: {
  navigate: (path: string, options?: { state?: Record<string, unknown> }) => void;
  directThreadByUserId: Map<string, { id: string; title?: string | null }>;
  activeCalls: Array<{ id: string; channelId: string | null }>;
  setStartingUserId: Dispatch<SetStateAction<string | null>>;
  setJoiningVoiceChannelId: Dispatch<SetStateAction<string | null>>;
  createThread: (payload: {
    threadType: 'direct';
    participantUserIds: string[];
    title: string | null;
  }) => { unwrap: () => Promise<{ id: string }> };
  joinVoiceChannel: (payload: { channelId: string }) => {
    unwrap: () => Promise<{ call: { id: string } }>;
  };
  markChannelRead: (payload: { id: string }) => { unwrap: () => Promise<unknown> };
  createEngagementRequest: (payload: { targetUserId: string; reasonNote?: string | null }) => {
    unwrap: () => Promise<unknown>;
  };
  approveEngagementRequest: (payload: { id: string }) => { unwrap: () => Promise<unknown> };
  declineEngagementRequest: (payload: { id: string }) => { unwrap: () => Promise<unknown> };
}) {
  const startDirectChat = async (user: {
    id: string;
    fullname?: string | null;
    email?: string | null;
  }) => {
    const userId = user.id;
    const optimisticTitle = user.fullname?.trim() || user.email?.trim() || null;
    const existingThread = input.directThreadByUserId.get(userId);
    if (existingThread?.id) {
      input.navigate(`/communication/chat/${existingThread.id}`, {
        state: { optimisticThreadTitle: optimisticTitle },
      });
      return;
    }
    input.setStartingUserId(userId);
    try {
      const thread = await input
        .createThread({
          threadType: 'direct',
          participantUserIds: [userId],
          title: optimisticTitle,
        })
        .unwrap();
      input.navigate(`/communication/chat/${thread.id}`, {
        state: { optimisticThreadTitle: optimisticTitle },
      });
    } catch (error) {
      const message = getApplicationErrorMessage(error, '') || 'Failed to open chat.';
      toast.error(message);
    } finally {
      input.setStartingUserId(null);
    }
  };

  const requestDirectChat = async (payload: {
    targetUserId: string;
    reasonNote?: string | null;
  }) => {
    try {
      await input.createEngagementRequest(payload).unwrap();
      toast.success('Chat request sent.');
    } catch (error) {
      const message = getApplicationErrorMessage(error, '') || 'Failed to send chat request.';
      toast.error(message);
    }
  };

  const approveChatRequest = async (id: string) => {
    try {
      await input.approveEngagementRequest({ id }).unwrap();
      toast.success('Chat request approved. Direct thread created.');
    } catch (error) {
      const message = getApplicationErrorMessage(error, '') || 'Failed to approve request.';
      toast.error(message);
    }
  };

  const declineChatRequest = async (id: string) => {
    try {
      await input.declineEngagementRequest({ id }).unwrap();
      toast.success('Chat request declined.');
    } catch (error) {
      const message = getApplicationErrorMessage(error, '') || 'Failed to decline request.';
      toast.error(message);
    }
  };

  const openTextChannel = (threadId: string | null) => {
    if (!threadId) {
      input.navigate('/communication/chat');
      return;
    }
    input.navigate(`/communication/chat/${threadId}`);
  };

  const openVoiceChannel = async (channelId: string) => {
    input.setJoiningVoiceChannelId(channelId);
    try {
      const activeCall = input.activeCalls.find((call) => call.channelId === channelId);
      if (activeCall) {
        await input.markChannelRead({ id: channelId }).unwrap();
        input.navigate(`/communication/calls/${activeCall.id}`);
        return;
      }
      const joined = await input.joinVoiceChannel({ channelId }).unwrap();
      await input.markChannelRead({ id: channelId }).unwrap();
      input.navigate(`/communication/calls/${joined.call.id}`);
    } catch (error) {
      const message = getApplicationErrorMessage(error, '') || 'Failed to join voice channel.';
      toast.error(message);
    } finally {
      input.setJoiningVoiceChannelId(null);
    }
  };

  const openCreateChannel = (channelType: 'text' | 'voice') => {
    input.navigate(`/communication/chat/create?target=channel&channelType=${channelType}`);
  };

  return {
    startDirectChat,
    requestDirectChat,
    approveChatRequest,
    declineChatRequest,
    openTextChannel,
    openVoiceChannel,
    openCreateChannel,
  };
}
