import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

type Target = 'conversation' | 'channel';
type ThreadType = 'direct' | 'group' | 'channel';
type ChannelType = 'text' | 'voice';

type ChatCreateDefaults = {
  target: Target;
  threadType: ThreadType;
  channelType: ChannelType;
  participantUserIds: string[];
};

export function useChatCreateDefaults(): ChatCreateDefaults {
  const [searchParams] = useSearchParams();

  return useMemo(() => {
    const targetParam = searchParams.get('target');
    const threadTypeParam = searchParams.get('threadType');
    const channelTypeParam = searchParams.get('channelType');

    const participantFromList = searchParams
      .getAll('participantUserId')
      .map((value) => value.trim())
      .filter(Boolean);
    const participantFromCsv = (searchParams.get('participantUserIds') ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    const target: Target = targetParam === 'channel' ? 'channel' : 'conversation';
    const threadType: ThreadType =
      threadTypeParam === 'group' || threadTypeParam === 'channel' ? threadTypeParam : 'direct';
    const channelType: ChannelType = channelTypeParam === 'voice' ? 'voice' : 'text';

    return {
      target,
      threadType,
      channelType,
      participantUserIds: Array.from(new Set([...participantFromList, ...participantFromCsv])),
    };
  }, [searchParams]);
}
