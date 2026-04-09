import { CommunicationChatThreadDetail } from './components/communication-chat-thread-detail';

export function CommunicationChatThreadDetailPage({ threadId }: { threadId: string }) {
  return <CommunicationChatThreadDetail threadId={threadId} />;
}
