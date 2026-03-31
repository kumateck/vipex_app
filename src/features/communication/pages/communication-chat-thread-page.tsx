import { useParams } from 'react-router-dom';
import { CommunicationChatThreadDetailPage } from './communication-chat-thread-detail-page';

export function CommunicationChatThreadPage() {
  const params = useParams<{ threadId: string }>();
  if (!params.threadId) return null;
  return <CommunicationChatThreadDetailPage threadId={params.threadId} />;
}
